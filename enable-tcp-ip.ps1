
# This script enables TCP/IP for SQL Server Express
# Right-click and select "Run with PowerShell" or run from elevated PowerShell
param(
  [switch]$AsAdmin
)

function Enable-TCPIP {
  Write-Host "Attempting to enable TCP/IP for SQL Server Express..." -ForegroundColor Cyan

  $instanceRoot = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server'
  $instanceKey = Get-ChildItem -Path $instanceRoot -ErrorAction SilentlyContinue |
    Where-Object { $_.PSChildName -match '^MSSQL\d+\.SQLEXPRESS$' } |
    Sort-Object PSChildName -Descending |
    Select-Object -First 1

  if (-not $instanceKey) {
    Write-Host "✗ Could not find an installed SQLEXPRESS instance in registry." -ForegroundColor Red
    return $false
  }

  $regPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$($instanceKey.PSChildName)\MSSQLServer\SuperSocketNetLib\Tcp"
  
  try {
    $current = (Get-Item -Path $regPath -ErrorAction Stop).GetValue('Enabled')
    Write-Host "Current TCP/IP Enabled value: $current" -ForegroundColor Yellow
    Write-Host "Target instance key: $($instanceKey.PSChildName)" -ForegroundColor Yellow
    
    Set-ItemProperty -Path $regPath -Name 'Enabled' -Value 1 -Force -ErrorAction Stop
    $newValue = (Get-Item -Path $regPath).GetValue('Enabled')
    
    if ($newValue -eq 1) {
      Write-Host "✓ TCP/IP successfully enabled!" -ForegroundColor Green
      Write-Host "Restarting SQL Server Express service..." -ForegroundColor Cyan
      
      Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 5
      Write-Host "✓ SQL Server Express restarted!" -ForegroundColor Green
      return $true
    } else {
      Write-Host "✗ Failed to enable TCP/IP" -ForegroundColor Red
      return $false
    }
  } catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

if ($AsAdmin) {
  Enable-TCPIP
} else {
  # Try to run as admin
  $scriptPath = $MyInvocation.MyCommand.Path
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -AsAdmin"
  
  Write-Host "This script requires administrative privileges." -ForegroundColor Yellow
  Write-Host "Re-launching as Administrator..." -ForegroundColor Cyan
  
  Start-Process powershell -Verb RunAs -ArgumentList $arguments -Wait
}
