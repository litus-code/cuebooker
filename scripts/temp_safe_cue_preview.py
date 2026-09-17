from pathlib import Path

path = Path('app/components/CueCapturePanel.vue')
text = path.read_text()


def replace_once(old: str, new: str, label: str):
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'missing anchor: {label}')
    text = text.replace(old, new, 1)


replace_once(
    "import { interpretCueText } from '../services/cueInterpreter'",
    "import { interpretCueText, type CueInterpretation } from '../services/cueInterpreter'",
    'interpreter import'
)

replace_once(
    "const interpretationMessage = ref('')\nconst moreOpen = ref(false)",
    "const interpretationMessage = ref('')\nconst interpretationPreview = ref<CueInterpretation | null>(null)\nconst moreOpen = ref(false)",
    'preview state'
)

replace_once(
    "  interpret: 'Interpretar CUE', interpreted: 'He separado lo que parece importante. Revísalo antes de guardar.', nothingDetected: 'No he detectado datos claros todavía. Puedes completar el CUE manualmente.', nextMove: 'Siguiente paso',",
    "  interpret: 'Interpretar CUE', interpreted: 'He separado lo que parece importante. Revísalo antes de guardar.', nothingDetected: 'No he detectado datos claros todavía. Puedes completar el CUE manualmente.', reviewSuggestions: 'Esto es lo que he entendido. Nada se aplicará hasta que lo confirmes.', applySuggestions: 'Aplicar sugerencias', discardSuggestions: 'Descartar', suggestionsApplied: 'Sugerencias aplicadas. Revísalas antes de guardar el CUE.', nextMove: 'Siguiente paso',",
    'spanish suggestion copy'
)

replace_once(
    "  interpret: 'Interpret CUE', interpreted: 'I separated the details that look useful. Review them before saving.', nothingDetected: 'No clear details detected yet. You can complete the CUE manually.', nextMove: 'Next move',",
    "  interpret: 'Interpret CUE', interpreted: 'I separated the details that look useful. Review them before saving.', nothingDetected: 'No clear details detected yet. You can complete the CUE manually.', reviewSuggestions: 'This is what I understood. Nothing will be applied until you confirm it.', applySuggestions: 'Apply suggestions', discardSuggestions: 'Discard', suggestionsApplied: 'Suggestions applied. Review them before saving the CUE.', nextMove: 'Next move',",
    'english suggestion copy'
)

replace_once(
    "  interpretationMessage.value = ''\n  moreOpen.value = false",
    "  interpretationMessage.value = ''\n  interpretationPreview.value = null\n  moreOpen.value = false",
    'reset preview'
)

old_interpret = '''function interpretNote() {
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
'''

new_interpret = '''function normalizeEntityName(value: string) {
  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().toLowerCase().replace(/\\s+/g, ' ')
}

function stageInterpretation(raw: string) {
  interpretationMessage.value = ''
  const parsed = interpretCueText(raw, props.locale)
  const detected = Object.keys(parsed).length > 0
  interpretationPreview.value = detected ? parsed : null
  interpretationMessage.value = detected ? text.value.interpreted : text.value.nothingDetected
}

function interpretNote() {
  stageInterpretation(initialNote.value)
}

function applyInterpretation() {
  const parsed = interpretationPreview.value
  if (!parsed) return

  if (parsed.source) source.value = parsed.source

  if (parsed.contactName) {
    const match = contacts.value.find(item => normalizeEntityName(item.name) === normalizeEntityName(parsed.contactName!))
    if (match) {
      contactMode.value = 'existing'
      existingContactId.value = match.id
    } else {
      contactMode.value = 'new'
      existingContactId.value = ''
      contactName.value = parsed.contactName
    }
  }

  if (parsed.counterpartyName) {
    const match = counterparties.value.find(item => normalizeEntityName(item.name) === normalizeEntityName(parsed.counterpartyName!))
    if (match) {
      counterpartyMode.value = 'existing'
      existingCounterpartyId.value = match.id
      if (!venueName.value) venueName.value = match.name
    } else {
      counterpartyMode.value = 'new'
      existingCounterpartyId.value = ''
      counterpartyName.value = parsed.counterpartyName
      if (!venueName.value) venueName.value = parsed.counterpartyName
    }
  }

  if (parsed.eventDate) eventDate.value = parsed.eventDate
  if (parsed.offerAmountMinor != null) offer.value = String(parsed.offerAmountMinor / 100)
  if (parsed.currency) currency.value = parsed.currency
  if (parsed.nextMoveLabel) nextMoveLabel.value = parsed.nextMoveLabel
  if (parsed.eventDate || parsed.offerAmountMinor != null) moreOpen.value = true

  interpretationPreview.value = null
  interpretationMessage.value = text.value.suggestionsApplied
}

function discardInterpretation() {
  interpretationPreview.value = null
  interpretationMessage.value = ''
}

function onVoiceCaptured(value: string) {
  initialNote.value = value
  stageInterpretation(value)
}
'''

