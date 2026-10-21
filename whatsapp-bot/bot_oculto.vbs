' Inicia el bot de WhatsApp en segundo plano (sin ventana). Lo que el bot escribe queda en bot.log.
' Si ya está corriendo no lo vuelve a iniciar (dos copias a la vez chocarían entre sí).
Option Explicit
Dim sh, fso, carpeta, wmi, procesos, p
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
carpeta = fso.GetParentFolderName(WScript.ScriptFullName)

Set wmi = GetObject("winmgmts:\\.\root\cimv2")
Set procesos = wmi.ExecQuery("Select CommandLine from Win32_Process Where Name = 'node.exe'")
For Each p In procesos
  If Not IsNull(p.CommandLine) Then
    If InStr(LCase(p.CommandLine), "bot.js") > 0 Then WScript.Quit
  End If
Next

sh.CurrentDirectory = carpeta
sh.Run "cmd /c node bot.js >> bot.log 2>&1", 0, False
