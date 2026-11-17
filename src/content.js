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
  titulo: 'Nuestro jardín', // título grande de la portada
  subtitulo: '', // texto pequeño bajo el título (déjalo '' si no lo quieres)

  // ---------------------------------------------------------------
  // 2) DEDICATORIA INICIAL (primera página, antes de las fotos)
  // ---------------------------------------------------------------
  dedicatoria: {
    para: 'Para Mia,', // a quién va dirigido
    texto: `Feliz cumpleaños amor, este álbum es un pequeño regalo para ti, no es la gran cosa, perdon por no poder hacer algo más grande, pero espero que te guste, te dedico mi primer proyecto como ingeniero.
Es un un recordatorio de todas tus flores y de lo que no te pude decir en cada una de ellas, de lo especial que eres y de lo mucho que te amo.`,
    firma: 'Con amor Tadeo', // déjalo '' si no quieres firma
  },

  // ---------------------------------------------------------------
  // 3) PÁGINA FINAL (después de la última foto)
  // ---------------------------------------------------------------
  final: {
    texto: 'Fin',
    pie: '23/700',
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
    'flor-01.jpg': `Pa
Me dijiste que hace mucho que no te daban flores, asi que de paso vi una floreria y pase por esto, espero te gusten.`,
    'flor-02.jpg': `14
Son las primerfas flores que encargo, y enverdad no se cuales son tus favoritas, pero espero que te gusten y te hagan saber lo que siento.`,
    'flor-03.jpg': `Sorpresa
No son las flores mas bonitas, pero no queria dejarte sin tus flores depues de que no nos pudimos ver el fin pasado.`,
    'flor-04.jpg': `Adios
La verdad no se que pase entre nosotros, pero si es una depedida no me queria ir asi nomas, te dejo estas flores, te quiero mucho Mia.`,
    'flor-05.jpg': `Amarillo
Tu sabias?, Espero con este ramo porfin encontrar tus flores favoritas, y si no lo son, espero que te gusten.`,
    'flor-06.jpg': `Resto
Se que solo es una triste flor, pero ya me voy y no tengo mucho dinero, pero espero que refleje lo que siento por ti, y que te voy a extrañar mucho`,
    'flor-07.jpg': `Hola
Hace tiempo que no te veo, espero que estés bien, te extrañe mucho ya quiero volver a pasar tiempo contigo y no puedo esperar a que llegue el dia.`,
    'flor-08.jpg': `BTS
Es el ramo mas army que encontre, tenia planeado otra cosa hoy, pero se que te gusta mucho bts, asi que mientras sigas siendo feliz yo tambien lo seré.`,
    'flor-09.jpg': `Disculpa
Se que te dije algo muy estupido, y una disculpa no es suficiente, y ahora no estoy seguro de hacer lo que tenia planeado, lo siento mucho, te quiero y perdóname por hablar sin pensar.`,
    'flor-10.jpg': `Quieres?
Te amo, hace mucho que siento esto, pero nunca supe como decrilo, ya perdi mi oportunidad de decirte esto hace tiempo y no quiero  que pase mas tiempo sin decirtelo, me dijiste que te esperara y no quiero que te sientas presionada, pero ya no puedo mas, te amo y quiero que seas feliz, y si es conmigo mas que mejor.`,
    'flor-11.jpg': `Tiempo
Hace rato que no te regalalaba flores, no quiero que pienses que porque ya somos novios no te voy a dar flores, solo fue una pausita, te amo mucho.`,
    'flor-12.jpg': `Mes
Hola amor, feliz primer mes, es la primera vez que te doy lirios y espero que compensen un poco la broma que te hice, espero que no te enojes, te amo mucho muchote.`,
    'flor-13.jpg': `Purple
Se que el ramo no tiene nada de morado, pero hoy tambien va a ser un dia muy army, espero que disfrutez mucho tu proyeccion, te diviertas hoy y chace conozcas alguna nueva amiga, i purple you.`,
    'flor-14.jpg': `Bai
No es el gran ramo, pero te lo compro con el poco dinero que me queda, y no puedo despedirme sin darte unas flores, nos vemos pronto mi vida.`,
    'flor-15.jpg': `Tres
Feliz mes, amor. La distancia no cambia nada, te sigo amando como el primer día. Zib zub zab.`,
    'flor-16.jpg': `Llegue
Hola amor, es bonito volver a verte ya te extrañaba mucho y estas flores son un reflejo de que mi amor por ti no cambio ni un poquito en este tiempo, te mango mucho.`,
    'flor-17.jpg': `Enojada?
Me la jugue mucho con esto, mantuve mucho el papel de mamon contigo, espero que no te hayas enojado, pero sabes que te amo mi vida.`,
    'flor-18.jpg': `Morfina
Se que este dia tal vez no fue como se tenia planeado, pero espero que te guste volver a visitar este lugar y volver a pasar un tiempo juntos en el, quiero todo contigo y nada me hara dejar de pensar en eso, te amo infinito+1 .`,
    'flor-19.jpg': `Norte
No es un gran ramo a comparacion con el otro, pero en mi defensa nosotros estamos en el emisferio norte, pero no importa, por que mi amor por ti abarca todo el mundo y no tiene limites, te amo mucho.`,
    'flor-20.jpg': `Plan
Estas son unas flores especiales, por que son las que nos acompañeran a este plan que se nos escapado mucho tiempo y por fin vamos a ir al mufi, espero que te guste tanto como las flores.`,
    'flor-21.jpeg': `Salvaje
Son pequeñas flores que reflejan el gran amor y felicidad de tenerte aqui, se que no me he comportado bien y que estoy raro, lo siento mucho, pero no olvides que te amo.`,
    'flor-22.jpg': `Perdon
Ahora si la cague a lo grande, lo siento mucho, no hay como justificarme, simplemente pido perdón, te amo mi vida.`,
    'flor-23.jpeg': `Confianza
Es pequeño, lo se, pero es de corazon y de la improvisación, espero no te sientas presionada o incomoda por mi familia, solo quiero que te sientas bien y en confianza con ellos, te amo.`,
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
