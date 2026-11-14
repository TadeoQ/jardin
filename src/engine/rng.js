// Generador pseudoaleatorio con semilla (mulberry32) + normal (Box-Muller).
// Misma semilla => misma secuencia => misma pintura.

export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  constructor(seed = 0) {
    this._next = mulberry32(Math.floor(Number(seed) || 0))
    this._spare = null
  }

  /** Uniforme en [0, 1). */
  random() {
    return this._next()
  }

  /** Uniforme en [a, b). */
  uniform(a, b) {
    return a + (b - a) * this._next()
  }

  /** Entero uniforme en [lo, hi). */
  int(lo, hi) {
    return lo + Math.floor(this._next() * (hi - lo))
  }

  /** Normal(mean, std) por Box-Muller (aprovecha el segundo valor). */
  normal(mean = 0, std = 1) {
    if (this._spare !== null) {
      const v = this._spare
      this._spare = null
      return mean + std * v
    }
    let u = 0
    while (u === 0) u = this._next()
    const v = this._next()
    const r = Math.sqrt(-2 * Math.log(u))
    const th = 2 * Math.PI * v
    this._spare = r * Math.sin(th)
    return mean + std * r * Math.cos(th)
  }

  /** Permutación aleatoria de 0..n-1 (Fisher-Yates). */
  permutation(n) {
    const p = new Uint32Array(n)
    for (let i = 0; i < n; i++) p[i] = i
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(this._next() * (i + 1))
      const t = p[i]
      p[i] = p[j]
      p[j] = t
    }
    return p
  }
}
