<script setup>
// Primera hoja. El texto viene de src/content.js  →  libro.dedicatoria
import { libro } from '../content.js'

const props = defineProps({ active: Boolean })
const emit = defineEmits(['next'])

function go() {
  if (props.active) emit('next')
}
</script>

<template>
  <div
    class="bk-page bk-dedication"
    role="button"
    :tabindex="active ? 0 : -1"
    aria-label="Pasar la hoja"
    @click="go"
    @keydown.enter.prevent="go"
    @keydown.space.prevent="go"
  >
    <div class="bk-dedication-inner">
      <p v-if="libro.dedicatoria.para" class="bk-dedication-para">{{ libro.dedicatoria.para }}</p>
      <p class="bk-dedication-text">{{ libro.dedicatoria.texto }}</p>
      <p v-if="libro.dedicatoria.firma" class="bk-dedication-sign">{{ libro.dedicatoria.firma }}</p>
    </div>
    <p class="bk-hint">Toca para pasar la hoja</p>
  </div>
</template>
