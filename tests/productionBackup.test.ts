import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { backupProduction, classifyBackupFailure, validateBackupInputs } from '../scripts/backup-production.mjs'

const url = 'postgresql://postgres.qlocooqfdzehogbwcbhr:fictional-password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
const phrase = 'fictional-encryption-passphrase-for-tests-only'

test('backup rejects wrong project, transaction pooler, missing credentials and insecure SSL', () => {
  assert.match(validateBackupInputs(url, phrase), /sslmode=require/)
  for (const input of [url.replace('qlocooqfdzehogbwcbhr', 'lycprjeuuynfzwskycwv'), url.replace(':5432', ':6543'), url.replace('fictional-password', ''), `${url}?sslmode=disable`, 'not-a-url']) {
    assert.throws(() => validateBackupInputs(input, phrase))
  }
  assert.throws(() => validateBackupInputs(url, 'short'))
  assert.throws(() => validateBackupInputs(url, `${phrase}\n`))
  assert.throws(() => validateBackupInputs(`${url}?host=other.example`, phrase))
  assert.throws(() => validateBackupInputs(url.replace('fictional-password', phrase), phrase))
})

test('fictional export really encrypts/decrypts and publishes only encrypted archive/checksum', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cuebooker-backup-test-'))
  let temporaryDir = ''
  const calls: string[][] = []
  try {
    const outputDir = join(dir, 'output')
    backupProduction({ dbUrl: url, passphrase: phrase, outputDir, run(command, args, options) {
      if (command === 'supabase') {
        calls.push(args)
        if (args[0] === '--version') return { status: 0, stdout: '2.79.0\n' }
        const file = args[args.indexOf('-f') + 1]
        temporaryDir = file.slice(0, file.lastIndexOf('/'))
        writeFileSync(file, '-- fictional database export, no private data\n', { mode: 0o600 })
        assert.equal(options.env.CUEBOOKER_BACKUP_PASSPHRASE, undefined)
        return { status: 0, stdout: '' }
      }
      assert.ok(!args.includes(phrase))
      return spawnSync(command, args, options)
    } })
    assert.equal(calls.length, 4)
    assert.ok(calls.slice(1).every(args => args[0] === 'db' && args[1] === 'dump'))
    assert.deepEqual(readdirSync(outputDir).sort(), ['database.tar.gz.gpg', 'database.tar.gz.gpg.sha256'])
    assert.ok(readFileSync(join(outputDir, 'database.tar.gz.gpg')).length > 100)
    assert.equal(existsSync(temporaryDir), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('failed export suppresses credential-bearing errors and removes plaintext', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cuebooker-backup-failure-test-'))
  let temporaryDir = ''
  try {
    assert.throws(() => backupProduction({ dbUrl: url, passphrase: phrase, outputDir: join(dir, 'output'), run(command, args) {
      if (args[0] === '--version') return { status: 0, stdout: '2.79.0' }
      const file = args[args.indexOf('-f') + 1]
      temporaryDir = file.slice(0, file.lastIndexOf('/'))
      writeFileSync(file, 'fictional partial dump')
      return { status: 1, stderr: url, error: new Error(url) }
    } }), error => error.message === 'Backup operation failed (roles export): unclassified failure. No database details were logged.')
    assert.equal(existsSync(temporaryDir), false)
    assert.equal(existsSync(join(dir, 'output')), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('failure diagnostics classify known causes without returning private provider content', () => {
  const examples = [
    ['password authentication failed', 'database authentication rejected'],
    ['Tenant or user not found', 'pooler tenant or user not found'],
    ['could not translate host name', 'database host lookup failed'],
    ['connection timed out', 'database connection unavailable'],
    ['certificate verify failed', 'database TLS verification failed'],
    ['server version mismatch', 'database dump version mismatch'],
    ['permission denied', 'database export permission denied'],
    ['Cannot connect to the Docker daemon', 'backup container runtime unavailable'],
    ['failed to pull image', 'backup container image unavailable'],
    ['unexpected provider message', 'unclassified failure'],
  ]
  for (const [cause, category] of examples) {
    const result = classifyBackupFailure({ stderr: `${cause} ${url} ${phrase}` })
    assert.equal(result, category)
    assert.ok(!result.includes(url) && !result.includes(phrase))
  }
})

test('workflow is manual, protected and uploads no SQL/source/plaintext', () => {
  const workflow = readFileSync(new URL('../.github/workflows/backup-production.yml', import.meta.url), 'utf8')
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /environment: production/)
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/)
  assert.match(workflow, /contents: read/)
  assert.match(workflow, /retention-days: 7/)
  assert.doesNotMatch(workflow, /pull_request:|push:|schedule:|contents: write|db push|db reset/)
  const upload = workflow.slice(workflow.indexOf('      - name: Upload'))
  assert.doesNotMatch(upload, /\.sql|path: \./)
  assert.match(upload, /backup-output\/database\.tar\.gz\.gpg/)
})
