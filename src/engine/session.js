// Una sesión de pintura: junta el motor (Oleo) con el ritmo (Runner) y el
// canvas visible. Habla mediante mensajes simples, de modo que el mismo
// código sirve dentro de un Worker o directamente en el hilo principal.
//
// Mensajes de entrada (handle):
//   { type:'start', image:{width,height,buffer}, options:{density,relief,duration,seed} }
//   { type:'pause' } { type:'resume' } { type:'skip' } { type:'reset' }
//   { type:'getBlob', id }
// Mensajes de salida (emit):
//   { type:'started', width, height, total } { type:'progress', done, total }
//   { type:'done' } { type:'blob', id, blob } { type:'error', message }

import { Oleo } from './oleo.js'
import { Runner } from './runner.js'

export class PaintSession {
  constructor({ canvas, makeCanvas, emit }) {
    this.canvas = canvas
    this.makeCanvas = makeCanvas
    this.emit = emit
    this.oleo = null
    this.runner = null
  }

  handle(msg) {
    try {
      switch (msg.type) {
        case 'start':
          return this._start(msg)
        case 'pause':
          return this.runner?.pause()
        case 'resume':
          return this.runner?.resume()
        case 'skip':
          return this.runner?.skip()
        case 'reset':
          return this._reset()
        case 'getBlob':
          return this._blob(msg.id)
      }
    } catch (e) {
      this.emit({ type: 'error', message: e?.message || String(e) })
    }
  }

  _start({ image, options }) {
    this._reset()
    const { width, height } = image
    const canvas = this.canvas
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    this.oleo = new Oleo({
      image: { width, height, data: new Uint8ClampedArray(image.buffer) },
      ctx,
      makeCanvas: this.makeCanvas,
      density: options.density,
      relief: options.relief,
      seed: options.seed,
      startFromPhoto: !!options.startFromPhoto,
    })
    const oleo = this.oleo
    this.runner = new Runner(oleo, {
      duration: options.duration,
      onProgress: (done, total) => this.emit({ type: 'progress', done, total }),
      onDone: () => {
        oleo.dispose() // libera los buffers grandes; el lienzo ya quedó terminado
        this.emit({ type: 'done' })
      },
      onError: (e) => this.emit({ type: 'error', message: e?.message || String(e) }),
    })
    this.emit({ type: 'started', width, height, total: oleo.total })
    this.runner.start()
  }

  _reset() {
    this.runner?.stop()
    this.runner = null
    this.oleo?.dispose()
    this.oleo = null
  }

  async _blob(id) {
    const c = this.canvas
    const blob = c.convertToBlob
      ? await c.convertToBlob({ type: 'image/png' })
      : await new Promise((res) => c.toBlob(res, 'image/png'))
    this.emit({ type: 'blob', id, blob })
  }
}
