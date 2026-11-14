// Motor de pintura al óleo. JavaScript puro, sin Vue ni acceso al DOM:
// recibe un contexto 2D (el lienzo visible) y una fábrica de canvas para
// el mapa de relieve. Funciona igual en Worker (OffscreenCanvas), hilo
// principal (HTMLCanvasElement) o Node (@napi-rs/canvas) para pruebas.

import { gaussianBlur, gradient, stdDev } from './blur.js'
import { Rng } from './rng.js'

export const DEFAULTS = { size: 900, density: 1.0, relief: 0.1, duration: 25, seed: 0 }

// [ancho del pincel, pasos por pincelada, cobertura] — de grueso a fino.
export const PASSES = [
  [24, 6, 1.7],
  [14, 7, 1.9],
  [8, 8, 2.1],
  [4.5, 8, 1.6],
  [2.6, 7, 0.9],
]

const PAPER = [236, 230, 214]
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const GRAY_STYLE = Array.from({ length: 256 }, (_, i) => `rgb(${i},${i},${i})`)

export class Oleo {
  /**
   * @param {object} p
   * @param {{width:number,height:number,data:Uint8ClampedArray}} p.image  RGBA
   * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} p.ctx  lienzo de color (ya dimensionado w×h)
   * @param {(w:number,h:number)=>any} p.makeCanvas  crea un canvas para el relieve
   */
  constructor({ image, ctx, makeCanvas, density = 1, relief = 0.1, seed = 0, startFromPhoto = false }) {
    const { width: w, height: h, data } = image
    this.w = w
    this.h = h
    this.relief = relief
    this.s = Math.max(w, h) / 900
    this.rng = new Rng(seed)
    this.ctx = ctx
    this.relCtx = makeCanvas(w, h).getContext('2d')

    // Planos de color y gris (Float32Array).
    const n = w * h
    this.R = new Float32Array(n)
    this.G = new Float32Array(n)
    this.B = new Float32Array(n)
    this.gray = new Float32Array(n)
    let mr = 0
    let mg = 0
    let mb = 0
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const r = data[j]
      const g = data[j + 1]
      const b = data[j + 2]
      this.R[i] = r
      this.G[i] = g
      this.B[i] = b
      this.gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
      mr += r
      mg += g
      mb += b
    }
    this.bg = [
      Math.round(0.3 * (mr / n) + 0.7 * PAPER[0]),
      Math.round(0.3 * (mg / n) + 0.7 * PAPER[1]),
      Math.round(0.3 * (mb / n) + 0.7 * PAPER[2]),
    ]

    // Escratch de una pincelada (máx. 8 pasos => 9 puntos; margen de sobra).
    this._px = new Float64Array(32)
    this._py = new Float64Array(32)
    this._nx = new Float64Array(32)
    this._ny = new Float64Array(32)

    this._buildPlan(density)
    this._pass = -1
    this._angle = null
    this._cr = this._cg = this._cb = null
    this._angleCache = new Map()
    this._gradGray = null
    this.done = 0
    this.finished = false
    
