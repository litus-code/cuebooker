import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const PRODUCTION_PROJECT = 'qlocooqfdzehogbwcbhr'

export function validateBackupInputs(dbUrl, passphrase) {
  let url
  try { url = new URL(dbUrl) } catch { throw new Error('Missing or invalid backup database connection.') }
  const direct = url.hostname === `db.${PRODUCTION_PROJECT}.supabase.co` && url.username === 'postgres'
  const pooler = url.hostname.endsWith('.pooler.supabase.com') && url.username === `postgres.${PRODUCTION_PROJECT}`
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || (!direct && !pooler)
    || url.pathname !== '/postgres' || (url.port && url.port !== '5432') || !url.password || url.hash) {
    throw new Error('Backup connection must target the production database using direct or session pooling.')
  }
  // Never silently accept disabled certificate/transport protection.
  const ssl = url.searchParams.get('sslmode')
  if (ssl && !['require', 'verify-ca', 'verify-full'].includes(ssl)) throw new Error('Backup connection requires SSL.')
  if ([...url.searchParams.keys()].some(key => key !== 'sslmode') || url.searchParams.getAll('sslmode').length > 1) {
    throw new Error('Backup connection accepts only an optional sslmode parameter.')
  }
  if (!ssl) url.searchParams.set('sslmode', 'require')
  if (typeof passphrase !== 'string' || passphrase.length < 32 || passphrase.length > 512 || /[\r\n\0]/.test(passphrase)) {
    throw new Error('Backup encryption requires an independent passphrase of at least 32 characters.')
  }
  let password
  try { password = decodeURIComponent(url.password) } catch { throw new Error('Invalid database password encoding.') }
  if (password === passphrase) throw new Error('Backup encryption must not reuse the database password.')
  return url.toString()
}

export function backupProduction({ dbUrl, passphrase, outputDir, run = spawnSync }) {
  const connection = validateBackupInputs(dbUrl, passphrase)
  // Only this freshly created directory ever contains plaintext database files.
  const temporaryDir = mkdtempSync(join(tmpdir(), 'cuebooker-production-backup-'))
  const childEnv = { ...process.env }
  delete childEnv.CUEBOOKER_BACKUP_DB_URL
  delete childEnv.CUEBOOKER_BACKUP_PASSPHRASE
  const execute = (command, args, options = {}) => {
    const result = run(command, args, { env: childEnv, encoding: 'utf8', maxBuffer: 1024 * 1024, ...options })
    // Suppress command output and errors: providers/tools may echo connection credentials.
    if (result.error || result.signal || result.status !== 0) throw new Error(`Backup operation failed (${command}). No database details were logged.`)
    return result.stdout || ''
  }
  let encryptedPath
  let checksumPath
  let published = false
  try {
    const version = execute('supabase', ['--version']).trim()
    if (version !== '2.79.0') throw new Error('Unexpected Supabase CLI version.')
    execute('supabase', ['db', 'dump', '--db-url', connection, '-f', join(temporaryDir, 'roles.sql'), '--role-only'])
    execute('supabase', ['db', 'dump', '--db-url', connection, '-f', join(temporaryDir, 'schema.sql')])
    execute('supabase', ['db', 'dump', '--db-url', connection, '-f', join(temporaryDir, 'data.sql'), '--data-only', '--use-copy', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes'])
    for (const name of ['roles.sql', 'schema.sql', 'data.sql']) {
      if (!readFileSync(join(temporaryDir, name)).length) throw new Error('Backup export produced an empty file.')
    }
    writeFileSync(join(temporaryDir, 'manifest.json'), JSON.stringify({
      project: PRODUCTION_PROJECT,
      createdAt: new Date().toISOString(),
      cliVersion: version,
      scope: 'Logical database roles, schema and data. Not Storage files or platform/provider configuration.',
      restoreTested: false,
    }, null, 2), { mode: 0o600 })
    const archive = join(temporaryDir, 'database.tar.gz')
    execute('tar', ['-czf', archive, '-C', temporaryDir, 'roles.sql', 'schema.sql', 'data.sql', 'manifest.json'])
    const encrypted = join(temporaryDir, 'database.tar.gz.gpg')
    const gpgBase = ['--batch', '--yes', '--pinentry-mode', 'loopback', '--passphrase-fd', '0', '--homedir', temporaryDir]
    execute('gpg', [...gpgBase, '--symmetric', '--cipher-algo', 'AES256', '--s2k-mode', '3', '--s2k-count', '65011712', '--output', encrypted, archive], { input: `${passphrase}\n` })
    const verified = join(temporaryDir, 'verified.tar.gz')
    execute('gpg', [...gpgBase, '--output', verified, '--decrypt', encrypted], { input: `${passphrase}\n` })
    if (!readFileSync(archive).equals(readFileSync(verified))) throw new Error('Backup encryption round-trip verification failed.')
    const bytes = readFileSync(encrypted)
    const checksum = createHash('sha256').update(bytes).digest('hex')
    mkdirSync(outputDir, { mode: 0o700 }) // Refuse to overwrite an existing backup directory.
    encryptedPath = join(outputDir, 'database.tar.gz.gpg')
    checksumPath = `${encryptedPath}.sha256`
    writeFileSync(encryptedPath, bytes, { mode: 0o600, flag: 'wx' })
    writeFileSync(checksumPath, `${checksum}  database.tar.gz.gpg\n`, { mode: 0o600, flag: 'wx' })
    published = true
  } finally {
    rmSync(temporaryDir, { recursive: true, force: true })
    if (!published) {
      if (encryptedPath) rmSync(encryptedPath, { force: true })
      if (checksumPath) rmSync(checksumPath, { force: true })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    backupProduction({
      dbUrl: process.env.CUEBOOKER_BACKUP_DB_URL,
      passphrase: process.env.CUEBOOKER_BACKUP_PASSPHRASE,
      outputDir: resolve('backup-output'),
    })
    console.log('Encrypted database export verified. No database restore was performed.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
