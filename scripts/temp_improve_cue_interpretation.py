from pathlib import Path

# Voice: emit a final capture event so the parent can interpret once speech ends.
voice = Path('app/components/CueVoiceInput.vue')
text = voice.read_text()
text = text.replace("const emit = defineEmits<{\n  'update:modelValue': [value: string]\n}>()", "const emit = defineEmits<{\n  'update:modelValue': [value: string]\n  captured: [value: string]\n}>()", 1)
text = text.replace("let baseText = ''", "let baseText = ''\nlet latestValue = ''", 1)
text = text.replace("    emit('update:modelValue', [baseText.trim(), spoken].filter(Boolean).join(' '))", "    latestValue = [baseText.trim(), spoken].filter(Boolean).join(' ')\n    emit('update:modelValue', latestValue)", 1)
text = text.replace("  instance.onend = () => {\n    listening.value = false\n  }", "  instance.onend = () => {\n    listening.value = false\n    if (latestValue.trim() && latestValue.trim() !== baseText.trim()) emit('captured', latestValue.trim())\n  }", 1)
text = text.replace("  baseText = props.modelValue\n  recognition = createRecognition()", "  baseText = props.modelValue\n  latestValue = baseText\n  recognition = createRecognition()", 1)
voice.write_text(text)

panel = Path('app/components/CueCapturePanel.vue')
text = panel.read_text()
text = text.replace('<CueVoiceInput v-model="initialNote" :locale="locale" />', '<CueVoiceInput v-model="initialNote" :locale="locale" @captured="interpretNote" />', 1)
panel.write_text(text)

# Deterministic interpreter: improve multilingual real-world capture without making AI authoritative.
interpreter = Path('app/services/cueInterpreter.ts')
text = interpreter.read_text()

# Add weekday support after MONTHS.
anchor = "const MONTHS: Record<string, number> = {"
if "const WEEKDAYS" not in text:
    end = text.index("}\n\nfunction isoDate", text.index(anchor)) + 2
    addition = "\nconst WEEKDAYS: Record<string, number> = {\n  lunes: 1, dilluns: 1, monday: 1,\n  martes: 2, dimarts: 2, tuesday: 2,\n  miércoles: 3, miercoles: 3, dimecres: 3, wednesday: 3,\n  jueves: 4, dijous: 4, thursday: 4,\n  viernes: 5, divendres: 5, friday: 5,\n  sábado: 6, sabado: 6, dissabte: 6, saturday: 6,\n  domingo: 0, diumenge: 0, sunday: 0\n}\n"
    text = text[:end] + addition + text[end:]

# Replace tail of extractDate with richer relative date handling.
old = """  if (/\\b(mañana|demà|tomorrow)\\b/i.test(raw)) {\n    const date = new Date(now)\n    date.setDate(date.getDate() + 1)\n    return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())\n  }\n\n  return undefined\n}"""
new = """  const relativeDays = /\\b(pasado mañana|demà passat|day after tomorrow)\\b/i.test(raw)\n    ? 2\n    : /\\b(mañana|demà|tomorrow)\\b/i.test(raw)\n      ? 1\n      : /\\b(hoy|avui|today)\\b/i.test(raw)\n        ? 0\n        : null\n  if (relativeDays != null) {\n    const date = new Date(now)\n    date.setDate(date.getDate() + relativeDays)\n    return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())\n  }\n\n  const weekdayNames = Object.keys(WEEKDAYS).join('|')\n  const weekday = normalized.match(new RegExp(`(?:\\b(?:el|este|aquest|this|on)\\s+)?\\b(${weekdayNames})\\b`, 'i'))\n  if (weekday) {\n    const target = WEEKDAYS[weekday[1].toLowerCase()]\n    const date = new Date(now)\n    let delta = (target - date.getDay() + 7) % 7\n    if (delta === 0) delta = 7\n    date.setDate(date.getDate() + delta)\n    return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())\n  }\n\n  return undefined\n}"""
if old not in text:
    raise SystemExit('extractDate relative anchor not found')
text = text.replace(old, new, 1)

