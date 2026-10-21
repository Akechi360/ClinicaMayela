// FRASES DEL BOT. Para que suene más natural basta con agregar variantes a estas listas: el bot elige una al azar.
// Reglas: trato de "usted"; {nombre} se reemplaza por el nombre del paciente (si no se conoce, la frase se omite o se usa la variante sin nombre).
// No hace falta tocar ningún otro archivo ni reiniciar nada más que el bot.

export const FRASES = {
  // Encabezado según la hora. {nombre} puede faltar: se usa entonces la lista "sinNombre".
  saludoManana: { conNombre: ['Buenos días, {nombre}.', 'Muy buenos días, {nombre}.'], sinNombre: ['Buenos días.', 'Muy buenos días.'] },
  saludoTarde: { conNombre: ['Buenas tardes, {nombre}.', 'Muy buenas tardes, {nombre}.'], sinNombre: ['Buenas tardes.', 'Muy buenas tardes.'] },
  saludoNoche: { conNombre: ['Buenas noches, {nombre}.', 'Muy buenas noches, {nombre}.'], sinNombre: ['Buenas noches.', 'Muy buenas noches.'] },

  gracias: [
    'Con mucho gusto. Estamos a sus órdenes para lo que necesite.',
    'Es un placer atenderle. Si necesita algo más, escriba *menu*.',
    'A sus órdenes. Que tenga un excelente día.',
  ],
  despedida: [
    'Hasta pronto. Que tenga un excelente día.',
    'Gracias por comunicarse con la clínica. Estamos a sus órdenes cuando lo necesite.',
    'Fue un gusto atenderle. Hasta pronto.',
  ],
  noEntendi: [
    'Disculpe, no logré entender su mensaje. ¿Podría elegir una de estas opciones?',
    'Con gusto le ayudo, pero no logré interpretar su mensaje. Por favor, elija una de estas opciones:',
    'Perdone, no estoy seguro de haberle entendido. Estas son las opciones disponibles:',
  ],
  cambiarCita: [
    'Para cambiar su cita, primero debemos cancelar la actual y luego agendar una nueva.',
    'Con gusto. Para cambiar el horario, cancelaremos su cita actual y luego agendaremos la nueva.',
  ],
  // Cuando el paciente ya dijo qué día quiere ("para el jueves")
  diaEntendido: ['Perfecto, buscaré horarios para el *{dia}*.', 'Entendido, estos son los horarios del *{dia}*.'],
  diaNoDisponible: ['Ese día no tengo horarios disponibles, pero estos son los días con disponibilidad:', 'Lamentablemente ese día no hay horarios libres. Estos son los días disponibles:'],
};

/** Elige una variante. `azar` es inyectable para las pruebas. */
export function elegir(lista, azar = Math.random) {
  return lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];
}

export const rellenar = (texto, vars = {}) => texto.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
