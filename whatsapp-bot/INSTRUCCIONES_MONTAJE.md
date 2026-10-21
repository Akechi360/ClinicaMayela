# Bot de WhatsApp · Clínica Dra. Mayela González

Bot no oficial (Baileys) conectado al número dedicado de la clínica. Atiende a los pacientes, agenda con disponibilidad
real, envía recordatorios y los seguimientos post-tratamiento programados desde la app. 100 % gratuito.

## Requisitos
- Node.js 22 o superior (https://nodejs.org).
- Archivo `.env` (copia `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (llave de servicio, **privada**) y `APP_URL`.
- El PC debe estar **encendido, con internet y sin suspensión** mientras el bot esté en uso
  (Windows: Configuración → Sistema → Energía → "Suspender: nunca" con la corriente conectada).

## Instalación
1. En esta carpeta (`whatsapp-bot`): `npm install`. Usa Baileys **7.0.0-rc14** (versión fija; el aviso de "allow-scripts" de npm es normal).
2. Prueba sin WhatsApp (recomendado): `node simulador.js 04141234567` y conversa como si fueras un paciente.
   Lee la agenda real pero **no escribe nada** en la base de datos.
3. Arranca el bot: `node bot.js`
4. Escanea el QR con el teléfono del número dedicado: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo.
   El QR también aparece en la app (Ajustes → Automatización de WhatsApp Bot).
5. En la app, Ajustes → activa **"Activar Funciones del Bot"** y guarda. **Mientras esté apagado, el bot no responde a los pacientes**
   (los recordatorios y seguimientos programados sí salen).

## Autoarranque en Windows
Coloca un acceso directo de `iniciar_bot.bat` en la carpeta de inicio: `Win + R` → `shell:startup`.

## Qué hace
**Paciente (por WhatsApp)**
1. Agendar: elige servicio → día → horario libre → confirma. Solo se ofrecen los horarios realmente libres
   (horario de atención, duración de cada cita, anticipación mínima). Si es paciente nuevo, el bot le envía el enlace de la ficha de ingreso.
2. Ver sus citas · 3. Cancelar (hasta X horas antes, configurable) · 4. Horario e información · 5. Hablar con la doctora.

**Doctora**
- Todo cae en su agenda (y en Google Calendar) y recibe notificaciones en la app.
- **Toma de control humana:** si ella escribe a un paciente desde el teléfono, el bot se calla en ese chat 3 horas.
  También se calla 3 horas cuando el paciente pide hablar con la doctora.

**Alertas a su WhatsApp personal** (Ajustes → *Alertas a mi WhatsApp*; número, silencio y tipos editables)
- El bot le escribe cuando hay una cita nueva o por confirmar, una cancelación, un paciente que pide hablar con ella
  o **síntomas urgentes** (el paciente describe dificultad para respirar, dolor muy intenso, hinchazón fuerte, fiebre, piel morada, etc.).
- De 7:00 a. m. a 7:00 p. m. los avisos llegan al momento. De 7:00 p. m. a 7:00 a. m. (silencio) solo los síntomas urgentes;
  lo demás se junta en un resumen de "buenos días" con la agenda del día. Las fichas de ingreso recibidas van en ese resumen.
- Ante síntomas urgentes el bot orienta al paciente a acudir al centro de salud más cercano si es una emergencia y se calla 3 horas.
- Si el envío falla, reintenta hasta 3 veces. Con `node simulador.js <tel>` puede ver el texto exacto de cada alerta.

**Configuración (en la app)**
- Ajustes → *Agenda por WhatsApp*: horario, días, intervalo, anticipación, máximo de citas, cancelación y texto de información.
- Catálogo de Tratamientos → marca cuáles se pueden agendar por WhatsApp y cuáles requieren aprobación
  (las que requieren aprobación quedan como "pendiente" para que la doctora las confirme).

## Seguimientos post-tratamiento y recordatorios
- La app programa mensajes en `seguimientos_tratamiento` (cuidados, chequeos 24 h y 72 h, controles, dosis de péptidos).
  El bot revisa la cola cada 5 minutos y envía solo entre las 7:00 y las 21:00 (hora de Caracas), con pausas de 4 s entre mensajes.
- Los recordatorios de citas salen una vez al día a la hora de Ajustes, para citas pendientes y confirmadas de mañana.
  Los teléfonos se normalizan (`0414…` → `58414…`).

## Notas importantes
- **Sin paquetes "anti-ban" de terceros:** el espaciado de mensajes ("escribiendo…", pausa de 1 a 3 s entre mensajes, una sola cola) lo hace
  `handlers/antibloqueo.js`. No se instala ningún paquete que tenga acceso a la sesión de WhatsApp.
- **Riesgo de bloqueo:** es una conexión no oficial. Se reduce usando solo el número dedicado, sin envíos masivos y sin
  escribir a quien no sea paciente. Nunca uses el número personal de la doctora.
- **No borres la carpeta `auth_session`:** guarda la sesión de WhatsApp. Haz una copia de seguridad periódica y **nunca** la subas a internet
  (ya está excluida de git: da acceso total a la cuenta).
- Si el bot se desconecta, se reconecta solo. El estado de las conversaciones se guarda en la base de datos, así que un reinicio no las pierde.
- Pruebas: `npm test` (equivalente a `node --test handlers/*.test.js`).
