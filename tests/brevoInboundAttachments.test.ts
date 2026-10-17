import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(readFileSync('supabase/functions/ingest-booking-email/index.ts', 'utf8')
  .replace(/^import "jsr:[^\n]+\n/, ''), { mode: 'transform' })
const token = '10000000-0000-4000-8000-000000000001'
const pdf = new TextEncoder().encode('%PDF-1.7\nfictional document')
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])
const canary = 'PRIVATE_PROVIDER_BODY_OR_CREDENTIAL'

function fixture() {
  const env: Record<string, string> = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fictional-service',
    CUEBOOKER_INBOUND_WEBHOOK_SECRET: 'fictional-webhook', BREVO_API_KEY: 'fictional-provider', CUEBOOKER_EMAIL_ATTACHMENTS_ENABLED: 'true' }
  const state = { rpcCalls: 0, created: false, downloads: [] as string[], uploads: [] as string[], saved: new Set<number>(),
    metadata: [] as any[], logs: [] as string[], pending: [] as Promise<unknown>[], failDownload: new Set<string>(),
    body: pdf, failRpc: false, failDispatch: false, streamTooLarge: false }
  let handler: (request: Request) => Promise<Response>
  const fetcher = async (input: string, init: RequestInit = {}) => {
    const url = new URL(input), headers = new Headers(init.headers)
    if (url.hostname === 'api.brevo.com') {
      assert.equal(headers.get('api-key'), env.BREVO_API_KEY)
      assert.equal(init.redirect, 'error')
      assert.ok(init.signal)
      const name = decodeURIComponent(url.pathname.split('/').at(-1)!)
      state.downloads.push(name)
      if (state.failDownload.has(name)) throw new Error(canary)
      if (state.streamTooLarge) return new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(5 * 1024 * 1024 + 1)); c.close() } }))
      return new Response(name === 'png' ? png : state.body)
    }
    assert.equal(url.hostname, 'db.invalid')
    assert.equal(headers.get('authorization'), 'Bearer fictional-service')
    if (url.pathname === '/rest/v1/email_messages') return Response.json([{ id: 'outbound', workspace_id: 'workspace', booking_id: 'booking', contact_id: 'contact', to_email: 'promoter@example.invalid', created_by: null }])
    if (url.pathname === '/rest/v1/rpc/ingest_booking_email_message') {
      state.rpcCalls++
      const body = JSON.parse(String(init.body))
      assert.equal(body.target_workspace_id, 'workspace'); assert.equal(body.target_booking_id, 'booking')
      assert.equal(body.target_provider_message_id, 'provider-message'); assert.equal(body.target_provider, 'brevo')
      if (state.failRpc) return new Response(canary, { status: 500 })
      const created = !state.created; state.created = true
      return Response.json([{ email_message_id: 'inbound', email_created: created, activity_created: created }])
    }
    if (url.pathname === '/rest/v1/booking_email_attachments') {
      if (init.method !== 'POST') {
        assert.equal(url.searchParams.get('email_message_id'), 'eq.inbound')
        const index = Number(url.searchParams.get('attachment_index')!.slice(3))
        return Response.json(state.saved.has(index) ? [{ id: 'attachment' }] : [])
      }
      const data = JSON.parse(String(init.body))
      assert.equal(data.workspace_id, 'workspace'); assert.equal(data.booking_id, 'booking')
      assert.equal(data.email_message_id, 'inbound')
      assert.equal(data.storage_path, `workspace/inbound/${data.attachment_index}`)
      state.saved.add(data.attachment_index); state.metadata.push(data)
      return new Response(null, { status: 201 })
    }
    if (url.pathname.startsWith('/storage/v1/object/booking-email-attachments/')) {
      assert.equal(init.method, 'POST'); state.uploads.push(url.pathname)
      return Response.json({ stored: true })
    }
    if (url.pathname === '/functions/v1/dispatch-notification-emails') return state.failDispatch ? new Response(canary, { status: 500 }) : Response.json({ accepted: true })
    throw new Error('Unexpected API')
  }
  runInNewContext(source, { Request, Response, Headers, URL, Uint8Array, TextEncoder, AbortSignal, Error, crypto,
    fetch: fetcher, Deno: { env: { get: (key: string) => env[key] }, serve: (fn: typeof handler) => { handler = fn } },
    EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => state.pending.push(promise) },
    console: { log: (...values: unknown[]) => state.logs.push(values.join(' ')), error: (...values: unknown[]) => state.logs.push(values.join(' ')) } })
  const item = { Recipients: [`booking+${token}@reply.example.invalid`], MessageId: 'provider-message', From: { Address: 'promoter@example.invalid' },
    RawTextBody: 'Fictional proposal', Subject: 'Fictional event', Attachments: [{ DownloadToken: 'pdf', ContentType: 'application/pdf', ContentLength: pdf.length, Name: '../offer.pdf' }] }
  async function run(value: any = item, secret = 'fictional-webhook') {
    const response = await handler!(new Request('https://db.invalid/webhook', { method: 'POST', headers: { 'x-cuebooker-webhook-secret': secret }, body: JSON.stringify({ items: [value] }) }))
    await Promise.all(state.pending)
    return response
  }
  return { state, env, item, run }
}

