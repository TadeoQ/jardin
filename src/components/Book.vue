<script setup>
// =====================================================================
//  EL LIBRO — portada, hojas y TODA la navegación.
//  Los textos NO están aquí: están en src/content.js
//
//  NAVEGACIÓN (nada bloquea al usuario: ninguna animación ni nota):
//    next() / prev()  -> hoja siguiente / anterior
//    go(n)            -> salta a la hoja n (índice del marcapáginas)
//  Formas de navegar (todas llaman a las funciones de arriba):
//    1. Esquinas dobladas de la hoja   (ver "ZONAS DE INTERACCIÓN" abajo)
//    2. Marcapáginas -> índice
//    3. Flechas del teclado ← →
//    4. Swipe horizontal en móvil
//    5. Clic en la dedicatoria / página final
//
//  ANIMACIÓN: la define book.css (.bk-leaf). Avanzar y retroceder usan
//  EXACTAMENTE la misma transición; solo cambia la clase .bk-flipped.
// =====================================================================
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { libro, fotos } from '../content.js'
import { isMounted, settleMs, staggerFor } from '../utils/nav.js'
import PageDedication from './PageDedication.vue'
import PagePhoto from './PagePhoto.vue'
import PageEnd from './PageEnd.vue'

const COVER_MS = 1150 // debe coincidir con --cover-ms en book.css
const FLIP_MS = 950 // debe coincidir con --flip-ms en book.css
const NOTE_CLOSE_MS = 230 // la nota se cierra primero y luego cambia la hoja

// Hojas: 0 = dedicatoria, 1..N = una foto por hoja, última = final.
const pages = computed(() => [
  { type: 'dedication' },
  ...fotos.map((foto) => ({ type: 'photo', foto })),
  { type: 'end' },
])
const last = computed(() => pages.value.length - 1)

const opened = ref(false)
const current = ref(0) // hoja visible; las anteriores ya están pasadas
const resetting = ref(false) // reinicio instantáneo al volver a la portada
const noteOpen = ref(false) // nota de la foto actual abierta
const indexOpen = ref(false) // índice abierto
const centers = ref([0]) // hojas "centro" cuyo contenido está montado
const stagger = ref({}) // retrasos al saltar varias hojas
let settleTimer = null
let navTimer = null

// ---------------------------------------------------------------------
//  Cambio de hoja
// ---------------------------------------------------------------------
function go(target) {
  const t = Math.max(0, Math.min(last.value, target))
  const from = current.value
  if (t === from) return
  stagger.value = staggerFor(from, t)
  centers.value = [from, t] // mientras animan, se conservan ambos contenidos
  current.value = t
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    centers.value = [current.value]
    stagger.value = {}
  }, settleMs(from, t, FLIP_MS))
}

// Antes de cambiar de hoja: se cierran índice y nota. Si había una nota
// abierta se espera un instante a que se cierre y luego se pasa la hoja.
function navigate(action) {
  indexOpen.value = false
  if (noteOpen.value) {
    noteOpen.value = false
    clearTimeout(navTimer)
    navTimer = setTimeout(action, NOTE_CLOSE_MS)
  } else {
    action()
  }
}

function openBook() {
  if (!opened.value) opened.value = true
}

function closeBook() {
  opened.value = false
  indexOpen.value = false
  noteOpen.value = false
  // Cuando la portada ya cubrió todo, las hojas se reinician sin animación.
  if (current.value !== 0) {
    setTimeout(() => {
      resetting.value = true
      current.value = 0
      centers.value = [0]
      stagger.value = {}
      requestAnimationFrame(() => requestAnimationFrame(() => (resetting.value = false)))
    }, COVER_MS)
  }
}

function next() {
  if (!opened.value) return openBook()
  if (current.value >= last.value) return // última hoja: no hace nada
  navigate(() => go(current.value + 1))
}

function prev() {
  if (!opened.value) return // en la portada: no hace nada
  if (current.value === 0) return navigate(closeBook) // primera hoja: se cierra el libro
  navigate(() => go(current.value - 1))
}

function jump(i) {
  navigate(() => go(i))
}

function toggleIndex() {
  noteOpen.value = false
  indexOpen.value = !indexOpen.value
}

const mounted = (i) => isMounted(i, centers.value)
const isActive = (i) => opened.value && i === current.value

// Etiquetas del índice
const photoItems = computed(() => pages.value.map((p, i) => ({ p, i })).filter((x) => x.p.type === 'photo'))

// ---------------------------------------------------------------------
//  Teclado: ← retrocede, → avanza, Esc cierra índice / nota
// ---------------------------------------------------------------------
function onKey(e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'Escape') {
    if (indexOpen.value) indexOpen.value = false
    else if (noteOpen.value) noteOpen.value = false
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(settleTimer)
  clearTimeout(navTimer)
})

// ---------------------------------------------------------------------
//  Swipe en móvil (táctil/lápiz): izquierda = avanzar, derecha = retroceder
// ---------------------------------------------------------------------
let sx = 0
let sy = 0
let st = 0
let tracking = false
let swipedAt = -1e9

