// ÚNICO preset de óleo del álbum. No hay controles para el usuario.
// Ajustado para conservar trazos más gruesos, pictóricos y con mayor relieve de óleo real.
export const OIL_PRESET = {
  density: 0.4, // Reducido para evitar saturar de trazos innecesarios
  relief: 0.15, // Intensidad del relieve del acabado final. El acabado (FINISH.reliefGain en oleo.js) lo aplica suavizado; súbelo para más relieve, bájalo para menos
  duration: 4.5, // Duración optimizada para detenerse en el punto expresivo ideal
  sizeDesktop: 720, // lado mayor (px) en escritorio
  sizeMobile: 520, // lado mayor (px) en móvil
}