test('Brevo reply stores exact-message attachments once across provider redelivery', async () => {
  const f = fixture()
  assert.equal((await f.run()).status, 200)
  assert.equal(f.state.uploads.length, 1); assert.equal(f.state.metadata.length, 1)
  assert.equal(f.state.metadata[0].content_type, 'application/pdf')
  assert.equal(f.state.metadata[0].file_name, '.._offer.pdf')
  assert.equal((await (await f.run()).json()).accepted, 0)
  assert.equal(f.state.rpcCalls, 2); assert.equal(f.state.downloads.length, 1)
  assert.equal(f.state.uploads.length, 1); assert.equal(f.state.metadata.length, 1)
})

test('Brevo rejects unauthorized sender/webhook before attachment reads and keeps the feature gated', async () => {
  const f = fixture()
  assert.equal((await f.run(f.item, 'wrong')).status, 401)
  assert.equal((await (await f.run({ ...f.item, From: 'other@example.invalid' })).json()).ignored, 1)
  assert.equal(f.state.rpcCalls, 0); assert.equal(f.state.downloads.length, 0)
  f.env.CUEBOOKER_EMAIL_ATTACHMENTS_ENABLED = 'false'
  assert.equal((await f.run()).status, 200); assert.equal(f.state.rpcCalls, 1)
  assert.equal(f.state.downloads.length, 0); assert.equal(f.state.metadata.length, 0)
})

test('Brevo partial attachment failure preserves the message and retries only the missing document', async () => {
  const f = fixture()
  f.item.Attachments.push({ DownloadToken: 'png', ContentType: 'image/png', ContentLength: png.length, Name: 'image.png' })
  f.state.failDownload.add('pdf')
  assert.equal((await f.run()).status, 200)
  assert.deepEqual([...f.state.saved], [1]); assert.equal(f.state.created, true)
  f.state.failDownload.clear()
  assert.equal((await (await f.run()).json()).accepted, 0)
  assert.deepEqual([...f.state.saved].sort(), [0, 1]); assert.equal(f.state.uploads.length, 2)
  assert.equal(f.state.downloads.filter(x => x === 'png').length, 1)
  assert.equal(f.state.logs.join(' ').includes(canary), false)
})

test('Brevo rejects unsupported MIME, declared or actual oversize and false file signatures', async () => {
  for (const change of [ { ContentType: 'image/webp' }, { ContentLength: 5 * 1024 * 1024 + 1 }, { ContentLength: 0 } ]) {
    const f = fixture(); Object.assign(f.item.Attachments[0], change)
    assert.equal((await f.run()).status, 200); assert.equal(f.state.downloads.length, 0)
    assert.equal(f.state.uploads.length, 0)
  }
  const oversized = fixture(); oversized.state.streamTooLarge = true
  assert.equal((await oversized.run()).status, 200); assert.equal(oversized.state.uploads.length, 0)
  const invalid = fixture(); invalid.item.Attachments[0].ContentType = 'image/png'
  invalid.state.body = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0, 0])
  assert.equal((await invalid.run()).status, 200); assert.equal(invalid.state.uploads.length, 0)
})

test('Brevo processes at most ten attachment positions in one received message', async () => {
  const f = fixture()
  f.item.Attachments = Array.from({ length: 12 }, (_, index) => ({ DownloadToken: `pdf-${index}`, ContentType: 'application/pdf', ContentLength: pdf.length, Name: 'offer.pdf' }))
  assert.equal((await f.run()).status, 200)
  assert.equal(f.state.downloads.length, 10); assert.equal(f.state.metadata.length, 10)
  assert.deepEqual([...f.state.saved], Array.from({ length: 10 }, (_, index) => index))
})

test('Brevo never logs provider/database/notification bodies or arbitrary exception text', async () => {
  const dbFailure = fixture(); dbFailure.state.failRpc = true
  const response = await dbFailure.run(); assert.equal(response.status, 500)
  assert.equal((await response.text()).includes(canary), false)
  assert.equal(dbFailure.state.logs.join(' ').includes(canary), false)
  assert.match(dbFailure.state.logs.join(' '), /supabase_500/)
  const dispatch = fixture(); dispatch.state.failDispatch = true
  assert.equal((await dispatch.run()).status, 200)
  assert.equal(dispatch.state.logs.join(' ').includes(canary), false)
  assert.match(dispatch.state.logs.join(' '), /notification_dispatch_500/)
})
