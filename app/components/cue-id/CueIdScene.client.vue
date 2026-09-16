<script setup>
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer
} from 'three'

const props = defineProps({
  outfit: { type: String, default: 'tank' },
  accessory: { type: String, default: 'cap' },
  pose: { type: String, default: 'relaxed' },
  finish: { type: String, default: 'matte' },
  accent: { type: String, default: 'lime' }
})

const emit = defineEmits(['ready', 'error'])
const host = ref(null)

let renderer
let scene
let camera
let figure
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
let environmentAccentMaterials = []
let baseRotationX = 0
let baseRotationY = 0
let baseRotationZ = 0

const accentColors = {
  lime: 0xceff54,
  red: 0xdc2d28,
  violet: 0x9b7cff,
  white: 0xe8e8e3
}

function currentAccent() {
  return accentColors[props.accent] || accentColors.lime
}

function makeClothMaterial(multiplier = 1) {
  if (props.finish === 'chrome') {
    return new MeshStandardMaterial({ color: 0x242724, metalness: 0.78, roughness: 0.18 })
  }
  if (props.finish === 'satin') {
    return new MeshStandardMaterial({ color: 0x171917, metalness: 0.18, roughness: 0.34 })
  }
  return new MeshStandardMaterial({ color: multiplier < 1 ? 0x101210 : 0x171917, metalness: 0.04, roughness: 0.78 })
}

function makeSkinMaterial() {
  return new MeshStandardMaterial({ color: 0x756960, metalness: 0, roughness: 0.82 })
}

function makeShoeMaterial() {
  return new MeshStandardMaterial({ color: 0x111211, metalness: 0.08, roughness: 0.48 })
}

function makeAccentMaterial(opacity = 1) {
  return new MeshBasicMaterial({
    color: currentAccent(),
    toneMapped: false,
    transparent: opacity < 1,
    opacity
  })
}

function addMesh(group, geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  group.add(mesh)
  return mesh
}

function disposeObject(root) {
  root?.traverse((node) => {
    if (!node.isMesh) return
    node.geometry?.dispose?.()
    if (Array.isArray(node.material)) node.material.forEach(material => material?.dispose?.())
    else node.material?.dispose?.()
  })
}

function buildArm(side, upperMaterial, forearmMaterial, skinMaterial) {
  const arm = new Group()
  arm.position.set(side * 0.58, 1.28, 0)

  addMesh(arm, new CylinderGeometry(0.13, 0.115, 0.62, 12), upperMaterial, [0, -0.3, 0])

  const forearm = new Group()
  forearm.position.set(0, -0.61, 0)
  addMesh(forearm, new CylinderGeometry(0.115, 0.095, 0.58, 12), forearmMaterial, [0, -0.27, 0])
  addMesh(forearm, new SphereGeometry(0.115, 14, 10), skinMaterial, [0, -0.61, 0], [0, 0, 0], [0.88, 1.05, 0.8])
  arm.add(forearm)

  return { arm, forearm }
}

function buildLeg(side, trouserMaterial, shoeMaterial) {
  const leg = new Group()
  leg.position.set(side * 0.255, 0.25, 0)

  addMesh(leg, new CylinderGeometry(0.235, 0.205, 0.87, 12), trouserMaterial, [0, -0.42, 0], [0, 0, side * 0.015])
  addMesh(leg, new BoxGeometry(0.18, 0.27, 0.16), trouserMaterial, [side * 0.23, -0.42, 0.04], [0, 0, side * 0.04])

  const shin = new Group()
  shin.position.set(0, -0.84, 0)
  addMesh(shin, new CylinderGeometry(0.195, 0.165, 0.78, 12), trouserMaterial, [0, -0.36, 0])
  addMesh(shin, new BoxGeometry(0.36, 0.2, 0.58), shoeMaterial, [0, -0.82, 0.13], [0.03, 0, 0])
  leg.add(shin)

  return { leg, shin }
}

