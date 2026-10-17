import test from 'node:test'
import assert from 'node:assert/strict'
import {mailboxEvaluationCases,scoreMailboxEvaluation} from '../scripts/mailbox-evaluation-cases.ts'
test('evaluation detects false positives, absent results and invented draft conditions',()=>{
 const cases=mailboxEvaluationCases.filter(c=>['invoice','missing-year','full-enquiry'].includes(c.id));
 const score=scoreMailboxEvaluation(cases,[{id:'invoice',kind:'booking',reason:'Wrong category'},{id:'missing-year',kind:'booking',reason:'Invented year',draft:{...({} as any),eventDate:'2026-10-24'}}],true);
 assert.equal(score.falsePositive,1);assert.equal(score.falseNegative,1);
 assert.ok(score.failures.find(f=>f.id==='missing-year')?.issues.includes('eventDate'));
 assert.ok(score.failures.find(f=>f.id==='full-enquiry')?.issues.includes('result_count'));
})
test('evaluation requires exact IDs and counts correct labelled results without calling a model',()=>{
 const cases=mailboxEvaluationCases.filter(c=>!c.draft);
 const results=cases.map(c=>({id:c.id,kind:c.kind,reason:'Synthetic expected output'}));
 assert.equal(scoreMailboxEvaluation(cases,results).passed,cases.length);
 assert.ok(scoreMailboxEvaluation(cases,[...results,{id:'invented',kind:'other',reason:'Extra'}]).failures.some(f=>f.issues.includes('unknown_id')));
 assert.equal(new Set(mailboxEvaluationCases.map(c=>c.id)).size,mailboxEvaluationCases.length);
})
