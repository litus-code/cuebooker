<script setup lang="ts">
import type { CueIdConfigV1 } from '../domain/cueId'

const props = defineProps<{
  config: CueIdConfigV1
}>()

const analytics = useAnalytics()

const emit = defineEmits<{
  ready: []
  failed: []
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const host = ref<HTMLElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const visible = ref(false)

let frame = 0
let observer: IntersectionObserver | null = null
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let buffer: WebGLBuffer | null = null
let positionLocation = -1
let matrixLocation: WebGLUniformLocation | null = null
let colorLocation: WebGLUniformLocation | null = null
let vertexCount = 0
let resizeObserver: ResizeObserver | null = null
let reducedMotion = false

const cubeVertices = new Float32Array([
  -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5,
  -0.5,-0.5,-0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,
  -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5,
  -0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  -0.5,-0.5,-0.5, -0.5, 0.5,-0.5, -0.5, 0.5, 0.5,
  -0.5,-0.5,-0.5, -0.5, 0.5, 0.5, -0.5,-0.5, 0.5,
   0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,
   0.5,-0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
  -0.5,-0.5,-0.5, -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,
  -0.5,-0.5,-0.5,  0.5,-0.5, 0.5,  0.5,-0.5,-0.5,
  -0.5, 0.5,-0.5, -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,
  -0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5
])

function mat4Identity() {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
}

function mat4Multiply(a: number[], b: number[]) {
  const out = new Array(16).fill(0)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3]
    }
  }
  return out
}

function mat4Translate(x: number, y: number, z: number) {
  const m = mat4Identity()
  m[12] = x; m[13] = y; m[14] = z
  return m
}

function mat4Scale(x: number, y: number, z: number) {
  const m = mat4Identity()
  m[0] = x; m[5] = y; m[10] = z
  return m
}

function mat4RotateY(rad: number) {
  const c = Math.cos(rad), s = Math.sin(rad)
  return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]
}

function mat4RotateZ(rad: number) {
  const c = Math.cos(rad), s = Math.sin(rad)
  return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]
}

function mat4Perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2)
  const nf = 1 / (near - far)
  return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,(2*far*near)*nf,0]
}

