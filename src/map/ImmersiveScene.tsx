import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Water } from 'three/addons/objects/Water2.js'
import { Tree } from '@dgreenheck/ez-tree'
import { ArrowLeft, Eye, Mountain, Pause, Play, RotateCcw } from 'lucide-react'
import lake from './glendalough-lake.json'
import { decodeElevation, insideRing, localPoint, metresPerWorld, originWorld } from './scene-geography'
import './immersive.css'

type TileJSON = { tiles: string[]; maxzoom: number; attribution?: string }
type SceneControls = { reset: (aerial: boolean) => void; pause: (value: boolean) => void }

async function tileCanvas(metadata: TileJSON, zoom: number, x: number, y: number, signal: AbortSignal) {
  const template = new URL(metadata.tiles[0])
  if (template.origin !== 'https://api.maptiler.com') throw new Error('Unexpected tile provider')
  const url = metadata.tiles[0].replace('{z}', String(zoom)).replace('{x}', String(x)).replace('{y}', String(y))
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Landscape tile unavailable')
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: 'none' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width; canvas.height = bitmap.height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(bitmap, 0, 0); bitmap.close()
  return canvas
}

// Procedural normal texture for the library's existing water shader. This adds
// fine ripples, not geographic features or invented lake bathymetry.
function rippleTexture(phase: number) {
  const size = 128, data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2
    const a = Math.sin(u * 4 + v * 3 + phase) * .22 + Math.sin(u * 9 - v * 7) * .08
    const b = Math.cos(u * 3 - v * 5 + phase) * .2 + Math.cos(u * 8 + v * 6) * .07
    const i = (y * size + x) * 4
    data[i] = 128 + a * 127; data[i + 1] = 128 + b * 127; data[i + 2] = 250; data[i + 3] = 255
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

export default function ImmersiveScene({ onClose }: { onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const controls = useRef<SceneControls | null>(null)
  const [status, setStatus] = useState('Loading the real landscape…')
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [aerial, setAerial] = useState(false)
  const [credits, setCredits] = useState('© MapTiler')

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = oldOverflow; previous?.focus() }
  }, [])

  useEffect(() => {
    const container = host.current!
    const abort = new AbortController()
    let disposed = false, frame = 0
    const cleanup: (() => void)[] = []
    let renderer: THREE.WebGLRenderer | undefined
    const scene = new THREE.Scene()
    const textures = new Set<THREE.Texture>()
    setReady(false); setError(false); setStatus('Loading the real landscape…')
    const timeout = window.setTimeout(() => abort.abort(), 45000)

    async function build() {
      const key = import.meta.env.VITE_MAPTILER_API_KEY?.trim()
      if (!key) throw new Error('Map connection required')
      const metadata = await Promise.all(['satellite-v2', 'terrain-rgb-v2'].map(async (id) => {
        const response = await fetch(`https://api.maptiler.com/tiles/${id}/tiles.json?key=${encodeURIComponent(key)}`, { signal: abort.signal })
        if (!response.ok) throw new Error('Map provider unavailable')
        return response.json() as Promise<TileJSON>
      }))
      if (disposed) return
      const attribution = document.createElement('div')
      attribution.innerHTML = metadata[0].attribution || '© MapTiler'
      setCredits(attribution.textContent || '© MapTiler')
      const z = Math.min(13, metadata[0].maxzoom, metadata[1].maxzoom), count = 2 ** z
      const left = Math.floor(originWorld[0] * count - .5), top = Math.floor(originWorld[1] * count - .5)
      const tiles = await Promise.all([0, 1, 2, 3].map(async (i) => {
        const x = left + i % 2, y = top + Math.floor(i / 2)
        const [image, dem] = await Promise.all(metadata.map((m) => tileCanvas(m, z, x, y, abort.signal)))
        return { image, dem, x, y }
      }))
      if (disposed) return
      window.clearTimeout(timeout)
      setStatus('Preparing water and woodland…')
      const imageSize = tiles[0].image.width, demSize = tiles[0].dem.width
      const imagery = document.createElement('canvas'), elevation = document.createElement('canvas')
      imagery.width = imagery.height = imageSize * 2; elevation.width = elevation.height = demSize * 2
      const imageContext = imagery.getContext('2d')!, demContext = elevation.getContext('2d')!
      for (const tile of tiles) {
        imageContext.drawImage(tile.image, (tile.x - left) * imageSize, (tile.y - top) * imageSize)
        demContext.drawImage(tile.dem, (tile.x - left) * demSize, (tile.y - top) * demSize)
      }
      const heights = demContext.getImageData(0, 0, elevation.width, elevation.height).data
      const x0 = (left / count - originWorld[0]) * metresPerWorld
      const z0 = (top / count - originWorld[1]) * metresPerWorld
      const width = 2 / count * metresPerWorld
      const elevationAt = (x: number, z: number) => {
        const px = THREE.MathUtils.clamp((x - x0) / width * (elevation.width - 1), 0, elevation.width - 1)
        const py = THREE.MathUtils.clamp((z - z0) / width * (elevation.height - 1), 0, elevation.height - 1)
        const sample = (ix: number, iy: number) => {
          const i = (iy * elevation.width + ix) * 4
          return decodeElevation(heights[i], heights[i + 1], heights[i + 2])
        }
        const ix = Math.floor(px), iy = Math.floor(py), jx = Math.min(ix + 1, elevation.width - 1), jy = Math.min(iy + 1, elevation.height - 1)
        return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(ix, iy), sample(jx, iy), px - ix), THREE.MathUtils.lerp(sample(ix, jy), sample(jx, jy), px - ix), py - iy)
      }
      const ring = lake.geometry.coordinates[0].map(([lng, lat]) => localPoint(lng, lat))
      // The lake datum comes from this DEM, avoiding mismatched vertical references.
      const waterLevel = elevationAt(0, 0)
      const geometry = new THREE.PlaneGeometry(width, width, 256, 256)
      geometry.rotateX(-Math.PI / 2)
      const positions = geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + x0 + width / 2, z = positions.getZ(i) + z0 + width / 2
        positions.setXYZ(i, x, insideRing(x, z, ring) ? waterLevel - .5 : elevationAt(x, z), z)
      }
      geometry.computeVertexNormals()
      const texture = new THREE.CanvasTexture(imagery)
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; textures.add(texture)
      scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })))
      scene.background = new THREE.Color('#aec5cd')
      scene.fog = new THREE.FogExp2('#aec5cd', .00023)
      scene.add(new THREE.HemisphereLight('#e5f6ff', '#414735', 2))
      const sun = new THREE.DirectionalLight('#ffe4b3', 2.1)
      sun.position.set(-900, 1300, 800); scene.add(sun)

      const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)))
      const normalA = rippleTexture(0), normalB = rippleTexture(1.9)
      textures.add(normalA); textures.add(normalB)
      const water = new Water(new THREE.ShapeGeometry(shape), {
        color: '#547675', scale: .12, flowDirection: new THREE.Vector2(.8, .3),
        flowSpeed: .012, reflectivity: .12, textureWidth: 512, textureHeight: 512,
        normalMap0: normalA, normalMap1: normalB,
      })
      // Water2 uses UVs for ripple scale. ShapeGeometry's local metre UVs are useful here.
      water.rotation.x = -Math.PI / 2; water.position.y = waterLevel + .15
      scene.add(water)
      const edge = localPoint(-6.3468, 53.00615)
      const camera = new THREE.PerspectiveCamera(62, container.clientWidth / container.clientHeight, .15, 14000)
      const trees: Tree[] = []
      // Small, explicitly reconstructed foreground group. Not surveyed tree locations.
      for (let i = 0; i < 8; i++) {
        const tree = new Tree()
        tree.loadPreset(i % 2 ? 'Ash Small' : 'Oak Small')
        tree.options.seed = 310 + i
        tree.options.branch.levels = 2
        tree.generate()
        const x = edge[0] + 5 + (i % 3) * 10, z = edge[1] + (i % 2 ? -1 : 1) * (13 + i * 5)
        tree.position.set(x, elevationAt(x, z), z)
        tree.scale.setScalar(.7 + (i % 3) * .12)
        scene.add(tree); trees.push(tree)
      }
      if (disposed) return
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1
      renderer.domElement.tabIndex = 0
      renderer.domElement.setAttribute('aria-label', 'Glendalough landscape. Drag to look around, or use the arrow keys.')
      container.appendChild(renderer.domElement)
      let yaw = -Math.PI / 2, pitch = 0, isPaused = matchMedia('(prefers-reduced-motion: reduce)').matches
      let time = 0, last = performance.now(), dirty = true
      const orient = () => { camera.rotation.order = 'YXZ'; camera.rotation.set(pitch, yaw, 0); dirty = true }
      const reset = (above: boolean) => {
        if (above) {
          camera.position.set(edge[0] + 430, waterLevel + 550, edge[1] + 440)
          camera.lookAt(-100, waterLevel, 0)
          const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
          yaw = euler.y; pitch = euler.x
        } else {
          camera.position.set(edge[0], Math.max(waterLevel + 2, elevationAt(...edge) + 1.7), edge[1])
          camera.lookAt(-250, waterLevel + 40, 0)
          const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
          yaw = euler.y; pitch = euler.x
        }
        orient()
      }
      reset(false)
      controls.current = { reset, pause(value) { isPaused = value; dirty = true } }
      const canvas = renderer.domElement
      const contextLost = (event: Event) => { event.preventDefault(); setReady(false); setError(true); setStatus('The 3D view was interrupted. Try again to reload the landscape.') }
      canvas.addEventListener('webglcontextlost', contextLost)
      cleanup.push(() => canvas.removeEventListener('webglcontextlost', contextLost))
      let pointer: { id: number; x: number; y: number } | null = null
      const down = (event: PointerEvent) => { if (!event.isPrimary) return; pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); canvas.focus() }
      const move = (event: PointerEvent) => {
        if (!pointer || event.pointerId !== pointer.id) return
        yaw -= (event.clientX - pointer.x) * .003; pitch = THREE.MathUtils.clamp(pitch - (event.clientY - pointer.y) * .003, -1.1, 1.1)
        pointer.x = event.clientX; pointer.y = event.clientY; orient()
      }
      const up = () => { pointer = null }
      const keydown = (event: KeyboardEvent) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.preventDefault()
        yaw += event.key === 'ArrowLeft' ? .07 : event.key === 'ArrowRight' ? -.07 : 0
        pitch = THREE.MathUtils.clamp(pitch + (event.key === 'ArrowUp' ? .05 : event.key === 'ArrowDown' ? -.05 : 0), -1.1, 1.1); orient()
      }
      canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move)
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('keydown', keydown)
      cleanup.push(() => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('keydown', keydown) })
      const resize = new ResizeObserver(() => {
        camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix()
        renderer?.setSize(container.clientWidth, container.clientHeight); dirty = true
      })
      resize.observe(container); cleanup.push(() => resize.disconnect())
      const waterRender = water.onBeforeRender
      // Keep reflections when paused while preventing Water2's internal clock from advancing flow.
      water.onBeforeRender = function (...args) {
        const config = water.material.uniforms.config.value as THREE.Vector4
        const saved = config.clone()
        waterRender.apply(this, args)
        if (isPaused) config.copy(saved)
      }
      const tick = (now: number) => {
        if (disposed) return
        const delta = Math.min((now - last) / 1000, .05); last = now
        if (!document.hidden && (!isPaused || dirty)) {
          if (!isPaused) time += delta
          trees.forEach((tree) => tree.update(time * .35))
          renderer!.render(scene, camera); dirty = false
        }
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
      setReady(true); setStatus(''); setAerial(false); setPaused(isPaused)
    }
    void build().catch(() => {
      if (!disposed) { setError(true); setStatus('This landscape could not load. Check your map connection and try again.') }
    })
    return () => {
      disposed = true; abort.abort(); clearTimeout(timeout); cancelAnimationFrame(frame)
      controls.current = null; cleanup.forEach((dispose) => dispose())
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      textures.forEach((texture) => texture.dispose())
      // This renderer owns its canvas. Releasing the context also frees Water2's
      // private reflection/refraction targets, which have no public dispose API.
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [attempt])

  return <div className="immersive-scene" role="dialog" aria-modal="true" aria-label="Glendalough immersive viewpoint" onKeyDown={(event) => {
    if (event.key === 'Escape') onClose()
    if (event.key === 'Tab') {
      const nodes = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],canvas[tabindex="0"]')
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }}>
    <div ref={host} className="immersive-scene__canvas" />
    <header className="immersive-scene__header"><button ref={closeButton} onClick={onClose}><ArrowLeft size={18}/>Back to Ireland</button><span>WANDER ÉIRE / FIELD NOTES 01</span></header>
    {!ready && <div className="immersive-scene__loading" role="status"><p>{status}</p>{error && <button onClick={() => setAttempt((value) => value + 1)}>Try again</button>}</div>}
    <section className="immersive-scene__story"><p className="eyebrow">Wicklow · The valley of two lakes</p><h1>A moment<br/>at Glendalough.</h1><p>Real terrain. A living interpretation.</p><small>Reconstructed trees and water · simulated calm weather<br/>Terrain-based preview, not a surveyed trail or live camera.</small></section>
    <div className="immersive-scene__controls">
      <button disabled={!ready} aria-pressed={!aerial} onClick={() => { controls.current?.reset(false); setAerial(false) }}><Eye size={17}/>Lake edge</button>
      <button disabled={!ready} aria-pressed={aerial} onClick={() => { controls.current?.reset(true); setAerial(true) }}><Mountain size={17}/>Above the valley</button>
      <button disabled={!ready} aria-pressed={paused} onClick={() => { controls.current?.pause(!paused); setPaused(!paused) }}>{paused ? <Play size={17}/> : <Pause size={17}/>} {paused ? 'Resume motion' : 'Pause motion'}</button>
      <button disabled={!ready} aria-label="Reset viewpoint" onClick={() => controls.current?.reset(aerial)}><RotateCcw size={17}/></button>
      <small>Drag to look around · Arrow keys to turn</small>
    </div>
    <footer className="immersive-scene__credits"><a href="https://www.maptiler.com/" target="_blank" rel="noreferrer"><img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler"/></a><span>{credits} · Lake outline <a href="https://www.openstreetmap.org/way/4892081" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">ODbL</a></span></footer>
  </div>
}
