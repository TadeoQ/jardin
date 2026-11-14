import assert from 'node:assert/strict'
import { staggerFor, settleMs, isMounted } from '../src/utils/nav.js'

// Un paso: sin retraso, en ambos sentidos (animación idéntica a la normal)
assert.deepEqual(staggerFor(3, 4), { 3: 0 })
assert.deepEqual(staggerFor(4, 3), { 3: 0 })
// Salto hacia adelante: la hoja de arriba sale primero
assert.deepEqual(staggerFor(0, 3, 420, 70), { 0: 0, 1: 70, 2: 140 })
// Salto hacia atrás: la última hoja pasada vuelve primero
assert.deepEqual(staggerFor(3, 0, 420, 70), { 2: 0, 1: 70, 0: 140 })
// Saltos largos: el total se acota
const big = staggerFor(0, 20)
assert.equal(Math.max(...Object.values(big)) <= 420, true)
assert.equal(Object.keys(big).length, 20)
assert.deepEqual(staggerFor(5, 5), {})
assert.equal(settleMs(2, 3, 950), 950 + 0 + 150)
assert.equal(isMounted(5, [5]), true)
assert.equal(isMounted(7, [5]), false)
assert.equal(isMounted(7, [5, 8]), true)
console.log('navegación (escalonado y montaje): OK')
