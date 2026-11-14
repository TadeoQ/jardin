// Worker: recibe el canvas visible (transferido como OffscreenCanvas) y
// ejecuta toda la pintura fuera del hilo de la interfaz.
import { PaintSession } from '../engine/session.js'

let session = null

self.onmessage = (e) => {
  const msg = e.data
  if (msg.type === 'init') {
    session = new PaintSession({
      canvas: msg.canvas,
      makeCanvas: (w, h) => new OffscreenCanvas(w, h),
      emit: (m) => self.postMessage(m),
    })
    self.postMessage({ type: 'ready' })
  } else if (session) {
    session.handle(msg)
  }
}
