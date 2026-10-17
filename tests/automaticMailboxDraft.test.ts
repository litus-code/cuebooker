import test from 'node:test';
import assert from 'node:assert/strict';
import {automaticMailboxDraft} from '../supabase/functions/_shared/automaticMailboxDraft.ts';
const draft={eventDate:null,startTime:'23:00',endTime:'01:00',venue:'Sala',city:null,offerAmountMinor:220000,currency:'EUR',artistName:null,contactPhone:null,warnings:['Revisa la fecha.']};
test('ambiguous date preserves offer and original uncertainty without fabricating a schedule',()=>{const d=automaticMailboxDraft(draft);assert.equal(d.eventDate,null);assert.equal(d.startTime,null);assert.equal(d.endTime,null);assert.equal(d.offerAmountMinor,220000);assert.equal(d.artistName,null);assert.deepEqual(d.warnings,['Revisa la fecha.']);assert.equal(draft.startTime,'23:00')});
test('known local hours are preserved as unconfirmed data with a timezone warning',()=>{const d=automaticMailboxDraft({...draft,eventDate:'2026-11-04'});assert.equal(d.startTime,'23:00');assert.equal(d.endTime,'01:00');assert.ok(d.warnings.some(w=>w.includes('zona horaria')))});
test('unknown currency cannot create an invented EUR offer',()=>{const d=automaticMailboxDraft({...draft,currency:null});assert.equal(d.offerAmountMinor,null);assert.equal(d.currency,null)});
