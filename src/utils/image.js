// Lectura de la foto del usuario en el navegador (nada sale del dispositivo).

const MAX_FILE_BYTES = 40 * 1024 * 1024
const MAX_PIXELS = 120e6

export class UserError extends Error {}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const touch = (navigator.maxTouchPoints || 0) > 0
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (touch && Math.min(screen.width, screen.height) < 820)
}

/** Tope del lado mayor según el dispositivo. */
export function maxSizeForDevice() {
  return isMobileDevice() ? 700 : 1200
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file)
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close?.() }
    } catch {
      /* se intenta con <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} }
  } catch {
    throw new UserError('No se pudo leer la imagen. Prueba con un archivo JPG, PNG o WebP.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function validate(file) {
  if (file instanceof File && (!file.type || !file.type.startsWith("image/"))) {
    throw new UserError('El archivo no es una imagen. Elige una foto en JPG, PNG o WebP.')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UserError('La imagen es demasiado grande (máximo 40 MB). Prueba con una versión más pequeña.')
  }
}

function checkDims(width, height) {
  if (!width || !height) throw new UserError('La imagen parece estar vacía o dañada.')
  if (width * height > MAX_PIXELS) {
    throw new UserError('La imagen tiene demasiados píxeles para el navegador. Reduce su resolución e inténtalo de nuevo.')
  }
}

/** Valida el archivo y devuelve sus dimensiones originales. */
export async function probeImage(file) {
  validate(file)
  const d = await decode(file)
  try {
    checkDims(d.width, d.height)
    return { width: d.width, height: d.height }
  } finally {
    d.close()
  }
}

/**
 * Decodifica y reduce la foto para que su lado mayor sea <= size.
 * Reduce por mitades sucesivas (buena calidad) y devuelve RGBA.
 */
export async function loadImageData(file, size) {
  validate(file)
  const d = await decode(file)
  try {
    checkDims(d.width, d.height)
    const scale = Math.min(1, size / Math.max(d.width, d.height))
    const tw = Math.max(1, Math.round(d.width * scale))
    const th = Math.max(1, Math.round(d.height * scale))

    let src = d.source
    let sw = d.width
    let sh = d.height
    while (sw / 2 >= tw && sh / 2 >= th) {
      const nw = Math.max(tw, Math.floor(sw / 2))
      const nh = Math.max(th, Math.floor(sh / 2))
      const c = document.createElement('canvas')
      c.width = nw
      c.height = nh
      const x = c.getContext('2d')
      x.imageSmoothingEnabled = true
      x.imageSmoothingQuality = 'high'
      x.drawImage(src, 0, 0, nw, nh)
      src = c
      sw = nw
      sh = nh
    }
    const out = document.createElement('canvas')
    out.width = tw
    out.height = th
    const ctx = out.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // Fondo blanco por si la imagen tiene transparencia.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, tw, th)
    ctx.drawImage(src, 0, 0, tw, th)
    const img = ctx.getImageData(0, 0, tw, th)
    return { width: tw, height: th, buffer: img.data.buffer }
  } catch (e) {
    if (e instanceof UserError) throw e
    throw new UserError('No se pudo procesar la imagen (memoria insuficiente o formato no soportado). Prueba con un tamaño máximo menor.')
  } finally {
    d.close()
  }
}
