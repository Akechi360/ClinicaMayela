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
