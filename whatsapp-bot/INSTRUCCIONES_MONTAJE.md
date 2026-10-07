## Requisitos
- Node.js 22+ → descargar en https://nodejs.org
- Archivo .env con SUPABASE_URL y SUPABASE_SERVICE_KEY

## Instalación
1. Abre una terminal en esta carpeta (`whatsapp-bot`)
2. Ejecuta: `npm install`
3. Ejecuta: `node bot.js`
4. Escanea el QR que aparece en pantalla con WhatsApp
5. El QR también aparecerá en la app (Ajustes → Bot de WhatsApp)

## Autoarranque
- Coloca un acceso directo de `iniciar_bot.bat` en la carpeta Startup de Windows.
- Ruta: `C:\Users\TuUsuario\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

## Notas importantes
- El bot solo funciona mientras la PC esté encendida con internet
- Si el bot se desconecta, se reconecta automáticamente
- Los datos de autenticación se guardan en `/auth_session` (NO borrar)

## Seguimientos post-tratamiento (cola de mensajes)

Desde la app se programan mensajes en la tabla `seguimientos_tratamiento` (cuidados post-tratamiento, chequeos a las
24 h y 72 h, recordatorios de control y de dosis de péptidos). El bot revisa la cola **cada 5 minutos**
(`handlers/followupJob.js`) y envía lo que ya llegó a su hora, **solo entre las 7:00 y las 21:00 (hora de Caracas)**,
con una pausa de 4 s entre mensajes. Cada mensaje se reintenta hasta 3 veces; si falla queda con `estado = 'error'`.

- Para que funcione hay que **volver a desplegar el bot** con esta versión (`bot.js` + `handlers/followupJob.js`).
- Los recordatorios de citas (9:00) ahora usan la hora de Caracas; antes dependían de la zona horaria del servidor.
- Pruebas del job: `node --test handlers/followupJob.test.js`.
