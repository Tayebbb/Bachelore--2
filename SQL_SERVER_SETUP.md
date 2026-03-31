# Backend Setup - SQL Server Connection Issues & Resolution

## Problem
- SQL Server Express has **TCP/IP protocol DISABLED**
- Node.js mssql package requires TCP/IP to connect
- This causes `ETIMEOUT` errors when trying to connect

## Registry Status
✓ SQL Server 2022 Express (MSSQL17.SQLEXPRESS) is installed
✓ **Shared Memory (SM)** is ENABLED  
✗ **TCP/IP** is DISABLED
✗ **Named Pipes (NP)** is DISABLED

## Solution: Enable TCP/IP via Registry

### Option 1: Manual Registry Edit (Simplest)
1. Press `Win + R` to open Run dialog
2. Type: `regedit` and press Enter
3. Navigate to:
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp
   ```
4. Double-click the **`Enabled`** value
5. Change the value from `0` to `1`
6. Click OK and close Registry Editor
7. Restart SQL Server Express service

### Option 2: Command Prompt (As Administrator)
```cmd
REM Open Command Prompt as Administrator and run:
reg add "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp" /v Enabled /t REG_DWORD /d 1 /f
net stop "MSSQL$SQLEXPRESS"
net start "MSSQL$SQLEXPRESS"
```

### Option 3: PowerShell (As Administrator)
```powershell
$regPath = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp'
Set-ItemProperty -Path $regPath -Name 'Enabled' -Value 1 -Force
Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
Start-Sleep -Seconds 5
```

### Option 4: Using Provided Scripts
Double-click one of these files to enable TCP/IP:
- `enable-tcp-ip.bat` - Batch file (requires admin)
- `enable-tcp-ip.ps1` - PowerShell script (requires admin)  
- `enable-tcp-ip.vbs` - VBScript (requires admin)

## After Enabling TCP/IP

### 1. Verify Connection
```bash
node test-db-connection.js
```
Should output: `✓ Connection successful!`

### 2. Initialize Database
```bash
node scripts/syncSchema.js
```
Should create all database tables.

### 3. Start Backend
```bash
npm start
```
Should start server on port 5000 without connection errors.

## Troubleshooting

### Still Getting ETIMEOUT?
1. Verify TCP/IP is actually enabled:
   ```bash
   Get-Item 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp' | Select-Object -ExpandProperty Enabled
   ```
   Should return: `1`

2. Verify SQL Server service is running:
   ```bash
   Get-Service 'MSSQL$SQLEXPRESS'
   ```
   Should show status: `Running`

3. Restart the service:
   ```bash
   Restart-Service 'MSSQL$SQLEXPRESS' -Force
   Start-Sleep -Seconds 5
   ```

4. Try connection test again:
   ```bash
   node test-db-connection.js
   ```

### Database Connection Still Fails
- Ensure database `BACHELORE` exists (created earlier)
- Ensure user `bachelore_user` exists with correct password
- Check .env file has correct credentials
- Verify SQL Server is fully started (wait 10-15 seconds after start)

## Database & User Verification

Already created:
- ✓ Database: `BACHELORE`
- ✓ User: `bachelore_user` (password: `StrongPassword123!`)
- ✓ User has `db_owner` role

## Configuration Files
- Database config: `backend/db/connection.js`
- Environment: `backend/.env`
- Test script: `backend/test-db-connection.js`

## Next Steps After TCP/IP is Enabled
1. Run: `node test-db-connection.js` - Verify connection
2. Run: `node scripts/syncSchema.js` - Initialize schema
3. Run: `npm start` - Start the backend server