function onPointerDown(e) {
  if (e.pointerType === 'mouse') return
  tracking = true
  sx = e.clientX
  sy = e.clientY
  st = performance.now()
}
function onPointerCancel() {
  tracking = false
}
function onPointerUp(e) {
  if (!tracking) return
  tracking = false
  const dx = e.clientX - sx
  const dy = e.clientY - sy
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && performance.now() - st < 800) {
    swipedAt = performance.now()
    if (dx < 0) next()
    else prev()
  }
}
// Un swipe no debe contar además como clic (p. ej. iniciar el óleo sin querer).
function onClickCapture(e) {
  if (performance.now() - swipedAt < 120) {
    e.stopPropagation()
    e.preventDefault()
  }
}
</script>

<template>
  <main
    class="bk-stage"
    :class="{ 'bk-noanim': resetting }"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @click.capture="onClickCapture"
  >
    <div class="bk-book" :class="{ 'bk-open': opened }">
      <!-- PORTADA -->
      <div
        class="bk-leaf bk-cover"
        :class="{ 'bk-flipped': opened }"
        :style="{ zIndex: 1000 }"
        role="button"
        :tabindex="opened ? -1 : 0"
        :aria-label="`Abrir el libro: ${libro.titulo}`"
        @click="openBook"
        @keydown.enter.prevent="openBook"
        @keydown.space.prevent="openBook"
      >
        <div class="bk-face bk-front bk-cover-front">
          <div class="bk-cover-frame">
            <svg class="bk-cover-flower" viewBox="0 0 100 100" aria-hidden="true">
              <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <circle cx="50" cy="42" r="5" />
                <path
                  d="M50 37c-8-14-2-24 0-26 2 2 8 12 0 26zM50 47c8 14 2 24 0 26-2-2-8-12 0-26zM45 42c-14-8-24-2-26 0 2 2 12 8 26 0zM55 42c14 8 24 2 26 0-2-2-12-8-26 0z"
                />
                <path d="M50 72v22M50 84c-8-2-13-8-14-12M50 80c8-2 13-8 14-12" />
              </g>
            </svg>
            <h1 class="bk-title">{{ libro.titulo }}</h1>
            <p v-if="libro.subtitulo" class="bk-subtitle">{{ libro.subtitulo }}</p>
          </div>
        </div>
        <div class="bk-face bk-back bk-endpaper"></div>
      </div>

      <!-- HOJAS (avance y retroceso: misma transición, ver book.css) -->
      <div
        v-for="(p, i) in pages"
        :key="i"
        class="bk-leaf"
        :class="{ 'bk-flipped': i < current }"
        :style="{ zIndex: pages.length - i, '--st': (stagger[i] || 0) + 'ms' }"
      >
        <div class="bk-face bk-front bk-paper">
          <template v-if="mounted(i)">
            <PageDedication v-if="p.type === 'dedication'" :active="isActive(i)" @next="next" />
            <PagePhoto
              v-else-if="p.type === 'photo'"
              v-model:noteOpen="noteOpen"
              :foto="p.foto"
              :total="fotos.length"
              :active="isActive(i)"
            />
            <PageEnd v-else :active="isActive(i)" @restart="navigate(closeBook)" />

            <!-- Índice: se abre sobre la hoja actual con el marcapáginas -->
            <div v-if="indexOpen && isActive(i)" class="bk-index-backdrop" @click.stop="indexOpen = false">
              <nav class="bk-index" aria-label="Índice del álbum" @click.stop>
                <h2 class="bk-index-title">Índice</h2>
                <button type="button" class="bk-index-wide" :class="{ 'bk-on': current === 0 }" @click="jump(0)">
                  Dedicatoria
                </button>
                <div class="bk-index-grid">
                  <button
                    v-for="it in photoItems"
                    :key="it.i"
                    type="button"
                    :class="{ 'bk-on': current === it.i }"
                    :aria-label="`Ir a la foto ${it.p.foto.indice + 1}`"
                    @click="jump(it.i)"
                  >
                    {{ it.p.foto.indice + 1 }}
                  </button>
                </div>
                <button type="button" class="bk-index-wide" :class="{ 'bk-on': current === last }" @click="jump(last)">
                  Final
                </button>
              </nav>
            </div>

            <!-- ZONAS DE INTERACCIÓN: esquinas dobladas + marcapáginas.
                 Son parte de la hoja (giran con ella). Para cambiar su aspecto: book.css -> ".bk-corner" y ".bk-ribbon". -->
            <button
              type="button"
              class="bk-corner bk-corner-prev"
              :aria-label="i === 0 ? 'Cerrar el libro' : 'Hoja anterior'"
              :tabindex="isActive(i) ? 0 : -1"
              :disabled="!isActive(i)"
              @click.stop="prev"
            ></button>
            <button
              v-if="i < last"
              type="button"
              class="bk-corner bk-corner-next"
              aria-label="Hoja siguiente"
              :tabindex="isActive(i) ? 0 : -1"
              :disabled="!isActive(i)"
              @click.stop="next"
            ></button>
            <button
              v-if="isActive(i)"
              type="button"
              class="bk-ribbon"
              :aria-expanded="indexOpen"
              aria-label="Índice"
              @click.stop="toggleIndex"
            >
              <span></span>
            </button>
          </template>
        </div>
        <div class="bk-face bk-back bk-paper bk-paper-back"></div>
      </div>
    </div>
  </main>
</template>
