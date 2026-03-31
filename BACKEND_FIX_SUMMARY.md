# Backend Fixation Plan - Summary

## ✓ Completed Tasks

### 1. Database Setup
- ✓ Created database: `BACHELORE`
- ✓ Created user: `bachelore_user` (password: `StrongPassword123!`)
- ✓ Granted database owner role to user
- ✓ Verified database is accessible

### 2. Backend Configuration
- ✓ Updated `backend/db/connection.js` with proper timeout settings
- ✓ Configured connection pool with optimized parameters
- ✓ Environment variables properly set in `.env`
- ✓ Created test connection script: `backend/test-db-connection.js`

### 3. SQL Server Protocol Status
- ✓ **Shared Memory**: ENABLED (but not supported by mssql npm package)
- ✗ **TCP/IP**: DISABLED ← This is the issue
- ✗ **Named Pipes**: DISABLED

## ⚠️ Why Backend Isn't Working

**Root Cause**: SQL Server Express has TCP/IP protocol disabled.  
**Impact**: The `mssql` npm package cannot connect to SQL Server.  
**Error**: `Failed to connect to localhost\SQLEXPRESS in 15000ms (ETIMEOUT)`

## ✅ How to Fix (Choose ONE Method)

### Method 1: Run the Batch File (Easiest)
1. Navigate to: `C:\Users\enidh\Bachelore--2\`
2. Right-click: `enable-tcp-ip.bat`
3. Select: "Run as administrator"
4. Wait for confirmation message
5. Done!

### Method 2: Manual Registry Edit
1. Press `Win + R`, type `regedit`, press Enter
2. Navigate to: 
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp
   ```
3. Double-click `Enabled` value
4. Change: `0` → `1`
5. Click OK and close Registry Editor
6. Run in PowerShell:
   ```powershell
   Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
   ```

### Method 3: PowerShell Commands
Open PowerShell as Administrator and run:
```powershell
$path = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp'
Set-ItemProperty -Path $path -Name 'Enabled' -Value 1 -Force
Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
Start-Sleep -Seconds 5
```

## ✅ After Enabling TCP/IP

### Step 1: Verify Connection Works
```bash
cd C:\Users\enidh\Bachelore--2\backend
node test-db-connection.js
```
**Expected Output**: `✓ Connection successful!`

### Step 2: Initialize Database Schema
```bash
node scripts/syncSchema.js
```
**Expected Output**: Schema synchronization messages (no errors)

### Step 3: Start the Backend
```bash
npm start
```
**Expected Output**: Server running on port 5000 with database connected

## 📁 Files Modified/Created

### Database Configuration
- `backend/db/connection.js` - Database connection setup

### Test & Setup Scripts
- `backend/test-db-connection.js` - Connection test
- `enable-tcp-ip.bat` - Windows batch file (recommended)
- `enable-tcp-ip.ps1` - PowerShell script
- `enable-tcp-ip.vbs` - VBScript

### Documentation
- `SQL_SERVER_SETUP.md` - Detailed setup guide
- This file (`BACKEND_FIX_SUMMARY.md`)

## 🔧 Configuration Reference

### Environment Variables (.env)
```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=BACHELORE
DB_USER=bachelore_user
DB_PASSWORD=StrongPassword123!
DB_INSTANCE=SQLEXPRESS
```

### Database Details
- **Server**: `localhost\SQLEXPRESS`
- **Database**: `BACHELORE`
- **User**: `bachelore_user`
- **Password**: `StrongPassword123!`
- **Port**: 1433 (TCP/IP)

## ⚡ Troubleshooting

### Connection Still Times Out?
1. Verify TCP/IP is enabled:
   ```powershell
   (Get-Item 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp').GetValue('Enabled')
   ```
   Should return: `1`

2. Verify SQL Server is running:
   ```powershell
   Get-Service 'MSSQL$SQLEXPRESS' | Select-Object Name, Status
   ```
   Should show: `Running`

3. Try again:
   ```bash
   node test-db-connection.js
   ```

### Registry Edit Not Working?
- Make sure you're in the correct registry path (MSSQL17 not MSSQL16)
- Must have Administrator privileges
- If you get "Access Denied": Check User Account Control (UAC) settings

### Service Won't Start?
```powershell
# Check service status
Get-Service 'MSSQL$SQLEXPRESS'

# View recent errors
Get-EventLog -LogName Application -Source SQL* -Newest 10 | Select-Object TimeGenerated, Message
```

## 📋 Quick Reference Checklist

After enabling TCP/IP:
- [ ] TCP/IP is enabled in registry (value = 1)
- [ ] SQL Server service is running
- [ ] `test-db-connection.js` shows `✓ Connection successful!`
- [ ] `scripts/syncSchema.js` completes without errors
- [ ] `npm start` runs without connection errors
- [ ] Backend is accessible on `http://localhost:5000`

## 🎯 Next Steps

1. **Enable TCP/IP** (use one of the methods above)
2. **Verify connection**: `node test-db-connection.js`
3. **Initialize database**: `node scripts/syncSchema.js`
4. **Start backend**: `npm start`
5. **Start frontend**: Navigate to frontend folder and `npm start`
