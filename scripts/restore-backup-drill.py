"""Restore one approved encrypted artifact into a disposable, disconnected local DB."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile

PROJECT = 'cuebooker-restore-drill'
CONTAINER = 'supabase_db_' + PROJECT
IDENT = r'(?:"[A-Za-z_][A-Za-z0-9_]*"|[A-Za-z_][A-Za-z0-9_]*)'
TABLE = rf'{IDENT}\.{IDENT}'


def copy_counts(sql):
    counts = {}
    current = None
    for line in sql.splitlines():
        if current is not None:
            if line == r'\.':
                current = None
            else:
                counts[current] += 1
        elif line.startswith('COPY '):
            match = re.fullmatch(rf'COPY ({TABLE}) \([^;]+\) FROM stdin;', line)
            if not match or match[1] in counts:
                raise RuntimeError('Unsupported or duplicate COPY block.')
            current = match[1]
            counts[current] = 0
    if current is not None or not counts:
        raise RuntimeError('Incomplete or missing COPY blocks.')
    return counts


def command(args, stage, *, cwd=None, input=None):
    env = {k: v for k, v in os.environ.items() if k not in
           ('CUEBOOKER_BACKUP_PASSPHRASE', 'CUEBOOKER_BACKUP_DB_URL')}
    try:
        result = subprocess.run(args, cwd=cwd, input=input, capture_output=True,
                                env=env, timeout=600)
    except Exception:
        raise RuntimeError(f'Restore drill failed during {stage}.') from None
    if result.returncode:
        # Never disclose tool output: it can contain rows, SQL or credentials.
        state = re.search(rb'ERROR:\s+([0-9A-Z]{5})(?:\s|:|$)', result.stderr)
        suffix = f' (SQLSTATE {state[1].decode()})' if state else ''
        if not suffix:
            for pattern, category in [(rb'No such file or directory', 'local socket unavailable'),
                                      (rb'password authentication failed', 'local authentication rejected'),
                                      (rb'connection refused', 'local database unavailable')]:
                if re.search(pattern, result.stderr, re.I):
                    suffix = f' ({category})'
                    break
        raise RuntimeError(f'Restore drill failed during {stage}{suffix}.')
    return result.stdout


def psql(sql, stage='verification'):
    return command(['docker', 'exec', '-i', '-e', 'PGPASSWORD=postgres', CONTAINER, 'psql', '-h', '127.0.0.1', '-X', '-qAt',
                    '-U', 'supabase_admin', '-d', 'postgres',
                    '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=sqlstate'],
                   stage, input=sql.encode()).decode().strip()


FK_CHECK = """
DO $$ DECLARE k record; joins text; required text; some_null text; some_set text; bad boolean;
BEGIN
 FOR k IN SELECT * FROM pg_constraint WHERE contype='f' AND connamespace IN
   (SELECT oid FROM pg_namespace WHERE nspname IN ('public','private')) LOOP
  SELECT string_agg(format('s.%I = t.%I',a.attname,b.attname),' AND '),
         string_agg(format('s.%I IS NOT NULL',a.attname),' AND '),
         string_agg(format('s.%I IS NULL',a.attname),' OR '),
         string_agg(format('s.%I IS NOT NULL',a.attname),' OR ')
    INTO joins,required,some_null,some_set
    FROM unnest(k.conkey,k.confkey) AS keys(src,dst)
    JOIN pg_attribute a ON a.attrelid=k.conrelid AND a.attnum=keys.src
    JOIN pg_attribute b ON b.attrelid=k.confrelid AND b.attnum=keys.dst;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s s WHERE (%s) AND NOT EXISTS (SELECT 1 FROM %s t WHERE %s))',
    k.conrelid::regclass,required,k.confrelid::regclass,joins) INTO bad;
  IF bad THEN RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='Restore relationship verification failed'; END IF;
  IF k.confmatchtype='f' THEN
   EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s s WHERE (%s) AND (%s))',k.conrelid::regclass,some_null,some_set) INTO bad;
   IF bad THEN RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='Restore relationship verification failed'; END IF;
  END IF;
 END LOOP;
