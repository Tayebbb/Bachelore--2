@SETLOCAL ENABLEDELAYEDEXPANSION
@ECHO OFF
REM Create a scheduled task that enables TCP/IP with elevated privileges

ECHO Creating scheduled task to enable TCP/IP...

REM Create a PowerShell script in AppData
SET PSScript="%APPDATA%\enable-tcp-immediate.ps1"

(
ECHO $regPath = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp'
ECHO $tcpReg = Get-Item -Path $regPath -ErrorAction SilentlyContinue
ECHO if ($tcpReg) {
ECHO   Set-ItemProperty -Path $regPath -Name 'Enabled' -Value 1 -Force -ErrorAction SilentlyContinue
ECHO   Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force -ErrorAction SilentlyContinue
ECHO }
) > !PSScript!

REM Create the scheduled task
schtasks /create /tn "EnableSQLTCPIP" /tr "powershell -ExecutionPolicy Bypass -File !PSScript!" /sc once /st 23:59:00 /F 2>NUL

REM Run it immediately
schtasks /run /tn "EnableSQLTCPIP" /I

REM Wait for it to complete
TIMEOUT /T 5

REM Delete the task after it's done
schtasks /delete /tn "EnableSQLTCPIP" /F

DEL !PSScript!

ECHO Task completed
PAUSE
