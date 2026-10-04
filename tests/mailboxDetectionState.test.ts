import test from 'node:test';
import assert from 'node:assert/strict';
import {mailboxDetectionState} from '../supabase/functions/_shared/mailboxDetectionState.ts';
const now=Date.parse('2026-10-04T17:00:00Z');
const input={available:true,status:'connected',enabled:true,revision:'revision',transport:'gmail',failed:0,now,watch:{state:'ready',consent_revision:'revision',history_id:'123',watch_expires_at:'2026-10-05T17:00:00Z',updated_at:'2026-10-04T17:00:00Z'}};
test('active detection requires operator readiness, consent, current watch and no unresolved processing failure',()=>{
 assert.equal(mailboxDetectionState(input),'active');
 assert.equal(mailboxDetectionState({...input,available:false}),'unavailable');
 assert.equal(mailboxDetectionState({...input,enabled:false}),'inactive');
 assert.equal(mailboxDetectionState({...input,failed:1}),'paused');
 assert.equal(mailboxDetectionState({...input,delayed:true}),'paused');
 assert.equal(mailboxDetectionState({...input,stalled:true}),'paused');
 assert.equal(mailboxDetectionState({...input,status:'reconnect_required'}),'reconnect_required');
 assert.equal(mailboxDetectionState({...input,watch:undefined}),'starting');
 assert.equal(mailboxDetectionState({...input,watch:{...input.watch,consent_revision:'old'}}),'starting');
 assert.equal(mailboxDetectionState({...input,watch:{...input.watch,state:'resync_required'}}),'paused');
 assert.equal(mailboxDetectionState({...input,watch:{...input.watch,watch_expires_at:'2026-10-03T17:00:00Z'}}),'paused');
 assert.equal(mailboxDetectionState({...input,watch:{...input.watch,updated_at:'2026-10-04T14:00:00Z'}}),'paused');
});
