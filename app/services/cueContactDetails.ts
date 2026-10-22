import type { SmartCaptureResult } from '../domain/smartCapture'

type Detail = { value: string; evidence: string }
type Details = { name?: Detail; email?: Detail; phone?: Detail }

function unique(values: Detail[], normalize = (value: string) => value.toLowerCase()) {
  const distinct = new Map(values.map(item => [normalize(item.value), item]))
  return distinct.size === 1 ? [...distinct.values()][0] : undefined
}

// Only explicit contact labels. A venue, an email's local part, or the speaker's
// own introduction is not evidence of the counterparty person's name.
export function extractCueContactDetails(raw: string): Details {
  const names: Detail[] = []
  const label = /(?:\b(?:el\s+)?contacto(?:\s+directo)?\s*(?:(?:es(?:\s+con)?|se\s+llama)\s+|:\s*)|\bnombre(?:\s+del\s+contacto)?\s*(?:es\s+|:\s*)|\bcontact(?:\s+person)?(?:'s\s+name)?\s*(?:is\s+|:\s*))/giu
  for (const match of raw.matchAll(label)) {
    if (/\b(?:mi|my)\s*$/iu.test(raw.slice(Math.max(0, match.index! - 6), match.index))) continue
    const tail = raw.slice(match.index! + match[0].length)
    const name = tail.match(/^([\p{L}][\p{L}'’-]*(?:\s+(?!(?:y|i|and|de\s+la\s+sala|del\s+club|from|at|para|por|en|con|que|tiene|su|correo|email|mail|teléfono|telefono|móvil|movil|phone|mobile|es|is|se|no|not|pendiente|este|esta|el|la|the)\b)[\p{L}][\p{L}'’-]*){0,4})/iu)?.[1].replace(/[.,]+$/, '').trim()
    if (name && !/^(?:no|not|pendiente|desconocido|unknown|sin|sala|club|festival|el|la|the)(?:$|\s)/iu.test(name)) {
      names.push({ value: name, evidence: match[0] + name })
    }
  }

  const emails: Detail[] = []
  // The original fragment remains evidence; normalization is restricted to
  // address punctuation, including common Spanish/English dictation tokens.
  const email = /[a-z0-9_+%-]+(?:(?:\.|\s+(?:punto|dot|guion|guión|underscore)\s+)[a-z0-9_+%-]+)*\s*(?:@|\s+arroba\s+)\s*[a-z0-9-]+(?:\.[a-z0-9-]+|\s+(?:punto|dot)\s+[a-z0-9-]+)+/giu
  for (const match of raw.matchAll(email)) {
    const value = match[0].replace(/\s+(?:punto|dot)\s+/giu, '.').replace(/\s+(?:guion|guión)\s+/giu, '-').replace(/\s+underscore\s+/giu, '_').replace(/\s+arroba\s+/giu, '@').replace(/\s/g, '')
    const before = raw.slice(Math.max(0, match.index! - 24), match.index)
    if (!/\b(?:no\s+es|not|sin|mi\s+(?:correo|email|mail)\s+es|my\s+email\s+is)\s*$/iu.test(before) && /^[a-z0-9_+%.-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/iu.test(value)) emails.push({ value, evidence: match[0] })
  }

  const phones: Detail[] = []
  const phone = /\b(?:teléfono|telefono|móvil|movil|phone|mobile|número\s+de\s+contacto|numero\s+de\s+contacto)\s*(?:(?:es|is)\s+)?(?:el\s+)?[:=]?\s*(\+?\d[\d ()-]{5,}\d)(?![\d/:])/giu
  for (const match of raw.matchAll(phone)) {
    if (/\b(?:mi|my|no|sin)\s*$/iu.test(raw.slice(Math.max(0, match.index! - 8), match.index))) continue
    const value = match[1].replace(/[ ()-]/g, '')
    if (/^\+?\d{7,15}$/.test(value)) phones.push({ value, evidence: match[0] })
  }
  return { name: unique(names), email: unique(emails), phone: unique(phones) }
}

export function completeCaptureContact(result: SmartCaptureResult, raw: string): SmartCaptureResult {
  const explicit = extractCueContactDetails(raw)
  let contact = result.contact
  for (const key of ['name', 'email', 'phone'] as const) {
    const detail = explicit[key]
    if (detail && contact[key].value !== detail.value) {
      if (contact === result.contact) contact = { ...contact }
      contact[key] = { value: detail.value, confidence: 'high', evidence: detail.evidence }
    }
  }
  return contact === result.contact ? result : { ...result, contact }
}

export type CaptureContactOption = { id: string; name: string; email: string | null; phone: string | null }
export function matchCaptureContact(options: CaptureContactOption[], name: string | null, email: string | null, phone: string | null) {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
  const digits = (text: string) => text.replace(/[ ()-]/g, '')
  // Never throw away a newly dictated address/number by selecting a name-only
  // existing contact: create a reviewable new draft when details differ.
  const matches = options.filter(item =>
    (!name || normalize(item.name) === normalize(name)) &&
    (!email || item.email?.trim().toLowerCase() === email.trim().toLowerCase()) &&
    (!phone || digits(item.phone || '') === digits(phone))
  )
  return (name || email || phone) && matches.length === 1 ? matches[0] : null
}