    // Si pasamos false aquí, evitamos que pinte la foto entera de golpe al inicio
    this._photo = startFromPhoto ? null : image 
    this._initCanvases()
  }

  get total() {
    return this.X.length
  }

  get isDone() {
    return this.done >= this.total
  }

  _initCanvases() {
    const { w, h, ctx, relCtx } = this
    ctx.globalAlpha = 1
    // El lienzo inicia completamente con el color base del papel/fondo
    ctx.fillStyle = `rgb(${this.bg[0]},${this.bg[1]},${this.bg[2]})`
    ctx.fillRect(0, 0, w, h)
    
    if (this._photo) {
      const { data } = this._photo
      ctx.putImageData(typeof ImageData !== 'undefined' ? new ImageData(data, w, h) : { width: w, height: h, data }, 0, 0)
      this._photo = null
    }

    relCtx.globalAlpha = 1
    relCtx.fillStyle = GRAY_STYLE[90]
    relCtx.fillRect(0, 0, w, h)
    for (const c of [ctx, relCtx]) {
      c.lineJoin = 'round'
      c.lineCap = 'round'
    }
  }

  // ---- 4.2 Plan de pinceladas ----------------------------------------
  _buildPlan(density) {
    const { w, h, s, rng } = this
    const xs = []
    const ys = []
    this.passes = []
    for (const [bw, steps, cover] of PASSES) {
      const width = Math.max(2, bw * s)
      const n = Math.max(20, Math.floor((w * h * cover * density) / (4.2 * width * width)))
      const cell = Math.sqrt((w * h) / n)
      const nxCells = Math.ceil((w + cell) / cell)
      const nyCells = Math.ceil((h + cell) / cell)
      const start = xs.length
      for (let j = 0; j < nyCells; j++) {
        for (let i = 0; i < nxCells; i++) {
          const gx = -cell / 2 + i * cell + rng.uniform(-cell / 2, cell / 2)
          const gy = -cell / 2 + j * cell + rng.uniform(-cell / 2, cell / 2)
          xs.push(clamp(gx, 0, w - 1))
          ys.push(clamp(gy, 0, h - 1))
        }
      }
      const count = xs.length - start
      // Barajar el orden dentro de la pasada.
      const perm = rng.permutation(count)
      const px = new Array(count)
      const py = new Array(count)
      for (let k = 0; k < count; k++) {
        px[k] = xs[start + perm[k]]
        py[k] = ys[start + perm[k]]
      }
      for (let k = 0; k < count; k++) {
        xs[start + k] = px[k]
        ys[start + k] = py[k]
      }
      this.passes.push({ width, steps, start, end: xs.length })
    }
    this.X = Float32Array.from(xs)
    this.Y = Float32Array.from(ys)
  }

  // ---- 4.3 / 4.4 Campo de orientación y color suavizado por pasada ----
  _enterPass(pi) {
    const { w, h } = this
    const { width } = this.passes[pi]
    this._pass = pi

    const sigma = Math.max(1.5, width * 0.5)
    const key = sigma.toFixed(4)
    let angle = this._angleCache.get(key)
    if (!angle) {
      if (!this._gradGray) {
        const g = gaussianBlur(this.gray, w, h, 1.0)
        this._gradGray = gradient(g, w, h)
      }
      const { gx, gy } = this._gradGray
      const n = w * h
      const xx = new Float32Array(n)
      const yy = new Float32Array(n)
      const xy = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        xx[i] = gx[i] * gx[i]
        yy[i] = gy[i] * gy[i]
        xy[i] = gx[i] * gy[i]
      }
      const jxx = gaussianBlur(xx, w, h, sigma)
      const jyy = gaussianBlur(yy, w, h, sigma)
      const jxy = gaussianBlur(xy, w, h, sigma)
      angle = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        angle[i] = 0.5 * Math.atan2(2 * jxy[i], jxx[i] - jyy[i]) + Math.PI / 2
      }
      this._angleCache.clear() // solo hace falta la pasada actual
      this._angleCache.set(key, angle)
    }
    this._angle = angle

    const cs = Math.max(0.8, width * 0.3)
    this._cr = gaussianBlur(this.R, w, h, cs)
    this._cg = gaussianBlur(this.G, w, h, cs)
    this._cb = gaussianBlur(this.B, w, h, cs)
  }

  /**
   * Pinta hasta `count` pinceladas. Devuelve cuántas pintó.
   */
  paintBatch(count) {
    let painted = 0
    while (painted < count && this.done < this.total) {
      const idx = this.done
      let pi = this._pass
      if (pi < 0 || idx >= this.passes[pi].end) {
        pi = pi < 0 ? 0 : pi + 1
        while (idx >= this.passes[pi].end) pi++
        this._enterPass(pi)
      }
      const p = this.passes[pi]
      this._paintStroke(this.X[idx], this.Y[idx], p.width, p.steps)
      this.done++
      painted++
    }
    return painted
  }

  // ---- 4.5 Una pincelada ---------------------------------------------
  _paintStroke(x, y, width, steps) {
    const { w, h, rng, ctx, relCtx } = this
    const px = this._px
    const py = this._py
    const angle = this._angle
    const step = width * 0.6

    let m = 1
    px[0] = x
    py[0] = y
    let cx = x
    let cy = y
    let pdx = 0
    let pdy = 0

    for (let k = 0; k < steps; k++) {
      const ix = clamp(Math.floor(cx), 0, w - 1)
      const iy = clamp(Math.floor(cy), 0, h - 1)
      const a = angle[iy * w + ix] + rng.normal(0, 0.08)
      let dx = Math.cos(a)
      let dy = Math.sin(a)
      if (k === 0) {
        if (rng.random() < 0.5) {
          dx = -dx
          dy = -dy
        }
      } else {
        if (dx * pdx + dy * pdy < 0) {
          dx = -dx
          dy = -dy
        }
        dx = 0.55 * pdx + 0.45 * dx
        dy = 0.55 * pdy + 0.45 * dy
        const l = Math.hypot(dx, dy) || 1
        dx /= l
        dy /= l
      }
      cx += dx * step
      cy += dy * step
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) break
      px[m] = cx
      py[m] = cy
      m++
      pdx = dx
      pdy = dy
    }
    if (m < 2) return

    // Color base: pixel suavizado en el punto central, con variación.
    const mid = Math.floor(m / 2)
    const bi = clamp(Math.floor(py[mid]), 0, h - 1) * w + clamp(Math.floor(px[mid]), 0, w - 1)
    const br = this._cr[bi] * (1 + rng.normal(0, 0.035)) + rng.normal(0, 3)
    const bg = this._cg[bi] * (1 + rng.normal(0, 0.035)) + rng.normal(0, 3)
    const bb = this._cb[bi] * (1 + rng.normal(0, 0.035)) + rng.normal(0, 3)

    // Normales a lo largo del trazo.
    const nx = this._nx
    const ny = this._ny
    for (let i = 0; i < m; i++) {
      const a = Math.min(i + 1, m - 1)
      const b = Math.max(i - 1, 0)
      const tx = px[a] - px[b]
      const ty = py[a] - py[b]
      const l = Math.hypot(tx, ty) || 1
      nx[i] = -ty / l
      ny[i] = tx / l
    }

    // Cerdas.
    const nb = Math.floor(Math.min(10, Math.max(1, width / 2.2)))
    const lw = Math.max(1, Math.round((width / nb) * 1.5))
    ctx.lineWidth = lw
    relCtx.lineWidth = lw

    for (let j = 0; j < nb; j++) {
      const off = nb === 1 ? 0 : (j / (nb - 1) - 0.5) * width
      let k0 = 0
      let k1 = m - 1
      if (k1 - k0 + 1 > 2 && rng.random() < 0.35) k0++
      if (k1 - k0 + 1 > 2 && rng.random() < 0.35) k1--

      const f = 1 + rng.normal(0, 0.05)
      const r = clamp(Math.round(br * f), 0, 255)
      const g = clamp(Math.round(bg * f), 0, 255)
      const b = clamp(Math.round(bb * f), 0, 255)
      let hv = 130 + rng.int(-25, 25)
      if (nb > 2 && (j === 0 || j === nb - 1)) hv += 30
      hv = clamp(hv, 0, 255)

      ctx.strokeStyle = `rgb(${r},${g},${b})`
      relCtx.strokeStyle = GRAY_STYLE[hv]
      ctx.beginPath()
      relCtx.beginPath()
      for (let i = k0; i <= k1; i++) {
        const X = px[i] + nx[i] * off
        const Y = py[i] + ny[i] * off
        if (i === k0) {
          ctx.moveTo(X, Y)
          relCtx.moveTo(X, Y)
        } else {
          ctx.lineTo(X, Y)
          relCtx.lineTo(X, Y)
        }
      }
      ctx.stroke()
      relCtx.stroke()
    }
  }

  // ---- 4.6 Acabado ----------------------------------------------------
  finish() {
    if (this.finished) return
    const { w, h, ctx, relCtx, s, rng } = this
    const n = w * h

    // Relieve: luz desde arriba a la izquierda.
    const rel = relCtx.getImageData(0, 0, w, h).data
    const hmap = new Float32Array(n)
    for (let i = 0, j = 0; i < n; i++, j += 4) hmap[i] = rel[j]
    const hgt = gaussianBlur(hmap, w, h, 0.8 * Math.max(1, s))
    const { gx, gy } = gradient(hgt, w, h)
    const t = new Float32Array(n)
    for (let i = 0; i < n; i++) t[i] = gx[i] + gy[i]
    const tsd = stdDev(t) || 1

    // Textura de lienzo.
    const raw = new Float32Array(n)
    for (let i = 0; i < n; i++) raw[i] = rng.normal(0, 1)
    const noise = gaussianBlur(raw, w, h, 0.7)
    const nsd = stdDev(noise) || 1

    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const shade = clamp(1 + this.relief * (t[i] / tsd), 0.7, 1.3)
      const k = shade * (1 + 0.025 * (noise[i] / nsd))
      d[j] = clamp(d[j] * k, 0, 255)
      d[j + 1] = clamp(d[j + 1] * k, 0, 255)
      d[j + 2] = clamp(d[j + 2] * k, 0, 255)
    }

    // Saturación ×1.12
    let lum = 0
    for (let j = 0; j < n * 4; j += 4) {
      const gr = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
      d[j] = clamp(gr + (d[j] - gr) * 1.12, 0, 255)
      d[j + 1] = clamp(gr + (d[j + 1] - gr) * 1.12, 0, 255)
      d[j + 2] = clamp(gr + (d[j + 2] - gr) * 1.12, 0, 255)
      lum += 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
    }
    // Contraste ×1.05 alrededor de la luminancia media.
    const mean = lum / n
    for (let j = 0; j < n * 4; j += 4) {
      d[j] = clamp(mean + (d[j] - mean) * 1.05, 0, 255)
      d[j + 1] = clamp(mean + (d[j + 1] - mean) * 1.05, 0, 255)
      d[j + 2] = clamp(mean + (d[j + 2] - mean) * 1.05, 0, 255)
    }
    ctx.putImageData(img, 0, 0)
    this.finished = true
  }

  /** Libera buffers grandes. */
  dispose() {
    this.R = this.G = this.B = this.gray = null
    this._angle = this._cr = this._cg = this._cb = null
    this._angleCache.clear()
    this._gradGray = null
  }
}