END $$;
"""


def main():
    phrase = os.environ.get('CUEBOOKER_BACKUP_PASSPHRASE', '')
    if len(phrase) < 32 or any(c in phrase for c in '\r\n\0'):
        raise RuntimeError('Missing valid backup decryption passphrase.')
    artifact = Path('restore-input')
    encrypted = artifact / 'database.tar.gz.gpg'
    expected = (artifact / 'database.tar.gz.gpg.sha256').read_text().split()[0]
    if hashlib.sha256(encrypted.read_bytes()).hexdigest() != expected:
        raise RuntimeError('Encrypted backup checksum mismatch.')
    with tempfile.TemporaryDirectory(prefix='cuebooker-restore-') as tmp:
        work = Path(tmp)
        started = False
        try:
            if command(['supabase', '--version'], 'CLI version').strip() != b'2.79.0':
                raise RuntimeError('Unexpected CLI version.')
            command(['supabase', 'init'], 'local initialization', cwd=work)
            config = work / 'supabase/config.toml'
            text = config.read_text()
            text = re.sub(r'^project_id = .*$', f'project_id = "{PROJECT}"', text, flags=re.M)
            text = re.sub(r'^major_version = \d+$', 'major_version = 17', text, flags=re.M)
            text = text.replace('sql_paths = ["./seed.sql"]', 'sql_paths = []')
            config.write_text(text)
            started = True
            command(['supabase', 'db', 'start'], 'local database bootstrap', cwd=work)
            info = json.loads(command(['docker', 'inspect', CONTAINER], 'local isolation check'))[0]
            for network in info['NetworkSettings']['Networks']:
                command(['docker', 'network', 'disconnect', network, CONTAINER], 'network isolation')
            info = json.loads(command(['docker', 'inspect', CONTAINER], 'local isolation check'))[0]
            if info['NetworkSettings']['Networks']:
                raise RuntimeError('Local database remains network-connected.')
            if psql("SHOW server_version_num;", 'local version verification')[:2] != '17':
                raise RuntimeError('Restore target must be local PostgreSQL 17.')
            # Decrypt only after proving the target has no network connectivity.
            clear = work / 'database.tar.gz'
            command(['gpg', '--batch', '--yes', '--pinentry-mode', 'loopback',
                     '--homedir', str(work), '--passphrase-fd', '0', '--output',
                     str(clear), '--decrypt', str(encrypted.resolve())],
                    'decryption', input=(phrase + '\n').encode())
            with tarfile.open(clear, 'r:gz') as archive:
                members = archive.getmembers()
                names = {'roles.sql', 'schema.sql', 'data.sql', 'manifest.json'}
                if {m.name for m in members} != names or len(members) != 4 or any(
                        not m.isfile() or m.size > 100_000_000 for m in members):
                    raise RuntimeError('Unexpected backup archive contents.')
                files = {m.name: archive.extractfile(m).read() for m in members}
            manifest = json.loads(files['manifest.json'])
            if manifest.get('project') != 'qlocooqfdzehogbwcbhr' or manifest.get('cliVersion') != '2.79.0':
                raise RuntimeError('Unexpected backup project or tool version.')
            counts = copy_counts(files['data.sql'].decode())
            baseline = {}
            for table in counts:
                exists = psql(f"SELECT to_regclass('{table}') IS NOT NULL;") == 't'
                baseline[table] = int(psql(f'SELECT count(*) FROM {table};')) if exists else 0
            # psql -1 with stdin wraps the complete import in one transaction.
            sql = files['roles.sql'] + files['schema.sql'] + b'\nSET session_replication_role = replica;\n' + files['data.sql']
            command(['docker', 'exec', '-i', '-e', 'PGPASSWORD=postgres', CONTAINER, 'psql', '-h', '127.0.0.1', '-X', '-q', '-1',
                     '-U', 'supabase_admin', '-d', 'postgres', '--set', 'ON_ERROR_STOP=1',
                     '--set', 'VERBOSITY=sqlstate', '--file', '-'], 'roles/schema/data import', input=sql)
            for table, count in counts.items():
                if int(psql(f'SELECT count(*) FROM {table};')) != baseline[table] + count:
                    raise RuntimeError('Restored row counts do not match the archive.')
            for table in re.findall(rf'ALTER TABLE ({TABLE}) ENABLE ROW LEVEL SECURITY;', files['schema.sql'].decode()):
                if psql(f"SELECT relrowsecurity FROM pg_class WHERE oid='{table}'::regclass;") != 't':
                    raise RuntimeError('Restored RLS status mismatch.')
            psql(FK_CHECK, 'relationship verification')
            for table in ('public.workspaces', 'public.workspace_members', 'public.bookings'):
                if psql(f"SELECT relrowsecurity FROM pg_class WHERE oid='{table}'::regclass;") != 't':
                    raise RuntimeError('Private core table RLS is missing.')
                for role in ('anon', 'authenticated'):
                    # Permission denial is acceptable; permission plus visible rows is not.
                    allowed = psql(f"SELECT has_table_privilege('{role}','{table}','SELECT');") == 't'
                    if allowed and psql(f"BEGIN; SET LOCAL ROLE {role}; SELECT set_config('request.jwt.claims','{{}}',true); SELECT count(*) FROM {table}; ROLLBACK;").splitlines()[-1] != '0':
                        raise RuntimeError('Unidentified caller can read private restored records.')
            print('Isolated logical restore passed: import, all COPY row counts, foreign keys, RLS and unidentified-caller denial. No private data logged.')
        finally:
            if started:
                command(['supabase', 'stop', '--no-backup'], 'disposable database cleanup', cwd=work)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        # Only our authored RuntimeErrors are safe to print.
        print(str(exc) if isinstance(exc, RuntimeError) else 'Restore drill failed; private details suppressed.')
        raise SystemExit(1)
