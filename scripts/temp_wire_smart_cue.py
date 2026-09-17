from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    return text.replace(old, new, 1)

# Domain input
path = Path('app/domain/bookingCore.ts')
text = path.read_text()
text = replace_once(
    text,
    "  initialNote?: string | null\n}\n\nexport interface UpdateBookingDetailsInput",
    "  initialNote?: string | null\n  nextMoveLabel?: string | null\n}\n\nexport interface UpdateBookingDetailsInput",
    'domain next move input'
)
path.write_text(text)

# API uses the richer CUE command while keeping create_manual_booking available for compatibility.
path = Path('app/services/bookingCoreApi.ts')
text = path.read_text()
text = replace_once(
    text,
    "`${baseUrl}/rest/v1/rpc/create_manual_booking`",
    "`${baseUrl}/rest/v1/rpc/create_cue_booking`",
    'cue rpc'
)
text = replace_once(
    text,
    "        initial_note: normalizedText(input.initialNote)\n      }",
    "        initial_note: normalizedText(input.initialNote),\n        initial_next_move: normalizedText(input.nextMoveLabel)\n      }",
    'cue next move body'
)
path.write_text(text)

# Smart capture UI
path = Path('app/components/CueCapturePanel.vue')
text = path.read_text()
text = replace_once(
    text,
    "import type { BookingSource, CoreBooking, CounterpartyKind } from '../domain/bookingCore'\n",
    "import type { BookingSource, CoreBooking, CounterpartyKind } from '../domain/bookingCore'\nimport { interpretCueText } from '../services/cueInterpreter'\n",
    'interpreter import'
)
text = replace_once(
    text,
    "const initialNote = ref('')\nconst moreOpen = ref(false)\n",
    "const initialNote = ref('')\nconst nextMoveLabel = ref('')\nconst interpretationMessage = ref('')\nconst moreOpen = ref(false)\n",
    'smart cue state'
)
text = replace_once(
    text,
    "  note: 'Qué se ha hablado', notePlaceholder: 'Ej. Me ha llamado Héctor. 1.200 €, pendiente confirmar horario.',\n  more: 'Añadir más datos', less: 'Ocultar datos extra',",
    "  note: 'Qué se ha hablado', notePlaceholder: 'Ej. Me ha llamado Héctor de Nitsa para el 23 de septiembre. 1.200 €, pendiente confirmar horario.',\n  interpret: 'Interpretar CUE', interpreted: 'He separado lo que parece importante. Revísalo antes de guardar.', nothingDetected: 'No he detectado datos claros todavía. Puedes completar el CUE manualmente.', nextMove: 'Siguiente paso',\n  more: 'Añadir más datos', less: 'Ocultar datos extra',",
    'spanish smart copy'
)
text = replace_once(
    text,
    "  note: 'What was discussed', notePlaceholder: 'E.g. Hector called. €1,200, waiting to confirm schedule.',\n  more: 'Add more details', less: 'Hide extra details',",
    "  note: 'What was discussed', notePlaceholder: 'E.g. Hector from Nitsa called for September 23. €1,200, pending confirm schedule.',\n  interpret: 'Interpret CUE', interpreted: 'I separated the details that look useful. Review them before saving.', nothingDetected: 'No clear details detected yet. You can complete the CUE manually.', nextMove: 'Next move',\n  more: 'Add more details', less: 'Hide extra details',",
    'english smart copy'
)
text = replace_once(
    text,
    "  initialNote.value = ''\n  moreOpen.value = false",
    "  initialNote.value = ''\n  nextMoveLabel.value = ''\n  interpretationMessage.value = ''\n  moreOpen.value = false",
    'reset smart cue'
)

close_anchor = "function close() {\n  if (submitting.value) return\n  emit('close')\n}\n\n"
interpret_fn = """function interpretNote() {
  interpretationMessage.value = ''
  const parsed = interpretCueText(initialNote.value, props.locale)
  const detected = Object.keys(parsed).length > 0

  if (parsed.source) source.value = parsed.source
  if (parsed.contactName) {
    contactMode.value = 'new'
    contactName.value = parsed.contactName
  }
  if (parsed.counterpartyName) {
    counterpartyMode.value = 'new'
    counterpartyName.value = parsed.counterpartyName
    if (!venueName.value) venueName.value = parsed.counterpartyName
  }
  if (parsed.eventDate) eventDate.value = parsed.eventDate
  if (parsed.offerAmountMinor != null) offer.value = String(parsed.offerAmountMinor / 100)
  if (parsed.currency) currency.value = parsed.currency
  if (parsed.nextMoveLabel) nextMoveLabel.value = parsed.nextMoveLabel

  if (parsed.eventDate || parsed.offerAmountMinor != null) moreOpen.value = true
  interpretationMessage.value = detected ? text.value.interpreted : text.value.nothingDetected
}

"""
if 'function interpretNote()' not in text:
    if close_anchor not in text:
        raise SystemExit('missing anchor: close function')
    text = text.replace(close_anchor, close_anchor + interpret_fn, 1)

text = replace_once(
    text,
    "      initialNote: initialNote.value\n    })",
    "      initialNote: initialNote.value,\n      nextMoveLabel: nextMoveLabel.value\n    })",
    'submit next move'
)

note_anchor = (
    '          <label class="cue-capture__note"><span>{{ text.note }}</span><textarea v-model="initialNote" rows="3" :placeholder="text.notePlaceholder" /></label>\n\n'
    '          <button class="cue-capture__more"'
)
note_new = (
    '          <label class="cue-capture__note"><span>{{ text.note }}</span><textarea v-model="initialNote" rows="3" :placeholder="text.notePlaceholder" /></label>\n'
    '          <div class="cue-capture__interpret">\n'
    '            <button type="button" :disabled="!initialNote.trim()" @click="interpretNote">{{ text.interpret }}</button>\n'
    '            <p v-if="interpretationMessage">{{ interpretationMessage }}</p>\n'
    '          </div>\n'
    '          <label v-if="nextMoveLabel" class="cue-capture__next"><span>{{ text.nextMove }}</span><input v-model="nextMoveLabel" maxlength="240"></label>\n\n'
    '          <button class="cue-capture__more"'
)
text = replace_once(text, note_anchor, note_new, 'smart note UI')

css_anchor = ".cue-capture__note { padding: 20px 0 12px; }\n"
css_new = ".cue-capture__note { padding: 20px 0 12px; }\n.cue-capture__interpret { display:flex; align-items:center; gap:10px; margin-top:-4px; padding-bottom:10px; }\n.cue-capture__interpret button { min-height:34px; padding:0 11px; border:1px solid #4b5128; background:rgba(206,255,84,.06); color:#ceff54; cursor:pointer; font:700 9px monospace; text-transform:uppercase; }\n.cue-capture__interpret button:disabled { opacity:.35; cursor:not-allowed; }\n.cue-capture__interpret p { margin:0; color:#929292; font-size:10px; line-height:1.35; }\n.cue-capture__next { display:grid; gap:7px; padding:10px 12px; margin-bottom:10px; border-left:2px solid #ceff54; background:rgba(206,255,84,.04); }\n"
if '.cue-capture__interpret {' not in text:
    if css_anchor not in text:
        raise SystemExit('missing anchor: note css')
    text = text.replace(css_anchor, css_new, 1)

path.write_text(text)
