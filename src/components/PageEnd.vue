<script setup>
// Última hoja. El texto viene de src/content.js  →  libro.final
import { libro } from '../content.js'

const props = defineProps({ active: Boolean })
const emit = defineEmits(['restart'])

function go() {
  if (props.active) emit('restart')
}
</script>

<template>
  <div
    class="bk-page bk-end"
    role="button"
    :tabindex="active ? 0 : -1"
    aria-label="Volver a la portada"
    @click="go"
    @keydown.enter.prevent="go"
    @keydown.space.prevent="go"
  >
    <div class="bk-dedication-inner">
      <p class="bk-end-text">{{ libro.final.texto }}</p>
    </div>
    <p v-if="libro.final.pie" class="bk-hint">{{ libro.final.pie }}</p>
  </div>
</template>
