import {validateMailboxDraft} from './mailboxBookingDraft.ts';
import type {MailboxBookingDraft} from './mailboxBookingDraft.ts';

// Preserve uncertainty without inventing a date, timezone, currency or timetable.
export function automaticMailboxDraft(value:MailboxBookingDraft){
 const draft={...validateMailboxDraft(value),warnings:[...value.warnings]};
 if(!draft.eventDate){draft.startTime=null;draft.endTime=null;}
 // Local times cannot safely become a calendar schedule without a known timezone.
 if(draft.startTime||draft.endTime){draft.warnings.push('Revisa el horario y la zona horaria antes de reservar la fecha.');}
 if(draft.offerAmountMinor!==null&&!draft.currency){draft.offerAmountMinor=null;draft.warnings.push('Revisa la moneda del presupuesto.');}
 if(draft.offerAmountMinor===null)draft.currency=null;
 return {...draft,warnings:[...new Set(draft.warnings)].slice(0,10)};
}
