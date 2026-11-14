// Canvas 2D mínimo en software (solo lo que usa el motor) para probar en Node
// sin dependencias. Rasteriza polilíneas con puntas redondas y antialiasing simple.
import { deflateSync } from 'node:zlib'

function parseColor(s) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s)
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]
}

class Ctx {
  constructor(canvas) {
    this.canvas = canvas
    this.fillStyle = 'rgb(0,0,0)'
    this.strokeStyle = 'rgb(0,0,0)'
    this.lineWidth = 1
    this.lineCap = 'butt'
    this.lineJoin = 'miter'
    this.globalAlpha = 1
    this.path = []
  }
  fillRect(x, y, w, h) {
    const c = this.canvas
    const col = parseColor(this.fillStyle)
    for (let j = Math.max(0, y); j < Math.min(c.height, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(c.width, x + w); i++) {
        const k = (j * c.width + i) * 4
        c.data[k] = col[0]; c.data[k + 1] = col[1]; c.data[k + 2] = col[2]; c.data[k + 3] = 255
      }
  }
  beginPath() { this.path = [] }
  moveTo(x, y) { this.path.push([x, y]) }
  lineTo(x, y) { this.path.push([x, y]) }
  stroke() {
    const c = this.canvas
    const col = parseColor(this.strokeStyle)
    const r = this.lineWidth / 2
    const P = this.path
    for (let s = 0; s < P.length - 1; s++) {
      const [x0, y0] = P[s]
      const [x1, y1] = P[s + 1]
      const minX = Math.max(0, Math.floor(Math.min(x0, x1) - r - 1))
      const maxX = Math.min(c.width - 1, Math.ceil(Math.max(x0, x1) + r + 1))
      const minY = Math.max(0, Math.floor(Math.min(y0, y1) - r - 1))
      const maxY = Math.min(c.height - 1, Math.ceil(Math.max(y0, y1) + r + 1))
      const dx = x1 - x0, dy = y1 - y0
      const l2 = dx * dx + dy * dy || 1
      for (let j = minY; j <= maxY; j++)
        for (let i = minX; i <= maxX; i++) {
          const px = i + 0.5, py = j + 0.5
          let t = ((px - x0) * dx + (py - y0) * dy) / l2
          t = t < 0 ? 0 : t > 1 ? 1 : t
          const d = Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))
          const cov = Math.min(1, Math.max(0, r - d + 0.5))
          if (cov <= 0) continue
          const k = (j * c.width + i) * 4
          for (let q = 0; q < 3; q++) c.data[k + q] = c.data[k + q] * (1 - cov) + col[q] * cov
        }
    }
  }
  getImageData(x, y, w, h) {
    return { width: w, height: h, data: new Uint8ClampedArray(this.canvas.data) }
  }
  putImageData(img) { this.canvas.data.set(img.data) }
}

export class MockCanvas {
  constructor(w = 300, h = 150) { this._w = w; this._h = h; this._alloc(); this._ctx = null }
  _alloc() { this.data = new Uint8ClampedArray(this._w * this._h * 4) }
  get width() { return this._w }
  set width(v) { this._w = v; this._alloc() }
  get height() { return this._h }
  set height(v) { this._h = v; this._alloc() }
  getContext() { return (this._ctx ||= new Ctx(this)) }
}

export function writePNG(canvasOrData, w, h) {
  const data = canvasOrData.data || canvasOrData
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4, o = y * (w * 3 + 1) + 1 + x * 3
      raw[o] = data[k]; raw[o + 1] = data[k + 1]; raw[o + 2] = data[k + 2]
    }
  }
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
  const crc = (b) => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length)
    const td = Buffer.concat([Buffer.from(type), body])
    const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, cr])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
