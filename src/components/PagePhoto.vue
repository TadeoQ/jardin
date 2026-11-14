<script setup>
// =====================================================================
//  UNA HOJA CON FOTO
//
//  ESTADOS DE LA FOTO (solo viven mientras la hoja está abierta):
//    idle     foto original (estado de partida y de reinicio)
//    painting animación de óleo en curso
//    painted  óleo terminado; un clic en la foto abre/cierra la nota
//  La nota es "noteOpen" (la controla Book.vue para poder cerrarla al navegar).
//
//  REGLA DE NAVEGACIÓN: nada de aquí bloquea la navegación. Al salir de
//  la hoja (prop `active` pasa a false):
//    - se cancela cualquier carga/animación del óleo (queda congelada
//      mientras la hoja gira, para que no haya saltos visuales);
//    - pasado el giro, la hoja vuelve a "idle" (foto original, sin óleo
//      ni nota). Si se vuelve antes de que termine, se reinicia al instante.
//
//  La nota de cada foto viene de src/content.js  ->  libro.notas
// =====================================================================
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { createPainter } from '../utils/painter.js'
import { isMobileDevice, loadImageData } from '../utils/image.js'
import { OIL_PRESET } from '../engine/preset.js'

const props = defineProps({
  foto: { type: Object, required: true }, // { archivo, url, indice, nota }
  total: { type: Number, default: 0 },
  active: Boolean,
  noteOpen: Boolean,
})
const emit = defineEmits(['update:noteOpen'])

const RESET_MS = 1400 // un poco más que el giro de la hoja (FLIP_MS)

const state = ref('idle')
const ar = ref(4 / 3)
const hasCanvas = ref(false)
const canvasKey = ref(0)
const canvasShown = ref(false)
const canvasEl = ref(null)
let painter = null
let runId = 0 // cada carrera de óleo tiene su número; si cambia, se aborta
let resetTimer = null

function onImgLoad(e) {
  const { naturalWidth: w, naturalHeight: h } = e.target
  if (w && h) ar.value = w / h
}

function onMessage(m) {
  if (state.value === 'idle') return // mensaje tardío de un óleo ya cancelado
  if (m.type === 'started') {
    canvasShown.value = true
  } else if (m.type === 'done') {
    state.value = 'painted'
  } else if (m.type === 'error') {
    // Si el óleo falla, no se rompe el libro: se deja la foto original.
    canvasShown.value = false
    state.value = 'painted'
  }
}

// Un canvas transferido a un Worker no se puede reutilizar: si el Worker
// falla, se crea uno nuevo y se pinta en el hilo principal.
async function setupPainter(my, forceMain = false) {
  await nextTick()
  if (my !== runId) return false
  painter?.destroy()
  painter = createPainter(canvasEl.value, { onMessage, forceMain })
  try {
    await painter.ready
  } catch {
    painter.destroy()
    painter = null
    canvasKey.value++
    return setupPainter(my, true)
  }
  if (my !== runId) {
    painter.destroy()
    painter = null
    return false
  }
  return true
}

async function startOil() {
  if (state.value !== 'idle') return
  const my = ++runId
  state.value = 'painting'
  try {
    const blob = await (await fetch(props.foto.url)).blob()
    if (my !== runId) return
    const size = isMobileDevice() ? OIL_PRESET.sizeMobile : OIL_PRESET.sizeDesktop
    const image = await loadImageData(blob, size)
    if (my !== runId) return
    hasCanvas.value = true
    if (!(await setupPainter(my))) return
    painter.start(image, {
      density: OIL_PRESET.density,
      relief: OIL_PRESET.relief,
      duration: OIL_PRESET.duration,
      seed: props.foto.indice + 1, // misma foto = misma pintura
      startFromPhoto: true, // arranca desde la foto original
    })
  } catch {
    if (my === runId) {
      canvasShown.value = false
      state.value = 'painted'
    }
  }
}

// Vuelve a foto original, sin óleo ni nota.
function hardReset() {
  clearTimeout(resetTimer)
  runId++
  painter?.destroy()
  painter = null
  hasCanvas.value = false
  canvasShown.value = false
  state.value = 'idle'
}

watch(
  () => props.active,
  (active) => {
    clearTimeout(resetTimer)
    if (active) {
      if (state.value !== 'idle') hardReset() // se volvió antes de que terminara el giro
    } else {
      runId++ // cancela cualquier carga en curso
      painter?.reset() // detiene el óleo; el lienzo queda congelado mientras la hoja gira
      if (state.value !== 'idle') resetTimer = setTimeout(hardReset, RESET_MS)
    }
  },
)

onBeforeUnmount(() => {
  clearTimeout(resetTimer)
  painter?.destroy()
})

// Clic en la foto: óleo -> nota (abrir / cerrar). No navega.
function onPhoto() {
  if (!props.active) return
  if (state.value === 'idle') startOil()
  else if (state.value === 'painted' && props.foto.nota) emit('update:noteOpen', !props.noteOpen)
}

const showNote = () => props.noteOpen && props.active && state.value === 'painted'

const hint = () => {
  if (state.value === 'idle') return 'Toca la foto para pintarla al óleo'
  if (state.value === 'painting') return 'Pintando…'
  return props.foto.nota ? 'Toca la foto para leer la nota' : ''
}
</script>

<template>
  <div class="bk-page bk-photo">
    <span class="bk-num">{{ foto.indice + 1 }} / {{ total }}</span>

    <div
      class="bk-photo-area"
      role="button"
      :tabindex="active ? 0 : -1"
      :aria-label="`Foto ${foto.indice + 1} de ${total}`"
      @click="onPhoto"
      @keydown.enter.prevent="onPhoto"
      @keydown.space.prevent="onPhoto"
    >
      <div class="bk-frame" :style="{ '--ar': ar }">
        <img :src="foto.url" alt="" decoding="async" draggable="false" @load="onImgLoad" />
        <canvas
          v-if="hasCanvas"
          :key="canvasKey"
          ref="canvasEl"
          class="bk-oil"
          :class="{ 'bk-oil-show': canvasShown }"
        ></canvas>
      </div>
    </div>

    <p class="bk-hint" :class="{ 'bk-hint-pulse': state === 'idle' }">{{ hint() }}</p>

    <Transition name="bk-note">
      <div v-if="showNote()" class="bk-note-backdrop" @click.stop="emit('update:noteOpen', false)">
        <div class="bk-note" role="dialog" aria-label="Nota de la foto" @click.stop>
          <p class="bk-note-text">{{ foto.nota }}</p>
          <button type="button" class="bk-note-close" @click.stop="emit('update:noteOpen', false)">Cerrar</button>
        </div>
      </div>
    </Transition>
  </div>
</template>
