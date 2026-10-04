import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mailboxReturnUrl, mailboxBrowserOrigin } from '../supabase/functions/_shared/mailboxReturnUrl.ts'
const prod='https://qlocooqfdzehogbwcbhr.supabase.co', stage='https://lycprjeuuynfzwskycwv.supabase.co'

test('mailbox callback and CORS bind exact destinations to backend environment',()=>{
 for(const [backend,target] of [[prod,'https://cuebooker.com/workspace/'],[stage,'https://staging.cuebooker.com/workspace/'],[stage,'https://pr-96.cuebooker-staging.pages.dev/workspace/']]){
  assert.equal(mailboxReturnUrl(backend,target)?.href,target)
  assert.equal(mailboxBrowserOrigin(backend,target),new URL(target).origin)
 }
 for(const target of ['https://staging.cuebooker.com/workspace/','https://pr-96.cuebooker-staging.pages.dev/workspace/','https://evil.invalid/workspace/','https://cuebooker.com.evil.invalid/workspace/','https://evil@cuebooker.com/workspace/','https://cuebooker.com/workspace/?to=evil','https://cuebooker.com/workspace/#fragment','http://cuebooker.com/workspace/','https://cuebooker.com/%77orkspace/'])assert.equal(mailboxReturnUrl(prod,target),null)
 assert.equal(mailboxReturnUrl(stage,'https://cuebooker.com/workspace/'),null)
 assert.equal(mailboxReturnUrl('https://unknown.invalid','https://cuebooker.com/workspace/'),null)
 assert.equal(mailboxBrowserOrigin(prod,''),'https://cuebooker.com')
 assert.equal(mailboxBrowserOrigin(stage,''),'https://staging.cuebooker.com')
 assert.equal(mailboxBrowserOrigin('https://unknown.invalid',''),null)
})