function buildOutfit(root, clothMaterial, skinMaterial) {
  const darkCloth = makeClothMaterial(0.8)
  const torsoScale = [1, 1, 0.58]

  if (props.outfit === 'tank') {
    addMesh(root, new CylinderGeometry(0.5, 0.4, 1.02, 16), clothMaterial, [0, 0.84, 0], [0, 0, 0], torsoScale)
    addMesh(root, new BoxGeometry(0.13, 0.36, 0.18), clothMaterial, [-0.31, 1.35, 0.02])
    addMesh(root, new BoxGeometry(0.13, 0.36, 0.18), clothMaterial, [0.31, 1.35, 0.02])
    return { upperArm: skinMaterial, forearm: skinMaterial, darkCloth }
  }

  if (props.outfit === 'tee') {
    addMesh(root, new CylinderGeometry(0.52, 0.41, 1.03, 16), clothMaterial, [0, 0.84, 0], [0, 0, 0], torsoScale)
    return { upperArm: clothMaterial, forearm: skinMaterial, darkCloth }
  }

  if (props.outfit === 'hoodie') {
    addMesh(root, new CylinderGeometry(0.57, 0.45, 1.08, 16), clothMaterial, [0, 0.82, 0], [0, 0, 0], [1, 1, 0.62])
    const hood = addMesh(root, new TorusGeometry(0.36, 0.13, 8, 22, Math.PI * 1.25), clothMaterial, [0, 1.67, -0.08], [0, 0, -Math.PI * 0.12])
    hood.scale.z = 0.72
    addMesh(root, new BoxGeometry(0.24, 0.28, 0.09), darkCloth, [0, 0.56, 0.34])
    return { upperArm: clothMaterial, forearm: clothMaterial, darkCloth }
  }

  addMesh(root, new CylinderGeometry(0.55, 0.43, 1.07, 16), clothMaterial, [0, 0.83, 0], [0, 0, 0], [1, 1, 0.61])
  addMesh(root, new BoxGeometry(0.16, 0.9, 0.09), darkCloth, [-0.19, 0.88, 0.36], [0, 0, -0.14])
  addMesh(root, new BoxGeometry(0.16, 0.9, 0.09), darkCloth, [0.19, 0.88, 0.36], [0, 0, 0.14])
  return { upperArm: clothMaterial, forearm: clothMaterial, darkCloth }
}

function buildAccessory(root, skinMaterial, clothMaterial, accentMaterial) {
  if (props.accessory === 'cap') {
    addMesh(root, new CylinderGeometry(0.36, 0.38, 0.18, 20), clothMaterial, [0, 2.28, 0])
    addMesh(root, new BoxGeometry(0.48, 0.045, 0.28), clothMaterial, [0, 2.2, 0.27], [-0.08, 0, 0])
    addMesh(root, new BoxGeometry(0.11, 0.02, 0.22), accentMaterial, [0.18, 2.21, 0.29], [-0.08, 0, 0])
    return
  }

  if (props.accessory === 'headphones') {
    const band = addMesh(root, new TorusGeometry(0.42, 0.055, 8, 30, Math.PI), clothMaterial, [0, 2.03, 0], [0, 0, 0])
    band.rotation.z = 0
    addMesh(root, new BoxGeometry(0.12, 0.27, 0.16), clothMaterial, [-0.4, 1.95, 0])
    addMesh(root, new BoxGeometry(0.12, 0.27, 0.16), clothMaterial, [0.4, 1.95, 0])
    addMesh(root, new BoxGeometry(0.04, 0.13, 0.18), accentMaterial, [-0.465, 1.95, 0])
    addMesh(root, new BoxGeometry(0.04, 0.13, 0.18), accentMaterial, [0.465, 1.95, 0])
    return
  }

  if (props.accessory === 'glasses') {
    addMesh(root, new BoxGeometry(0.29, 0.12, 0.04), clothMaterial, [-0.17, 1.99, 0.34])
    addMesh(root, new BoxGeometry(0.29, 0.12, 0.04), clothMaterial, [0.17, 1.99, 0.34])
    addMesh(root, new BoxGeometry(0.08, 0.025, 0.04), accentMaterial, [0, 1.99, 0.34])
  }
}

