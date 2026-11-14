// Prueba del motor en Node (sin dependencias): imagen sintética tipo ramo de
// flores -> pintura. Comprueba determinismo, cobertura de bordes y escribe PNGs.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Oleo } from '../src/engine/oleo.js'
import { MockCanvas, writePNG } from './mock-canvas.mjs'

const W = 600
const H = 450

function syntheticPhoto() {
  const d = new Uint8ClampedArray(W * H * 4)
  const flowers = [[200, 200, 90, [200, 40, 60]], [380, 170, 70, [240, 190, 40]], [310, 300, 80, [230, 120, 160]], [470, 310, 60, [250, 250, 245]]]
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4
      let r = 40 + 30 * (y / H), g = 90 + 60 * (1 - y / H), b = 50 + 20 * (x / W)
      for (const [fx, fy, fr, c] of flowers) {
        const dx = x - fx, dy = y - fy
        const dist = Math.hypot(dx, dy)
        const petals = fr * (0.75 + 0.25 * Math.cos(7 * Math.atan2(dy, dx)))
        if (dist < petals) { const sh = 0.7 + 0.3 * (1 - dist / petals); r = c[0] * sh; g = c[1] * sh; b = c[2] * sh }
        if (dist < fr * 0.2) { r = 90; g = 50; b = 20 }
      }
      d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255
    }
  return { width: W, height: H, data: d }
}

function run(seed, outPrefix) {
  const canvas = new MockCanvas(W, H)
  const oleo = new Oleo({ image: syntheticPhoto(), ctx: canvas.getContext('2d'), makeCanvas: (w, h) => new MockCanvas(w, h), density: 0.5, relief: 0.1, seed, startFromPhoto: true })
  const t0 = performance.now()
  let snap = null
  while (!oleo.isDone) {
    oleo.paintBatch(500)
    if (!snap && oleo.done / oleo.total > 0.3) snap = new Uint8ClampedArray(canvas.data)
  }
  const tPaint = performance.now() - t0
  const pre = new Uint8ClampedArray(canvas.data)
  const t1 = performance.now()
  oleo.finish()
  const tFinish = performance.now() - t1
  if (outPrefix) {
    mkdirSync('scripts/out', { recursive: true })
    writeFileSync(`scripts/out/${outPrefix}-30pct.png`, writePNG(snap, W, H))
    writeFileSync(`scripts/out/${outPrefix}-pre.png`, writePNG(pre, W, H))
    writeFileSync(`scripts/out/${outPrefix}-final.png`, writePNG(canvas, W, H))
    writeFileSync('scripts/out/original.png', writePNG(syntheticPhoto().data, W, H))
  }
  return { oleo, pre, final: canvas.data, tPaint, tFinish }
}

const a = run(7, 'seed7')
const b = run(7)
const c = run(8)
const hash = (u) => createHash('md5').update(u).digest('hex').slice(0, 8)
console.log(`pinceladas: ${a.oleo.total}  (por pasada: ${a.oleo.passes.map((p) => p.end - p.start).join(', ')})`)
console.log(`pintar: ${a.tPaint.toFixed(0)} ms · acabado: ${a.tFinish.toFixed(0)} ms`)
console.log('determinismo misma semilla:', hash(a.final) === hash(b.final) ? 'OK' : 'FALLA', hash(a.final), hash(b.final))
console.log('semilla distinta difiere:  ', hash(a.final) !== hash(c.final) ? 'OK' : 'FALLA')

// Cobertura: píxeles aún con el color exacto del lienzo inicial (antes del acabado).
const [r0, g0, b0] = a.oleo.bg
let bare = 0, bareEdge = 0, edge = 0
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4
    const isBare = a.pre[k] === r0 && a.pre[k + 1] === g0 && a.pre[k + 2] === b0
    const onEdge = x < 3 || y < 3 || x >= W - 3 || y >= H - 3
    if (onEdge) edge++
    if (isBare) { bare++; if (onEdge) bareEdge++ }
  }
console.log(`sin pintar: ${bare} px (${((100 * bare) / (W * H)).toFixed(3)} %) · en borde de 3 px: ${bareEdge}/${edge}`)
if (hash(a.final) !== hash(b.final) || bareEdge > edge * 0.01) process.exitCode = 1
