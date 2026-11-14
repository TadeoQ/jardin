// Controla el ritmo de la animación (pausa, reanudar, saltar al final).
// Cada ~30 ms pinta `ceil(total / ticks)` pinceladas, con
// ticks = duración * 1000 / 30. Usa solo setTimeout, así funciona igual
// en un Worker (donde requestAnimationFrame no es fiable) y en el hilo principal.

const FRAME_MS = 30

export class Runner {
  /**
   * @param {import('./oleo.js').Oleo} oleo
   * @param {{duration:number,onProgress:(done:number,total:number)=>void,onDone:()=>void,onError:(e:Error)=>void}} o
   */
  constructor(oleo, { duration, onProgress, onDone, onError }) {
    this.oleo = oleo
    this.onProgress = onProgress
    this.onDone = onDone
    this.onError = onError
    const ticks = Math.max(1, (duration * 1000) / FRAME_MS)
    this.perFrame = Math.max(1, Math.ceil(oleo.total / ticks))
    this.timer = null
    this.state = 'idle' // idle | running | paused | skipping | finished | stopped
  }

  start() {
    if (this.state !== 'idle') return
    this.state = 'running'
    this.onProgress(0, this.oleo.total)
    this._schedule(0)
  }

  pause() {
    if (this.state !== 'running') return
    this.state = 'paused'
    this._clear()
  }

  resume() {
    if (this.state !== 'paused') return
    this.state = 'running'
    this._schedule(0)
  }

  skip() {
    if (this.state !== 'running' && this.state !== 'paused') return
    this._clear()
    this.state = 'skipping'
    this._schedule(0)
  }

  stop() {
    this._clear()
    this.state = 'stopped'
  }

  _clear() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  _schedule(ms) {
    this.timer = setTimeout(() => this._tick(), ms)
  }

  _tick() {
    this.timer = null
    try {
      const o = this.oleo
      if (this.state === 'running') {
        o.paintBatch(this.perFrame)
      } else if (this.state === 'skipping') {
        // Por lotes con presupuesto de tiempo para no congelar el hilo principal.
        const t0 = performance.now()
        do {
          o.paintBatch(150)
        } while (!o.isDone && performance.now() - t0 < 14)
      } else {
        return
      }

      this.onProgress(o.done, o.total)
      if (o.isDone) {
        // Dejar que el 100 % se muestre antes del acabado (que es pesado).
        this.timer = setTimeout(() => {
          this.timer = null
          if (this.state === 'stopped') return
          try {
            o.finish()
            this.state = 'finished'
            this.onDone()
          } catch (e) {
            this.onError(e)
          }
        }, 20)
      } else {
        this._schedule(this.state === 'skipping' ? 0 : FRAME_MS)
      }
    } catch (e) {
      this.state = 'stopped'
      this.onError(e)
    }
  }
}