# Replace money extractor with natural currency names too.
start = text.index('function extractMoney(raw: string) {')
end = text.index('\n}\n\nfunction cleanName', start) + 2
new_money = '''function extractMoney(raw: string) {\n  const tokenPattern = '€|£|\\$|EUR|GBP|USD|euros?|libras?|pounds?|d[oó]lares?|dollars?'\n  const match = raw.match(new RegExp(`(?:${tokenPattern})\\\\s*([0-9][0-9.,\\\\s]*)|([0-9][0-9.,\\\\s]*)\\\\s*(${tokenPattern})\\\\b?`, 'i'))\n  if (!match) return {}\n  const amountRaw = (match[1] || match[2] || '').trim()\n  const rawToken = (match[3] || match[0].match(new RegExp(tokenPattern, 'i'))?.[0] || '').toLowerCase()\n  const currency = rawToken === '€' || rawToken.startsWith('eur') || rawToken.startsWith('euro')\n    ? 'EUR'\n    : rawToken === '£' || rawToken.startsWith('gbp') || rawToken.startsWith('libr') || rawToken.startsWith('pound')\n      ? 'GBP'\n      : 'USD'\n  return { offerAmountMinor: parseAmount(amountRaw), currency }\n}'''
text = text[:start] + new_money + text[end:]

# Expand people extraction.
start = text.index('function extractPeople(raw: string) {')
end = text.index('\n}\n\nfunction extractSource', start) + 2
new_people = '''function extractPeople(raw: string) {\n  const contactPatterns = [\n    /(?:me\\s+(?:ha\\s+)?llamado|me\\s+(?:ha\\s+)?escrito|he\\s+hablado\\s+con|hablé\\s+con)\\s+([\\p{L}][\\p{L}'’.-]*)(?:\\s+de\\s+([^,.;]+?))?(?=\\s+(?:para|por|el|la|me|y|con)\\b|[,.;]|$)/iu,\n    /([\\p{L}][\\p{L}'’.-]*)\\s+me\\s+(?:ha\\s+)?(?:llamado|escrito)(?:\\s+de\\s+([^,.;]+?))?(?=\\s+(?:para|por|el|la|y|con)\\b|[,.;]|$)/iu,\n    /(?:m['’]?ha\\s+(?:trucat|escrit)|he\\s+parlat\\s+amb)\\s+(?:l['’])?([\\p{L}][\\p{L}'’.-]*)(?:\\s+d[eo]\\s+([^,.;]+?))?(?=\\s+(?:per|pel|el|la|i|amb)\\b|[,.;]|$)/iu,\n    /(?:called|messaged|spoke\\s+with)\\s+([\\p{L}][\\p{L}'’.-]*)(?:\\s+(?:from|at)\\s+([^,.;]+?))?(?=\\s+(?:for|about|on|and|with)\\b|[,.;]|$)/iu,\n    /([\\p{L}][\\p{L}'’.-]*)\\s+(?:called|messaged)(?:\\s+(?:from|at)\\s+([^,.;]+?))?(?=\\s+(?:for|about|on|and|with)\\b|[,.;]|$)/iu\n  ]\n  for (const pattern of contactPatterns) {\n    const match = raw.match(pattern)\n    if (match) return { contactName: cleanName(match[1]), counterpartyName: cleanName(match[2]) }\n  }\n  return {}\n}'''
text = text[:start] + new_people + text[end:]

# Expand source detection.
text = text.replace("if (/\\b(e-?mail|correo)\\b/i.test(raw)) return 'email'", "if (/\\b(e-?mail|correo|correu)\\b/i.test(raw)) return 'email'", 1)
text = text.replace("if (/\\b(llamad[ao]|tel[eé]fono|phone|called)\\b/i.test(raw)) return 'phone'", "if (/\\b(llamad[ao]|tel[eé]fono|telèfon|trucat|trucada|phone|called)\\b/i.test(raw)) return 'phone'", 1)

# Expand next move language.
text = text.replace("/(?:pending|need\\s+to|needs\\s+to|still\\s+need\\s+to)\\s+([^,.\\n]+)/i", "/(?:pending|need\\s+to|needs\\s+to|still\\s+need\\s+to)\\s+([^,.\\n]+)/i,\n    /\\b(?:pendent(?:\\s+de)?|cal|he\\s+de)\\s+([^,.\\n]+)/i", 1)
text = text.replace("if (/\\bwaiting\\s+for\\s+(?:a\\s+)?reply\\b/i.test(raw)) return 'Wait for reply'", "if (/\\bwaiting\\s+for\\s+(?:a\\s+)?reply\\b/i.test(raw)) return 'Wait for reply'\n  if (/\\besperant\\s+(?:una\\s+)?resposta\\b/i.test(raw)) return 'Esperar resposta'", 1)

interpreter.write_text(text)
