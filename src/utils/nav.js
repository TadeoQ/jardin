// Lógica pura de navegación (sin Vue): fácil de probar en Node (npm test).

/**
 * Escalonado del paso de hojas cuando se saltan varias a la vez (índice).
 * Devuelve { [indiceHoja]: retrasoMs } para las hojas que cambian de lado.
 *  - Hacia adelante: la hoja de arriba sale primero.
 *  - Hacia atrás: la última hoja pasada vuelve primero.
 * Con un salto de una sola hoja no hay retraso (animación idéntica a la normal).
 */
export function staggerFor(from, to, maxTotalMs = 420, maxStepMs = 70) {
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  const n = hi - lo
  const step = n > 1 ? Math.min(maxStepMs, maxTotalMs / n) : 0
  const out = {}
  for (let i = lo; i < hi; i++) out[i] = Math.round(to > from ? (i - lo) * step : (hi - 1 - i) * step)
  return out
}

/** Duración total que debe esperarse hasta que terminen las hojas en movimiento. */
export function settleMs(from, to, flipMs) {
  const s = staggerFor(from, to)
  const max = Math.max(0, ...Object.values(s))
  return flipMs + max + 150
}

/** Hojas con contenido montado: la actual y sus vecinas (más las de origen mientras se anima). */
export function isMounted(i, centers) {
  return centers.some((c) => Math.abs(i - c) <= 1)
}
