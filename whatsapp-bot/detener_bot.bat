@echo off
rem Detiene el bot de WhatsApp (el que corre en segundo plano o en una ventana)
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*bot.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; 'Bot detenido (proceso ' + $_.ProcessId + ')' }"
pause
