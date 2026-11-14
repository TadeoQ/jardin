// =====================================================================
//  CONTENIDO DEL ÁLBUM — AQUÍ ESCRIBES TODOS LOS TEXTOS
//  (es el único archivo donde necesitas tocar texto)
//
//  Dentro de los textos puedes usar Enter para saltos de línea si usas
//  comillas invertidas ( ` ` ). Evita usar comillas invertidas dentro
//  del texto.
// =====================================================================

export const libro = {
  // ---------------------------------------------------------------
  // 1) TÍTULO DE LA PORTADA
  // ---------------------------------------------------------------
  titulo: 'Flores de amor',
  subtitulo: 'Toca para abrir', // texto pequeño bajo el título (déjalo '' si no lo quieres)

  // ---------------------------------------------------------------
  // 2) DEDICATORIA INICIAL (primera página, antes de las fotos)
  // ---------------------------------------------------------------
  dedicatoria: {
    para: 'Para ti,', // a quién va dirigido
    texto: `ESCRIBE AQUÍ TU DEDICATORIA INICIAL.

Puede tener varios párrafos.`,
    firma: 'Con amor', // déjalo '' si no quieres firma
  },

  // ---------------------------------------------------------------
  // 3) PÁGINA FINAL (después de la última foto)
  // ---------------------------------------------------------------
  final: {
    texto: 'Fin',
    pie: 'Toca para volver a la portada',
  },

  // ---------------------------------------------------------------
  // 4) NOTA / DEDICATORIA DE CADA FOTO
  //
  //  La clave es el NOMBRE DEL ARCHIVO dentro de  src/fotos/
  //  (flor-01.jpg, flor-02.jpg ...). Las fotos salen en el libro en
  //  orden alfabético por nombre, por eso conviene numerarlas.
  //
  //  - Si una foto NO tiene nota (o la dejas vacía '') simplemente se
  //    salta ese paso y se pasa a la siguiente hoja.
  //  - Para agregar una foto nueva: copia la imagen a src/fotos/ y
  //    añade aquí una línea con su nombre y su nota.
  // ---------------------------------------------------------------
  notas: {
    'flor-01.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 1',
    'flor-02.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 2',
    'flor-03.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 3',
    'flor-04.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 4',
    'flor-05.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 5',
    'flor-06.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 6',
    'flor-07.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 7',
    'flor-08.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 8',
    'flor-09.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 9',
    'flor-10.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 10',
    'flor-11.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 11',
    'flor-12.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 12',
    'flor-13.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 13',
    'flor-14.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 14',
    'flor-15.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 15',
    'flor-16.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 16',
    'flor-17.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 17',
    'flor-18.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 18',
    'flor-19.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 19',
    'flor-20.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 20',
    'flor-21.jpg': 'ESCRIBE AQUÍ LA NOTA DE LA FOTO 21',
  },
}

// =====================================================================
//  A PARTIR DE AQUÍ NO NECESITAS TOCAR NADA
//  Lee automáticamente todas las imágenes de src/fotos/ y las junta
//  con su nota.
// =====================================================================
const modulos = import.meta.glob('./fotos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const fotos = Object.keys(modulos)
  .map((ruta) => ({ archivo: ruta.split('/').pop(), url: modulos[ruta] }))
  .sort((a, b) => a.archivo.localeCompare(b.archivo, undefined, { numeric: true }))
  .map((f, i) => ({ ...f, indice: i, nota: (libro.notas[f.archivo] || '').trim() }))
