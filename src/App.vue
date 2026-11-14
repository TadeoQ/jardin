<script setup>
import Book from './components/Book.vue'
import { libro } from './content.js'

document.title = libro.titulo
</script>

<template>
  <Book />
</template>
