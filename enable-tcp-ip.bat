@echo off
REM Right-click this file and select "Run as administrator"

color 0A
cls
echo ========================================
echo SQL Server Express - Enable TCP/IP
echo ========================================
echo.

echo Enabling TCP/IP in registry...
reg add "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp" /v Enabled /t REG_DWORD /d 1 /f

if %ERRORLEVEL% EQU 0 (
    echo [√] TCP/IP enabled successfully
) else (
    color 0C
    echo [X] Failed to enable TCP/IP - Make sure to run as Administrator!
    pause
    exit /b 1
)

echo.
echo Restarting SQL Server Express...
net stop "MSSQL$SQLEXPRESS" >nul 2>&1
timeout /t 3 /nobreak

net start "MSSQL$SQLEXPRESS" >nul 2>&1
timeout /t 5 /nobreak

echo [√] SQL Server restarted

color 0B
echo.
echo ========================================
echo Success! TCP/IP is now enabled.
echo ========================================
echo.
echo You can now:
echo   1. Close this window
echo   2. Run: node test-db-connection.js
echo   3. Run: npm start
echo.
pause