function applyPose(refs) {
  const { leftArm, rightArm, leftForearm, rightForearm, leftLeg, rightLeg, head } = refs
  baseRotationX = 0
  baseRotationY = 0
  baseRotationZ = 0

  leftArm.rotation.set(0, 0, 0.06)
  rightArm.rotation.set(0, 0, -0.06)
  leftForearm.rotation.set(0, 0, 0)
  rightForearm.rotation.set(0, 0, 0)
  leftLeg.rotation.set(0, 0, 0)
  rightLeg.rotation.set(0, 0, 0)
  head.rotation.set(0, 0, 0)

  if (props.pose === 'relaxed') {
    baseRotationY = -0.08
    baseRotationZ = -0.018
    leftArm.rotation.z = 0.12
    rightArm.rotation.z = -0.18
    leftForearm.rotation.z = -0.05
    rightForearm.rotation.z = 0.08
    leftLeg.rotation.z = 0.025
    rightLeg.rotation.z = -0.035
    head.rotation.z = -0.025
    return
  }

  if (props.pose === 'focused') {
    baseRotationY = 0.04
    leftArm.rotation.x = -0.34
    rightArm.rotation.x = -0.34
    leftForearm.rotation.x = -0.48
    rightForearm.rotation.x = -0.48
    leftArm.rotation.z = 0.03
    rightArm.rotation.z = -0.03
    head.rotation.x = -0.14
    return
  }

  if (props.pose === 'editorial') {
    baseRotationY = -0.18
    baseRotationZ = -0.028
    leftArm.rotation.z = 0.3
    leftForearm.rotation.z = -0.88
    rightArm.rotation.z = -0.12
    rightForearm.rotation.z = 0.08
    leftLeg.rotation.z = 0.05
    rightLeg.rotation.z = -0.02
    head.rotation.y = 0.12
  }
}

function buildFigure() {
  const root = new Group()
  root.position.y = -0.05
  root.scale.setScalar(0.94)

  const skinMaterial = makeSkinMaterial()
  const clothMaterial = makeClothMaterial()
  const trouserMaterial = makeClothMaterial(0.8)
  const shoeMaterial = makeShoeMaterial()
  const accentMaterial = makeAccentMaterial()

  addMesh(root, new CylinderGeometry(0.14, 0.15, 0.28, 12), skinMaterial, [0, 1.55, 0])
  const head = addMesh(root, new SphereGeometry(0.36, 24, 18), skinMaterial, [0, 1.94, 0], [0, 0, 0], [0.92, 1.08, 0.9])

  const outfit = buildOutfit(root, clothMaterial, skinMaterial)
  const leftArmRefs = buildArm(-1, outfit.upperArm, outfit.forearm, skinMaterial)
  const rightArmRefs = buildArm(1, outfit.upperArm, outfit.forearm, skinMaterial)
  root.add(leftArmRefs.arm, rightArmRefs.arm)

  const leftLegRefs = buildLeg(-1, trouserMaterial, shoeMaterial)
  const rightLegRefs = buildLeg(1, trouserMaterial, shoeMaterial)
  root.add(leftLegRefs.leg, rightLegRefs.leg)

  addMesh(root, new BoxGeometry(0.72, 0.13, 0.45), trouserMaterial, [0, 0.34, 0])
  addMesh(root, new BoxGeometry(0.09, 0.06, 0.47), accentMaterial, [0.24, 0.35, 0.02])

  buildAccessory(root, skinMaterial, clothMaterial, accentMaterial)

  applyPose({
    leftArm: leftArmRefs.arm,
    rightArm: rightArmRefs.arm,
    leftForearm: leftArmRefs.forearm,
    rightForearm: rightArmRefs.forearm,
    leftLeg: leftLegRefs.leg,
    rightLeg: rightLegRefs.leg,
    head
  })

  root.rotation.set(baseRotationX, baseRotationY, baseRotationZ)
  return root
}

