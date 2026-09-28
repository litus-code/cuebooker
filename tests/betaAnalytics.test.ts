import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('beta analytics dashboard stays internal and exposes founder metrics', async () => {
  const source = await readFile(new URL('../app/pages/beta-analytics.vue', import.meta.url), 'utf8')
  assert.match(source, /isInternalAdmin\(\)/)
  assert.match(source, /getBetaSummary\(days\.value\)/)
  assert.match(source, /getBetaUsers\(days\.value\)/)
  assert.match(source, /SMART CUE/)
  assert.match(source, /EVENT MEDIA/)
  assert.match(source, /AUTOMATIZACIONES/)
  assert.match(source, /Última actividad/)
})

test('first-party beta telemetry never stores free text from product actions', async () => {
  const telemetry = await readFile(new URL('../app/composables/useProductTelemetry.ts', import.meta.url), 'utf8')
  const capture = await readFile(new URL('../app/components/CueCapturePanel.vue', import.meta.url), 'utf8')

  assert.match(telemetry, /record_product_analytics_event/)
  assert.doesNotMatch(capture, /productTelemetry\.record\([^)]*initialNote/s)
  assert.doesNotMatch(capture, /productTelemetry\.record\([^)]*transcript:/s)
})
