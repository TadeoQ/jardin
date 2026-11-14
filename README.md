# Nuestro jardín — álbum interactivo (Vue 3 + Vite)

Libro de fotos para hojear. Todo corre en el navegador (sin servidor).

## Correrlo

```bash
npm install
npm run dev       # desarrollo
npm run build     # genera dist/ para Netlify
npm test          # pruebas del motor y de la lógica de navegación (sin dependencias)
```
Requiere Node 20.19 o superior.

## Tus textos → `src/content.js`
Título de portada, dedicatoria inicial, página final y la nota de cada foto (por nombre de archivo). Es el único archivo de texto.

## Tus fotos → `src/fotos/`
Hay 21 de EJEMPLO (`flor-01.jpg`…`flor-21.jpg`): bórralas y pon las tuyas. Salen en orden alfabético por nombre. Para agregar una: copia la imagen a esa carpeta y añade su línea en `notas` de `content.js`. Recomendado: ~1600 px por lado.

## Cómo se navega (nada se bloquea)
| Acción | Escritorio | Móvil |
|---|---|---|
| Hoja siguiente | esquina inferior derecha, flecha → | esquina inferior derecha, swipe a la izquierda |
| Hoja anterior | esquina inferior izquierda, flecha ← | esquina inferior izquierda, swipe a la derecha |
| Ir a una hoja | marcapáginas (listón arriba a la derecha) → índice | igual |
| Óleo / nota | clic en la foto (óleo → nota; de nuevo para cerrarla) | toque en la foto |

- En la primera hoja, "anterior" cierra el libro; en la última hoja no hay "siguiente".
- Con una nota abierta, al navegar la nota se cierra y después cambia la hoja.
- Con el óleo en curso, al navegar se cancela y la foto vuelve a su estado original (sin óleo ni nota) al volver a ella.

## Dónde está cada cosa
- `src/components/Book.vue` — navegación (`next`, `prev`, `go`), teclado, swipe, índice y las esquinas/marcapáginas (zonas de interacción comentadas).
- `src/components/PagePhoto.vue` — estados de la foto (`idle` / `painting` / `painted`), cancelación y reinicio, nota.
- `src/styles/book.css` — animación de paso de hoja (`.bk-leaf` / `.bk-flipped`: misma transición en ambos sentidos), esquinas (`.bk-corner`), marcapáginas (`.bk-ribbon`) e índice (`.bk-index`).
- `src/utils/nav.js` — lógica pura de navegación (escalonado al saltar varias hojas).
- `src/engine/preset.js` — el único preset de óleo (no editable desde la página).

## Desplegar en Netlify
`npm run build` y arrastra `dist/` a https://app.netlify.com/drop, o conecta el repositorio (`netlify.toml` ya está configurado).