replace_once(old_interpret, new_interpret, 'interpretation function')

replace_once(
    '          <CueVoiceInput v-model="initialNote" :locale="locale" />',
    '          <CueVoiceInput v-model="initialNote" :locale="locale" @captured="onVoiceCaptured" />',
    'voice capture event'
)

old_ui = '''          <div class="cue-capture__interpret">
            <button type="button" :disabled="!initialNote.trim()" @click="interpretNote">{{ text.interpret }}</button>
            <p v-if="interpretationMessage">{{ interpretationMessage }}</p>
          </div>
'''

new_ui = '''          <div class="cue-capture__interpret">
            <button type="button" :disabled="!initialNote.trim()" @click="interpretNote">{{ text.interpret }}</button>
            <p v-if="interpretationMessage" aria-live="polite">{{ interpretationMessage }}</p>
          </div>
          <section v-if="interpretationPreview" class="cue-capture__preview" aria-live="polite">
            <p>{{ text.reviewSuggestions }}</p>
            <div class="cue-capture__preview-items">
              <span v-if="interpretationPreview.source">{{ text.channel }} · {{ sourceOptions.find(item => item.value === interpretationPreview?.source)?.label }}</span>
              <span v-if="interpretationPreview.contactName">{{ text.who }} · {{ interpretationPreview.contactName }}</span>
              <span v-if="interpretationPreview.counterpartyName">{{ text.withWho }} · {{ interpretationPreview.counterpartyName }}</span>
              <span v-if="interpretationPreview.eventDate">{{ text.date }} · {{ interpretationPreview.eventDate }}</span>
              <span v-if="interpretationPreview.offerAmountMinor != null">{{ text.offer }} · {{ (interpretationPreview.offerAmountMinor / 100).toLocaleString(locale === 'es' ? 'es-ES' : 'en-GB') }} {{ interpretationPreview.currency || '' }}</span>
              <span v-if="interpretationPreview.nextMoveLabel">{{ text.nextMove }} · {{ interpretationPreview.nextMoveLabel }}</span>
            </div>
            <div class="cue-capture__preview-actions">
              <button type="button" @click="discardInterpretation">{{ text.discardSuggestions }}</button>
              <button type="button" class="apply" @click="applyInterpretation">{{ text.applySuggestions }}</button>
            </div>
          </section>
'''

replace_once(old_ui, new_ui, 'interpretation preview UI')

css_anchor = '.cue-capture__next { display:grid; gap:7px; padding:10px 12px; margin-bottom:10px; border-left:2px solid #ceff54; background:rgba(206,255,84,.04); }'
css_new = '''.cue-capture__preview { display:grid; gap:10px; margin:0 0 12px; padding:12px; border:1px solid #3e4722; background:rgba(206,255,84,.035); }
.cue-capture__preview > p { margin:0; color:#b8b8b8; font-size:10px; line-height:1.4; }
.cue-capture__preview-items { display:flex; flex-wrap:wrap; gap:6px; }
.cue-capture__preview-items span { padding:6px 8px; border:1px solid #353923; color:#d6e7a2; font:700 9px/1.25 monospace; }
.cue-capture__preview-actions { display:flex; justify-content:flex-end; gap:7px; }
.cue-capture__preview-actions button { min-height:34px; padding:0 10px; border:1px solid #404040; background:transparent; color:#c6c6c6; cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.cue-capture__preview-actions button.apply { border-color:#ceff54; background:#ceff54; color:#090909; }
''' + css_anchor
replace_once(css_anchor, css_new, 'preview styles')

path.write_text(text)
