<script setup>
import * as THREE from 'three'

const props = defineProps({
  material: { type: String, default: 'matte' },
  accent: { type: String, default: 'lime' }
})

const emit = defineEmits(['ready', 'error'])
const host = ref(null)

let renderer
let scene
let camera
let figure
let accentMaterial
let bodyMaterial
let accentLight
let resizeObserver
let intersectionObserver
let frame = 0
let visible = true
let pageVisible = true
let reducedMotion = false
let pointerX = 0
let pointerY = 0
let lastWidth = 0
let lastHeight = 0

const accentColors = {
  lime: 0xceff54,
  red: 0xdc2d28,
  violet: 0x9b7cff
}

function currentAccent() {
  return accentColors[props.accent] || accentColors.lime
}

function makeBodyMaterial() {
  if (props.material === 'chrome') {
    return new THREE.MeshStandardMaterial({ color: 0x747a70, metalness: 0.96, roughness: 0.16 })
  }
  if (props.material === 'glass') {
    return new THREE.MeshPhysicalMaterial({
      color: 0x242923,
      metalness: 0.15,
      roughness: 0.12,
      transmission: 0.5,
      transparent: true,
      opacity: 0.9,
      thickness: 0.8
    })
  }
  return new THREE.MeshStandardMaterial({ color: 0x171a16, metalness: 0.42, roughness: 0.48 })
}

function addMesh(group, geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  group.add(mesh)
  return mesh
}

function buildFigure() {
  figure = new THREE.Group()
  figure.position.y = -0.1
  bodyMaterial = makeBodyMaterial()
  accentMaterial = new THREE.MeshBasicMaterial({ color: currentAccent(), toneMapped: false })

  addMesh(figure, new THREE.IcosahedronGeometry(0.49, 2), bodyMaterial, [0, 1.18, 0])
  addMesh(figure, new THREE.BoxGeometry(0.78, 0.1, 0.57), accentMaterial, [0, 1.18, 0.39])

  const torso = addMesh(
    figure,
    new THREE.CylinderGeometry(0.63, 0.45, 1.55, 6, 1, false),
    bodyMaterial,
    [0, 0.08, 0],
    [0, 0.06, 0]
  )
  torso.scale.z = 0.72

  addMesh(figure, new THREE.CylinderGeometry(0.18, 0.14, 1.3, 6), bodyMaterial, [-0.69, 0.02, 0], [0, 0, -0.09])
  addMesh(figure, new THREE.CylinderGeometry(0.18, 0.14, 1.3, 6), bodyMaterial, [0.69, 0.02, 0], [0, 0, 0.09])
  addMesh(figure, new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6), accentMaterial, [0, 0.08, 0.52])

  const neckRing = addMesh(figure, new THREE.TorusGeometry(0.39, 0.018, 8, 64), accentMaterial, [0, 0.86, 0], [Math.PI / 2, 0, 0])
  neckRing.scale.z = 0.75

  scene.add(figure)
}

function buildEnvironment() {
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x262a24, transparent: true, opacity: 0.52 })
  const accent = accentMaterial

  for (const [radius, opacity] of [[1.45, 0.72], [2.05, 0.32]]) {
    const ringMaterial = accent.clone()
    ringMaterial.transparent = true
    ringMaterial.opacity = opacity
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 6, 96), ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.95
    scene.add(ring)
  }

  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.25, 48), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.04
  scene.add(floor)
}

function resize() {
  if (!host.value || !renderer || !camera) return
  const width = Math.max(1, host.value.clientWidth)
  const height = Math.max(1, host.value.clientHeight)
  if (width === lastWidth && height === lastHeight) return
  lastWidth = width
  lastHeight = height
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  renderOnce()
}

