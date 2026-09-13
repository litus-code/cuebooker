<script setup lang="ts">
type PilotFormCopy = {
  title: string
  body: string
  nameLabel: string
  namePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  emailHelp: string
  profileLabel: string
  profiles: string[]
  consentLabel: string
  consentText: string
  submit: string
  success: string
  invalid: string
  required: string
}

const props = defineProps<{
  copy: PilotFormCopy
  locale: 'es' | 'en'
  profile?: number
}>()

const formAction = 'https://d1ad8a2f.sibforms.com/serve/MUIFAGQE5N9rfp14tRWRFWV1_fcaEvwuZz6lMt4E1j4b76VXyRfYSUsLRpnEbQKAe27ksyb4Vxa6dFYuoXgZtAsVxi_J8P7FbcWLbN5wQlgAs7kCBJMOeMIwyD-NSlMNELOxYU3pg0eW0uqU-7Hdx0QlUunbogdTL6xo_58nA2Mc65hgSNpZRVibo6MZ-j59WqrFiEPbekKWZnVvsg=='

useHead({
  link: [
    {
      key: 'brevo-form-styles',
      rel: 'stylesheet',
      href: 'https://sibforms.com/forms/end-form/build/sib-styles.css'
    }
  ]
})

function setBrevoGlobals() {
  const browserWindow = window as typeof window & Record<string, unknown>
  browserWindow.REQUIRED_CODE_ERROR_MESSAGE = props.locale === 'es' ? 'Selecciona un prefijo de país' : 'Choose a country code'
  browserWindow.LOCALE = props.locale
  browserWindow.EMAIL_INVALID_MESSAGE = props.copy.invalid
  browserWindow.SMS_INVALID_MESSAGE = props.copy.invalid
  browserWindow.REQUIRED_ERROR_MESSAGE = props.copy.required
  browserWindow.GENERIC_INVALID_MESSAGE = props.copy.invalid
  browserWindow.INVALID_NUMBER = props.copy.invalid
  browserWindow.INVALID_DATE = props.locale === 'es' ? 'Introduce una fecha válida' : 'Enter a valid date'
  browserWindow.REQUIRED_MULTISELECT_MESSAGE = props.locale === 'es' ? 'Selecciona al menos una opción' : 'Select at least one option'
  browserWindow.translation = {
    common: {
      selectedList: props.locale === 'es' ? '{quantity} lista seleccionada' : '{quantity} list selected',
      selectedLists: props.locale === 'es' ? '{quantity} listas seleccionadas' : '{quantity} lists selected',
      selectedOption: props.locale === 'es' ? '{quantity} opción seleccionada' : '{quantity} selected',
      selectedOptions: props.locale === 'es' ? '{quantity} opciones seleccionadas' : '{quantity} selected'
    }
  }
  browserWindow.AUTOHIDE = false
}

function loadScript(id: string, src: string) {
  document.getElementById(id)?.remove()
  const script = document.createElement('script')
  script.id = id
  script.src = src
  script.defer = true
  document.body.appendChild(script)
}

onMounted(async () => {
  await nextTick()
  setBrevoGlobals()
  loadScript('cuebooker-brevo-script', 'https://sibforms.com/forms/end-form/build/main.js')
})

watch(() => props.locale, () => setBrevoGlobals())
</script>

<template>
  <div id="sib-form-container" class="pilot-form" aria-labelledby="pilot-form-title">
    <div id="error-message" class="sib-form-message-panel pilot-form__message pilot-form__message--error" role="alert" aria-live="polite">
      <span class="sib-form-message-panel__inner-text">{{ copy.invalid }}</span>
    </div>
    <div id="success-message" class="sib-form-message-panel pilot-form__message pilot-form__message--success" role="status" aria-live="polite">
      <span class="sib-form-message-panel__inner-text">{{ copy.success }}</span>
    </div>

    <form id="sib-form" class="pilot-form__body" method="POST" :action="formAction" data-type="subscription">
      <header>
        <p class="eyebrow">CUEBOOKER / PILOT</p>
        <h3 id="pilot-form-title">{{ copy.title }}</h3>
        <p>{{ copy.body }}</p>
      </header>

      <div class="sib-input sib-form-block">
        <div class="form__entry entry_block pilot-field">
          <label class="entry__label" for="FIRSTNAME" data-required="*">{{ copy.nameLabel }}</label>
          <div class="entry__field">
            <input id="FIRSTNAME" class="input" name="FIRSTNAME" type="text" maxlength="200" autocomplete="name" :placeholder="copy.namePlaceholder" data-required="true" required>
          </div>
          <label class="entry__error entry__error--primary" />
        </div>
      </div>

      <div class="sib-input sib-form-block">
        <div class="form__entry entry_block pilot-field">
          <label class="entry__label" for="EMAIL" data-required="*">{{ copy.emailLabel }}</label>
          <div class="entry__field">
            <input id="EMAIL" class="input" name="EMAIL" type="email" autocomplete="email" :placeholder="copy.emailPlaceholder" data-required="true" required>
          </div>
          <small>{{ copy.emailHelp }}</small>
          <label class="entry__error entry__error--primary" />
        </div>
      </div>

      <div class="sib-radiobutton-group sib-form-block" data-required="true">
        <fieldset class="form__entry entry_mcq pilot-field pilot-profile">
          <legend class="entry__label" data-required="*">{{ copy.profileLabel }}</legend>
          <label v-for="(label, index) in copy.profiles" :key="label">
            <input class="input_replaced" type="radio" name="PERFIL" :value="index + 1" :checked="profile === index + 1" required>
            <span class="radio-button" />
            <span>{{ label }}</span>
          </label>
          <label class="entry__error entry__error--primary" />
        </fieldset>
      </div>

      <div class="sib-optin sib-form-block" data-required="true">
        <div class="form__entry entry_mcq pilot-field pilot-consent">
          <span class="entry__label">{{ copy.consentLabel }}</span>
          <label>
            <input id="OPT_IN" class="input_replaced" type="checkbox" name="OPT_IN" value="1" required>
            <span class="checkbox checkbox_tick_positive" />
            <span>{{ copy.consentText }}</span>
          </label>
          <label class="entry__error entry__error--primary" />
        </div>
      </div>

      <button class="sib-form-block__button sib-form-block__button-with-loader button button--primary" form="sib-form" type="submit">
        <svg class="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512" aria-hidden="true"><path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 46.558 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" /></svg>
        {{ copy.submit }} <span>↗</span>
      </button>

      <input type="text" name="email_address_check" value="" class="input--hidden" tabindex="-1" autocomplete="off">
      <input type="hidden" name="locale" :value="locale">
    </form>
  </div>
</template>