function rebuildFigure() {
  if (!scene) return
  if (figure) {
    scene.remove(figure)
    disposeObject(figure)
  }
  figure = buildFigure()
  scene.add(figure)
  if (accentLight) accentLight.color.setHex(currentAccent())
  updateEnvironmentAccent()
  renderOnce()
}

function buildEnvironment() {
  const floorMaterial = new MeshBasicMaterial({ color: 0x1c1f1b, transparent: true, opacity: 0.72 })
  const floor = new Mesh(new CircleGeometry(2.2, 48), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.53
  scene.add(floor)

  environmentAccentMaterials = []
  for (const [radius, opacity] of [[1.25, 0.92], [1.72, 0.28]]) {
    const ringMaterial = makeAccentMaterial(opacity)
    environmentAccentMaterials.push(ringMaterial)
    const ring = new Mesh(new TorusGeometry(radius, 0.015, 6, 72), ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -1.505
    scene.add(ring)
  }
}

function updateEnvironmentAccent() {
  const nextAccent = currentAccent()
  environmentAccentMaterials.forEach(material => material.color.setHex(nextAccent))
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

function animate(time = 0) {
  frame = 0
  if (!renderer || !scene || !camera || !figure) return

  if (visible && pageVisible) {
    if (!reducedMotion) {
      const t = time * 0.001
      figure.position.y = -0.05 + Math.sin(t * 0.72) * 0.016
      figure.rotation.y += ((baseRotationY + pointerX * 0.12 + Math.sin(t * 0.22) * 0.035) - figure.rotation.y) * 0.045
      figure.rotation.x += ((baseRotationX + pointerY * -0.025) - figure.rotation.x) * 0.045
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
  disposeObject(scene)
  renderer?.dispose()
  renderer?.forceContextLoss?.()
  renderer?.domElement?.remove()
}

onMounted(() => {
  try {
    if (!host.value) return
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    scene = new Scene()
    scene.background = new Color(0x060706)
    scene.fog = new FogExp2(0x060706, 0.055)

    camera = new PerspectiveCamera(31, 1, 0.1, 30)
    camera.position.set(0, 0.38, 6.1)

    const mobile = window.matchMedia('(max-width: 760px)').matches
    renderer = new WebGLRenderer({
      alpha: false,
      antialias: !mobile,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.1 : 1.45))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.04
    host.value.appendChild(renderer.domElement)

    const hemisphere = new HemisphereLight(0xd8ddd4, 0x030403, 1.42)
    scene.add(hemisphere)

    const key = new DirectionalLight(0xf1eee7, 2.45)
    key.position.set(-2.6, 4.2, 3.5)
    scene.add(key)

    const rim = new DirectionalLight(0x656a62, 1.15)
    rim.position.set(2.8, 1.5, -2.8)
    scene.add(rim)

    accentLight = new PointLight(currentAccent(), 2.25, 6.5, 2)
    accentLight.position.set(1.8, 0.7, 2.8)
    scene.add(accentLight)

    buildEnvironment()
    rebuildFigure()

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

watch(
  () => [props.outfit, props.accessory, props.pose, props.finish, props.accent],
  rebuildFigure
)

onBeforeUnmount(disposeScene)
</script>

<template>
  <div ref="host" class="cue-id-scene" aria-hidden="true" />
</template>

<style scoped>
.cue-id-scene { position: absolute; inset: 0; overflow: hidden; background: #060706; }
.cue-id-scene :deep(canvas) { display: block; width: 100%; height: 100%; touch-action: pan-y; }
</style>
