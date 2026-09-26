import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

export async function renderProduct(container: HTMLDivElement, onReady: () => void, onFailure: () => void) {
  const scene = new THREE.Scene()
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.setClearColor(0xffffff, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  container.appendChild(renderer.domElement)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  let environment = pmrem.fromScene(room, .025)
  scene.environment = environment.texture
  room.dispose()
  const camera = new THREE.PerspectiveCamera(29, 1, .01, 30)
  camera.position.set(0, .85, 2.6)
  camera.lookAt(0, .58, 0)
  const key = new THREE.DirectionalLight(0xffffff, 1.1)
  key.position.set(-2, 3, 4)
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0x8b9298, .5))
  let model: THREE.Group | undefined
  let disposed = false
  const initialRotation = -.40
  const render = () => { if (!disposed) renderer.render(scene, camera) }
  new HDRLoader().load('/vision/assets/materials/daylight.hdr', texture => {
    if (disposed) { texture.dispose(); return }
    const studio = pmrem.fromEquirectangular(texture)
    scene.environment = studio.texture
    environment.dispose()
    environment = studio
    texture.dispose()
    render()
  }, undefined, () => { /* Local studio lighting remains a complete fallback. */ })
  const resize = () => {
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    camera.aspect = width / height
    camera.position.z = camera.aspect < .85 ? 3.15 : 2.6
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    render()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  function disposeModel(group: THREE.Object3D) {
    group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach(material => {
          Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.dispose() })
          material.dispose()
        })
      }
    })
  }
  const lost = (event: Event) => { event.preventDefault(); onFailure() }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  let pointer: { id: number; x: number } | null = null
  const down = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointer = { id: event.pointerId, x: event.clientX }
    container.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId || !model) return
    model.rotation.y += (event.clientX - pointer.x) * .009
    pointer.x = event.clientX
    render()
  }
  const up = () => { pointer = null }
  container.addEventListener('pointerdown', down)
  container.addEventListener('pointermove', move)
  container.addEventListener('pointerup', up)
  container.addEventListener('pointercancel', up)
  container.addEventListener('lostpointercapture', up)
  resize()
  // No render loop: frames are drawn only after a resize or a user rotation.
  new GLTFLoader().load('/research/cooking-machine.glb', gltf => {
    if (disposed) { disposeModel(gltf.scene); return }
    model = gltf.scene
    model.rotation.y = initialRotation
    scene.add(model)
    render()
    onReady()
  }, undefined, () => { if (!disposed) onFailure() })
  return {
    rotate(delta: number) { if (model) { model.rotation.y += delta; render() } },
    reset() { if (model) { model.rotation.y = initialRotation; render() } },
    dispose() {
      disposed = true
      resizeObserver.disconnect()
      container.removeEventListener('pointerdown', down)
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerup', up)
      container.removeEventListener('pointercancel', up)
      container.removeEventListener('lostpointercapture', up)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      if (model) disposeModel(model)
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
