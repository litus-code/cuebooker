export type MailboxBookingDraft={eventDate:string|null;startTime:string|null;endTime:string|null;venue:string|null;city:string|null;offerAmountMinor:number|null;currency:string|null;artistName:string|null;contactPhone:string|null;warnings:string[]}
const nullableText={type:['string','null']}
export const mailboxDraftSchema={type:'object',additionalProperties:false,required:['eventDate','startTime','endTime','venue','city','offerAmountMinor','currency','artistName','contactPhone','warnings'],properties:{eventDate:nullableText,startTime:nullableText,endTime:nullableText,venue:nullableText,city:nullableText,offerAmountMinor:{type:['integer','null']},currency:nullableText,artistName:nullableText,contactPhone:nullableText,warnings:{type:'array',items:{type:'string'}}}}
export function validateMailboxDraft(value:any):MailboxBookingDraft{
 const keys=mailboxDraftSchema.required;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>!(k in value)))throw new Error('invalid_booking_draft');
 for(const key of ['eventDate','startTime','endTime','venue','city','currency','artistName','contactPhone'])if(value[key]!==null&&(typeof value[key]!=='string'||value[key].length>200))throw new Error('invalid_booking_draft');
 if(value.eventDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(value.eventDate)||!Number.isFinite(Date.parse(value.eventDate+'T12:00:00Z'))||new Date(value.eventDate+'T12:00:00Z').toISOString().slice(0,10)!==value.eventDate))throw new Error('invalid_booking_draft');
 for(const key of ['startTime','endTime'])if(value[key]!==null&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value[key]))throw new Error('invalid_booking_draft');
 if(value.offerAmountMinor!==null&&(!Number.isSafeInteger(value.offerAmountMinor)||value.offerAmountMinor<0||value.offerAmountMinor>100000000000))throw new Error('invalid_booking_draft');
 if(value.currency!==null&&!/^[A-Z]{3}$/.test(value.currency))throw new Error('invalid_booking_draft');
 if(!Array.isArray(value.warnings)||value.warnings.length>10||value.warnings.some((s:any)=>typeof s!=='string'||s.length>240))throw new Error('invalid_booking_draft');
 return value;
}
export type ReviewedMailboxDraft=Omit<MailboxBookingDraft,'artistName'|'warnings'> & {contactName:string;eventTimezone:string|null}
export function validateReviewedMailboxDraft(value:any):ReviewedMailboxDraft{
 if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['eventDate','startTime','endTime','venue','city','offerAmountMinor','currency','contactPhone','contactName','eventTimezone'].includes(k)))throw new Error('invalid_booking_draft');
 validateMailboxDraft({eventDate:value.eventDate,startTime:value.startTime,endTime:value.endTime,venue:value.venue,city:value.city,offerAmountMinor:value.offerAmountMinor,currency:value.currency,contactPhone:value.contactPhone,artistName:null,warnings:[]});
 if(typeof value.contactName!=='string'||!value.contactName.trim()||value.contactName.length>200)throw new Error('invalid_booking_draft');
 if(!value.eventDate&&(value.startTime||value.endTime))throw new Error('booking_time_requires_date');
 if(value.offerAmountMinor!==null&&!value.currency)throw new Error('booking_currency_required');
 if(value.eventTimezone!==null){if(typeof value.eventTimezone!=='string'||value.eventTimezone.length>80)throw new Error('invalid_booking_draft');try{new Intl.DateTimeFormat('en',{timeZone:value.eventTimezone})}catch{throw new Error('invalid_booking_draft')}}
 return value;
}
