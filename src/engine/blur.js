// Desenfoque gaussiano separable y gradiente sobre Float32Array (un canal).
// Bordes: se repite el píxel del extremo (clamp). No depende de ctx.filter.

const kernelCache = new Map()

export function gaussianKernel(sigma) {
  const key = sigma.toFixed(4)
  let k = kernelCache.get(key)
  if (k) return k
  const r = Math.max(1, Math.ceil(sigma * 3))
  const arr = new Float32Array(2 * r + 1)
  let sum = 0
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma))
    arr[i + r] = v
    sum += v
  }
  for (let i = 0; i < arr.length; i++) arr[i] /= sum
  k = { data: arr, r }
  kernelCache.set(key, k)
  return k
}

/**
 * Gaussiana separable. Devuelve un Float32Array nuevo (o `out` si se pasa).
 * @param {Float32Array} src  w*h
 */
export function gaussianBlur(src, w, h, sigma, out = new Float32Array(w * h)) {
  if (!(sigma > 0)) {
    out.set(src)
    return out
  }
  const { data: k, r } = gaussianKernel(sigma)
  const tmp = new Float32Array(w * h)

  // Horizontal: src -> tmp
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      let acc = 0
      if (x >= r && x < w - r) {
        const base = row + x - r
        for (let i = 0; i <= 2 * r; i++) acc += src[base + i] * k[i]
      } else {
        for (let i = -r; i <= r; i++) {
          let xx = x + i
          xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx
          acc += src[row + xx] * k[i + r]
        }
      }
      tmp[row + x] = acc
    }
  }

  // Vertical: tmp -> out (filas completas, amigable con la caché)
  out.fill(0)
  for (let y = 0; y < h; y++) {
    const o = y * w
    for (let i = -r; i <= r; i++) {
      let yy = y + i
      yy = yy < 0 ? 0 : yy >= h ? h - 1 : yy
      const kv = k[i + r]
      const b = yy * w
      for (let x = 0; x < w; x++) out[o + x] += tmp[b + x] * kv
    }
  }
  return out
}

/**
 * Gradiente como np.gradient: diferencias centradas dentro,
 * diferencias de un lado en los bordes.
 * @returns {{gx: Float32Array, gy: Float32Array}}
 */
export function gradient(src, w, h) {
  const gx = new Float32Array(w * h)
  const gy = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      const i = row + x
      if (w === 1) gx[i] = 0
      else if (x === 0) gx[i] = src[i + 1] - src[i]
      else if (x === w - 1) gx[i] = src[i] - src[i - 1]
      else gx[i] = (src[i + 1] - src[i - 1]) * 0.5

      if (h === 1) gy[i] = 0
      else if (y === 0) gy[i] = src[i + w] - src[i]
      else if (y === h - 1) gy[i] = src[i] - src[i - w]
      else gy[i] = (src[i + w] - src[i - w]) * 0.5
    }
  }
  return { gx, gy }
}

/** Desviación estándar (poblacional) de un arreglo. */
export function stdDev(a) {
  const n = a.length
  let mean = 0
  for (let i = 0; i < n; i++) mean += a[i]
  mean /= n
  let v = 0
  for (let i = 0; i < n; i++) {
    const d = a[i] - mean
    v += d * d
  }
  return Math.sqrt(v / n)
}
