' VBScript to enable TCP/IP for SQL Server Express
Set WshShell = CreateObject("WScript.Shell")
Dim regPath

regPath = "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp\Enabled"

On Error Resume Next

' Enable TCP/IP in registry
WshShell.RegWrite regPath, 1, "REG_DWORD"

If Err.Number <> 0 Then
    MsgBox "Failed to write registry (admin privileges may be required):" & vbCrLf & Err.Description, vbCritical
    WScript.Quit 1
End If

MsgBox "Registry updated. Restarting SQL Server Express...", vbInformation

' Restart SQL Server
WshShell.Run "net stop ""MSSQL$SQLEXPRESS""", 0, True
WScript.Sleep 3000
WshShell.Run "net start ""MSSQL$SQLEXPRESS""", 0, True
WScript.Sleep 5000

MsgBox "TCP/IP enabled and SQL Server restarted successfully!" & vbCrLf & "You can now run the backend.", vbInformation, "Success"
