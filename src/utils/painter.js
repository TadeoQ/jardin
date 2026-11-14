// Fachada única para pintar: Web Worker + OffscreenCanvas cuando se puede,
// o la misma sesión en el hilo principal (por lotes con setTimeout) si no.
import { PaintSession } from '../engine/session.js'

export function supportsWorkerPainting(canvas) {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof canvas.transferControlToOffscreen === 'function'
  )
}

/**
 * @param {HTMLCanvasElement} canvas  Nota: tras transferirlo a un Worker no se puede reutilizar en el hilo principal.
 * @param {{onMessage:(m:any)=>void, forceMain?:boolean}} opts
 */
export function createPainter(canvas, { onMessage, forceMain = false }) {
  const pending = new Map()
  let nextId = 1

  const route = (m) => {
    if (m.type === 'blob') {
      const p = pending.get(m.id)
      if (p) {
        pending.delete(m.id)
        p.resolve(m.blob)
      }
      return
    }
    onMessage(m)
  }

  let send
  let destroy
  let mode
  let ready

  if (!forceMain && supportsWorkerPainting(canvas)) {
    mode = 'worker'
    const worker = new Worker(new URL('../workers/paint.worker.js', import.meta.url), { type: 'module' })
    let isReady = false
    ready = new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
          isReady = true
          resolve()
        } else route(e.data)
      }
      worker.onerror = (e) => {
        e.preventDefault?.()
        if (!isReady) reject(new Error('worker-failed'))
        else onMessage({ type: 'error', message: e.message || 'Error en el motor de pintura.' })
      }
      worker.onmessageerror = () => reject(new Error('worker-failed'))
    })
    const offscreen = canvas.transferControlToOffscreen()
    worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen])
    send = (msg, transfer) => worker.postMessage(msg, transfer || [])
    destroy = () => worker.terminate()
  } else {
    mode = 'main'
    const session = new PaintSession({
      canvas,
      makeCanvas: (w, h) => {
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        return c
      },
      emit: route,
    })
    ready = Promise.resolve()
    send = (msg) => session.handle(msg)
    destroy = () => session.handle({ type: 'reset' })
  }

  return {
    mode,
    ready,
    start(image, options) {
      send({ type: 'start', image, options }, [image.buffer])
    },
    pause: () => send({ type: 'pause' }),
    resume: () => send({ type: 'resume' }),
    skip: () => send({ type: 'skip' }),
    reset: () => send({ type: 'reset' }),
    getBlob() {
      return new Promise((resolve) => {
        const id = nextId++
        pending.set(id, { resolve })
        send({ type: 'getBlob', id })
      })
    },
    destroy,
  }
}