function compile(type: number, source: string) {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function init() {
  const el = canvas.value
  if (!el) return false
  gl = el.getContext('webgl', { antialias: true, alpha: true, powerPreference: 'low-power' })
  if (!gl) return false

  const vs = compile(gl.VERTEX_SHADER, `
    attribute vec3 a_position;
    uniform mat4 u_matrix;
    void main(){ gl_Position = u_matrix * vec4(a_position, 1.0); }
  `)
  const fs = compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec4 u_color;
    void main(){ gl_FragColor = u_color; }
  `)
  if (!vs || !fs) return false

  program = gl.createProgram()
  if (!program) return false
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false

  positionLocation = gl.getAttribLocation(program, 'a_position')
  matrixLocation = gl.getUniformLocation(program, 'u_matrix')
  colorLocation = gl.getUniformLocation(program, 'u_color')
  buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW)
  vertexCount = cubeVertices.length / 3

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  ready.value = true
  analytics.track('cue_id_renderer_ready', {
    renderer: 'webgl_procedural',
    reduced_motion: reducedMotion
  })
  emit('ready')
  resize()
  return true
}

function resize() {
  if (!canvas.value || !gl) return
  const rect = canvas.value.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.value.width !== width || canvas.value.height !== height) {
    canvas.value.width = width
    canvas.value.height = height
  }
  gl.viewport(0, 0, width, height)
}

function rgba(hex: string, alpha = 1) {
  const value = hex.replace('#','')
  const n = parseInt(value, 16)
  return [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255, alpha]
}

function drawCube(world: number[], pos: [number,number,number], scale: [number,number,number], color: number[], rotZ = 0) {
  if (!gl || !program || !matrixLocation || !colorLocation) return
  let model = mat4Multiply(world, mat4Translate(...pos))
  if (rotZ) model = mat4Multiply(model, mat4RotateZ(rotZ))
  model = mat4Multiply(model, mat4Scale(...scale))
  gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(model))
  gl.uniform4fv(colorLocation, new Float32Array(color))
  gl.drawArrays(gl.TRIANGLES, 0, vertexCount)
}

function render(time = 0) {
  if (!gl || !program || !visible.value || document.hidden) return
  resize()
  const aspect = canvas.value ? canvas.value.width / canvas.value.height : 1
  gl.clearColor(0,0,0,0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

  const projection = mat4Perspective(Math.PI / 4.2, aspect, .1, 100)
  const camera = mat4Translate(0, .1, -7.2)
  const idle = reducedMotion ? 0 : Math.sin(time * .00045) * .08
  const poseRotation = props.config.pose === 'editorial' ? .28 : props.config.pose === 'focused' ? -.08 : props.config.pose === 'relaxed' ? .14 : 0
  const world = mat4Multiply(projection, mat4Multiply(camera, mat4RotateY(-.22 + idle + poseRotation)))

  const buildX = props.config.build === 'strong' ? 1.12 : props.config.build === 'slim' ? .88 : 1
  const bodyColor = props.config.material === 'satin' ? rgba('#565d54', .98) : rgba('#2f352f', .98)
  const dark = rgba('#141714', 1)
  const accent = props.config.accent === 'red' ? rgba('#ff4545', .95) : props.config.accent === 'lime' ? rgba('#ceff54', .95) : rgba('#7c827a', .72)

  drawCube(world, [0,1.45,0], [.72,.82,.68], bodyColor)
  drawCube(world, [0,.15,0], [1.15 * buildX,1.45,.62], bodyColor)
  drawCube(world, [-1.0 * buildX,.1,0], [.28,1.35,.34], dark, props.config.pose === 'relaxed' ? -.12 : .04)
  drawCube(world, [1.0 * buildX,.1,0], [.28,1.35,.34], dark, props.config.pose === 'focused' ? -.08 : -.04)
  drawCube(world, [-.48,-1.85,0], [.35,1.35,.4], dark)
  drawCube(world, [.48,-1.85,0], [.35,1.35,.4], dark)

  // outfit layer
  if (props.config.outfit === 'hoodie') drawCube(world, [0,.55,-.1], [1.28 * buildX,.95,.7], rgba('#232823', .82))
  if (props.config.outfit === 'bomber') drawCube(world, [0,.45,-.08], [1.35 * buildX,.9,.75], rgba('#3a4038', .86))
  if (props.config.outfit === 'tank') drawCube(world, [0,.35,-.22], [.72 * buildX,1.0,.18], rgba('#080908', .92))

  // accessory cues
  if (props.config.accessory === 'headphones') {
    drawCube(world, [-.68,1.48,0], [.14,.42,.2], dark)
    drawCube(world, [.68,1.48,0], [.14,.42,.2], dark)
    drawCube(world, [0,1.88,0], [.62,.08,.18], dark)
  } else if (props.config.accessory === 'cap') {
    drawCube(world, [0,2.0,0], [.78,.12,.72], dark)
  } else if (props.config.accessory === 'glasses') {
    drawCube(world, [0,1.52,-.64], [.68,.07,.08], rgba('#d8d9d4', .8))
  }

  drawCube(world, [0,.6,-.67], [.82 * buildX,.035,.04], accent)

  if (!reducedMotion) frame = requestAnimationFrame(render)
}

function start() {
  cancelAnimationFrame(frame)
  if (visible.value && ready.value) {
    if (reducedMotion) render(0)
    else frame = requestAnimationFrame(render)
  }
}

function handleVisibility() {
  if (document.hidden) cancelAnimationFrame(frame)
  else start()
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!init()) {
    failed.value = true
    analytics.track('cue_id_renderer_failed', {
      renderer: 'webgl_procedural',
      reason: 'webgl_init_failed'
    })
    analytics.track('cue_id_static_fallback_used', {
      reason: 'webgl_init_failed'
    })
    emit('failed')
    return
  }

  observer = new IntersectionObserver(entries => {
    visible.value = Boolean(entries[0]?.isIntersecting)
    start()
  }, { rootMargin: '180px 0px', threshold: .01 })

  if (host.value) observer.observe(host.value)
  resizeObserver = new ResizeObserver(() => resize())
  if (host.value) resizeObserver.observe(host.value)
  document.addEventListener('visibilitychange', handleVisibility)
})

watch(() => props.config, () => {
  if (reducedMotion && visible.value) render(0)
}, { deep: true })

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibility)
  if (gl && buffer) gl.deleteBuffer(buffer)
  if (gl && program) gl.deleteProgram(program)
  gl = null
})
</script>

<template>
  <div ref="host" class="cue-id-runtime" :class="{ ready, failed }" aria-hidden="true">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.cue-id-runtime{position:absolute;inset:0;z-index:3;opacity:0;transition:opacity .35s ease;pointer-events:none}
.cue-id-runtime.ready{opacity:1}
.cue-id-runtime.failed{display:none}
.cue-id-runtime canvas{display:block;width:100%;height:100%}
@media(prefers-reduced-motion:reduce){.cue-id-runtime{transition:none}}
</style>
