import type { BookingSource } from '../domain/bookingCore'

export interface CueInterpretation {
  source?: BookingSource
  contactName?: string
  counterpartyName?: string
  venueName?: string
  eventDate?: string
  startTime?: string
  endTime?: string
  offerAmountMinor?: number
  currency?: string
  nextMoveLabel?: string
}

const MONTHS: Record<string, number> = {
  enero: 1, gener: 1, january: 1,
  febrero: 2, febrer: 2, february: 2,
  marzo: 3, març: 3, march: 3,
  abril: 4, april: 4,
  mayo: 5, maig: 5, may: 5,
  junio: 6, juny: 6, june: 6,
  julio: 7, juliol: 7, july: 7,
  agosto: 8, agost: 8, august: 8,
  septiembre: 9, setembre: 9, september: 9,
  octubre: 10, october: 10,
  noviembre: 11, novembre: 11, november: 11,
  diciembre: 12, desembre: 12, december: 12
}

function isoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function resolveYear(month: number, day: number, now: Date) {
  const currentYear = now.getFullYear()
  const candidate = new Date(currentYear, month - 1, day, 23, 59, 59)
  return candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000 ? currentYear + 1 : currentYear
}

function extractDate(raw: string, now: Date) {
  const iso = raw.match(/\b(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/)
  if (iso) return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const slash = raw.match(/\b(0?[1-9]|[12]\d|3[01])[\/-](0?[1-9]|1[0-2])(?:[\/-](20\d{2}|\d{2}))?\b/)
  if (slash) {
    const day = Number(slash[1])
    const month = Number(slash[2])
    const year = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : resolveYear(month, day, now)
    return isoDate(year, month, day)
  }

  const normalized = raw.toLocaleLowerCase('es-ES')
  const monthNames = Object.keys(MONTHS).join('|')
  const dayFirst = normalized.match(new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])(?:\\s+de)?\\s+(${monthNames})(?:\\s+(?:de\\s+)?(20\\d{2}))?\\b`, 'i'))
  if (dayFirst) {
    const day = Number(dayFirst[1])
    const month = MONTHS[dayFirst[2].toLowerCase()]
    const year = dayFirst[3] ? Number(dayFirst[3]) : resolveYear(month, day, now)
    return isoDate(year, month, day)
  }

  const monthFirst = normalized.match(new RegExp(`\\b(${monthNames})\\s+(0?[1-9]|[12]\\d|3[01])(?:,?\\s+(20\\d{2}))?\\b`, 'i'))
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()]
    const day = Number(monthFirst[2])
    const year = monthFirst[3] ? Number(monthFirst[3]) : resolveYear(month, day, now)
    return isoDate(year, month, day)
  }

  // Avoid JavaScript's ASCII-oriented \b around accented words such as "demà".
  if (/(?:^|[\s,.;:!?])(mañana|demà|tomorrow)(?=$|[\s,.;:!?])/iu.test(raw)) {
    const date = new Date(now)
    date.setDate(date.getDate() + 1)
    return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  }

  return undefined
}

function parseAmount(raw: string) {
  const value = raw.replace(/\s/g, '')
  const comma = value.lastIndexOf(',')
  const dot = value.lastIndexOf('.')

  let normalized = value
  if (comma >= 0 && dot >= 0) {
    const decimalIndex = Math.max(comma, dot)
    const decimals = value.length - decimalIndex - 1
    if (decimals === 2) {
      normalized = value.slice(0, decimalIndex).replace(/[.,]/g, '') + '.' + value.slice(decimalIndex + 1)
    } else {
      normalized = value.replace(/[.,]/g, '')
    }
  } else if (comma >= 0 || dot >= 0) {
    const separator = comma >= 0 ? ',' : '.'
    const parts = value.split(separator)
    if (parts.length === 2 && parts[1].length === 2) normalized = `${parts[0]}.${parts[1]}`
    else normalized = parts.join('')
  }

  const amount = Number(normalized)
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : undefined
}

function extractMoney(raw: string) {
  // The numeric capture must end in a digit. This prevents a date fragment such
  // as "October 10, $1,250" from being interpreted as "$10".
  const match = raw.match(/(?:€|£|\$|EUR|GBP|USD)\s*([0-9](?:[0-9.,\s]*[0-9])?)|([0-9](?:[0-9.,\s]*[0-9])?)\s*(€|£|\$|EUR|GBP|USD)/i)
  if (!match) return {}
  const amountRaw = (match[1] || match[2] || '').trim()
  const token = (match[3] || match[0].match(/€|£|\$|EUR|GBP|USD/i)?.[0] || '').toUpperCase()
  const currency = token === '€' ? 'EUR' : token === '£' ? 'GBP' : token === '$' ? 'USD' : token
  return { offerAmountMinor: parseAmount(amountRaw), currency }
}

function cleanName(value?: string) {
  return value?.trim().replace(/\s+/g, ' ').replace(/[,:;.!?]+$/, '') || undefined
}

function extractPeople(raw: string) {
  const contactPatterns = [
    /(?:me\s+(?:ha\s+)?llamado|me\s+(?:ha\s+)?escrito|he\s+hablado\s+con|hemos\s+hablado\s+con|hablé\s+con)\s+([\p{L}][\p{L}'’.-]*)(?:\s+de\s+([^,.;]+?))?(?=\s+(?:para|por|el|la|me|nos|y|con|que)\b|[,.;]|$)/iu,
    /(?:m['’]?ha\s+trucat|m['’]?ha\s+escrit|he\s+parlat\s+amb|hem\s+parlat\s+amb)\s+([\p{L}][\p{L}'’.-]*)(?:\s+(?:de|d['’])\s*([^,.;]+?))?(?=\s+(?:per|pel|la|el|i|amb|que)\b|[,.;]|$)/iu,
    /(?:called|messaged|spoke\s+with|we\s+spoke\s+with)\s+([\p{L}][\p{L}'’.-]*)(?:\s+(?:from|at)\s+([^,.;]+?))?(?=\s+(?:for|about|on|and|with|who)\b|[,.;]|$)/iu
  ]
  for (const pattern of contactPatterns) {
    const match = raw.match(pattern)
    if (match) return { contactName: cleanName(match[1]), counterpartyName: cleanName(match[2]) }
  }
  return {}
}

function extractVenue(raw: string) {
  const patterns = [
    /\b(?:en\s+(?:la\s+)?|a\s+(?:la\s+)?)sala\s+([\p{L}0-9][\p{L}0-9'’&.\- ]{1,60}?)(?=\s+(?:la\s+hora|el\s+horario|horario|para|por|el\s+\d|la\s+oferta|oferta|fee)\b|[,.;]|$)/iu,
    /\b(?:en\s+el\s+|al\s+)?(?:club|venue)\s+([\p{L}0-9][\p{L}0-9'’&.\- ]{1,60}?)(?=\s+(?:la\s+hora|el\s+horario|horario|para|por|on|the\s+offer|offer|fee)\b|[,.;]|$)/iu
  ]
  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match?.[1]) return cleanName(match[1])
  }
  return undefined
}

function normalizeClock(hour: number, minute = 0) {
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractTimeRange(raw: string) {
  const range = raw.match(/\b(?:de|entre|from)\s+(?:las\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:h|hs|horas)?\s+(?:a|hasta|y|to|-)\s+(?:las\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:h|hs|horas)?\b/i)
  if (!range) return {}
  const startTime = normalizeClock(Number(range[1]), Number(range[2] || 0))
  const endTime = normalizeClock(Number(range[3]), Number(range[4] || 0))
  return {
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {})
  }
}

const SPANISH_NUMBER_WORDS: Record<string, number> = {
  cero:0, un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9,
  diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, veinte:20, treinta:30, cuarenta:40, cincuenta:50,
  sesenta:60, setenta:70, ochenta:80, noventa:90, cien:100, ciento:100, doscientos:200, trescientos:300,
  cuatrocientos:400, quinientos:500, seiscientos:600, setecientos:700, ochocientos:800, novecientos:900
}

function parseSpanishAmountWords(raw: string) {
  const normalized = raw.toLocaleLowerCase('es-ES')
  const match = normalized.match(/\b((?:(?:un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|y|mil)\s+){0,7}(?:un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|mil))\s+euros?\b/)
  if (!match) return undefined

  const words = match[1].trim().split(/\s+/)
  let total = 0
  let chunk = 0
  for (const word of words) {
    if (word === 'y') continue
    if (word === 'mil') {
      total += Math.max(1, chunk) * 1000
      chunk = 0
      continue
    }
    chunk += SPANISH_NUMBER_WORDS[word] || 0
  }
  total += chunk
  return total > 0 ? { offerAmountMinor: total * 100, currency: 'EUR' } : undefined
}

function extractSource(raw: string): BookingSource | undefined {
  if (/\b(whatsapp|wa)\b/i.test(raw)) return 'whatsapp'
  if (/\b(instagram|insta|dm)\b/i.test(raw)) return 'instagram'
  if (/\b(e-?mail|correo|correu)\b/i.test(raw)) return 'email'
  if (/\b(llamad[ao]|tel[eèé]fono?|trucat|trucada|phone|called)\b/i.test(raw)) return 'phone'
  if (/\b(en persona|cara a cara|in person|meeting|reuni[oó]n|reuni[oó])\b/i.test(raw)) return 'in_person'
  return undefined
}

function capitalize(value: string) {
  const clean = value.trim().replace(/[.;,]+$/, '')
  return clean ? clean.charAt(0).toLocaleUpperCase() + clean.slice(1) : ''
}

function extractNextMove(raw: string) {
  const patterns = [
    /\b(?:pendiente(?:\s+de)?|falta|hay\s+que|tengo\s+que)\s+([^,.\n]+)/i,
    /\b(?:pendent(?:\s+de)?|falta|cal|he\s+de)\s+([^,.\n]+)/i,
    /\b(?:pending|need\s+to|needs\s+to|still\s+need\s+to)\s+([^,.\n]+)/i
  ]
  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match?.[1]) return capitalize(match[1])
  }
  if (/\besperando\s+(?:una\s+)?respuesta\b/i.test(raw)) return 'Esperar respuesta'
  if (/\besperant\s+(?:una\s+)?resposta\b/i.test(raw)) return 'Esperar resposta'
  if (/\bwaiting\s+for\s+(?:a\s+)?reply\b/i.test(raw)) return 'Wait for reply'
  return undefined
}

export function interpretCueText(raw: string, locale: 'es' | 'en', now = new Date()): CueInterpretation {
  const text = raw.trim()
  if (!text) return {}

  const people = extractPeople(text)
  const money = extractMoney(text)
  const wordMoney = Object.keys(money).length ? undefined : parseSpanishAmountWords(text)
  const source = extractSource(text)
  const eventDate = extractDate(text, now)
  const venueName = extractVenue(text)
  const times = extractTimeRange(text)
  const nextMoveLabel = extractNextMove(text)

  return {
    ...people,
    ...money,
    ...(wordMoney || {}),
    ...(source ? { source } : {}),
    ...(venueName ? { venueName, ...(people.counterpartyName ? {} : { counterpartyName: venueName }) } : {}),
    ...(eventDate ? { eventDate } : {}),
    ...times,
    ...(nextMoveLabel ? { nextMoveLabel } : {})
  }
}