function renderOnce() {
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function updateMaterials() {
  if (!figure || !scene) return
  const nextBody = makeBodyMaterial()
  const nextAccent = currentAccent()

  figure.traverse((node) => {
    if (!node.isMesh) return
    if (node.material === bodyMaterial) node.material = nextBody
    if (node.material === accentMaterial) node.material.color.setHex(nextAccent)
  })
  bodyMaterial?.dispose()
  bodyMaterial = nextBody
  accentMaterial?.color.setHex(nextAccent)
  if (accentLight) accentLight.color.setHex(nextAccent)
  renderOnce()
}

function animate(time = 0) {
  frame = 0
  if (!renderer || !scene || !camera || !figure) return

  if (visible && pageVisible) {
    if (!reducedMotion) {
      const t = time * 0.001
      figure.position.y = -0.1 + Math.sin(t * 0.8) * 0.035
      figure.rotation.y += ((pointerX * 0.18 + Math.sin(t * 0.28) * 0.09) - figure.rotation.y) * 0.045
      figure.rotation.x += ((pointerY * -0.06) - figure.rotation.x) * 0.045
    }
    renderer.render(scene, camera)
  }

  if (!reducedMotion && visible && pageVisible) frame = requestAnimationFrame(animate)
}

function startLoop() {
  if (reducedMotion) {
    renderOnce()
    return
  }
  if (!frame && visible && pageVisible) frame = requestAnimationFrame(animate)
}

function stopLoop() {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function onPointerMove(event) {
  if (!host.value || reducedMotion) return
  const bounds = host.value.getBoundingClientRect()
  pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
  pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
}

function onVisibilityChange() {
  pageVisible = !document.hidden
  if (pageVisible) startLoop()
  else stopLoop()
}

function disposeScene() {
  stopLoop()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  host.value?.removeEventListener('pointermove', onPointerMove)

  scene?.traverse((node) => {
    if (!node.isMesh) return
    node.geometry?.dispose?.()
    if (Array.isArray(node.material)) node.material.forEach(material => material?.dispose?.())
    else node.material?.dispose?.()
  })
  renderer?.dispose()
  renderer?.forceContextLoss?.()
  renderer?.domElement?.remove()
}

onMounted(() => {
  try {
    if (!host.value) return
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060706)
    scene.fog = new THREE.FogExp2(0x060706, 0.075)

    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    camera.position.set(0, 0.25, 5.15)

    const mobile = window.matchMedia('(max-width: 760px)').matches
    renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: !mobile,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    host.value.appendChild(renderer.domElement)

    const hemisphere = new THREE.HemisphereLight(0xdfe7d8, 0x050605, 1.45)
    scene.add(hemisphere)

    const key = new THREE.DirectionalLight(0xffffff, 2.1)
    key.position.set(-2.4, 3.1, 3.2)
    scene.add(key)

    const rim = new THREE.DirectionalLight(0x7f8879, 1.25)
    rim.position.set(2.7, 1.2, -2.4)
    scene.add(rim)

    accentLight = new THREE.PointLight(currentAccent(), 3.3, 7, 2)
    accentLight.position.set(1.35, 0.55, 2.4)
    scene.add(accentLight)

    buildFigure()
    buildEnvironment()

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)

    intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible) startLoop()
      else stopLoop()
    }, { threshold: 0.04 })
    intersectionObserver.observe(host.value)

    document.addEventListener('visibilitychange', onVisibilityChange)
    host.value.addEventListener('pointermove', onPointerMove, { passive: true })

    resize()
    startLoop()
    requestAnimationFrame(() => emit('ready'))
  } catch (error) {
    disposeScene()
    emit('error', error)
  }
})

watch(() => [props.material, props.accent], updateMaterials)
onBeforeUnmount(disposeScene)
</script>

<template>
  <div ref="host" class="cue-id-scene" aria-hidden="true" />
</template>

<style scoped>
.cue-id-scene { position: absolute; inset: 0; overflow: hidden; background: #060706; }
.cue-id-scene :deep(canvas) { display: block; width: 100%; height: 100%; touch-action: pan-y; }
</style>
