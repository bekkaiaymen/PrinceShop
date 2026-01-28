Write-Host "🛑 Killing all Chrome and Node processes..." -ForegroundColor Yellow
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

$profiles = @("profile_tech", "profile_auto")
$baseDir = "E:\affiliate marketing\ad_automation\profiles"

foreach ($profile in $profiles) {
    $lockPath = Join-Path $baseDir $profile "SingletonLock"
    if (Test-Path $lockPath) {
        Write-Host "🧹 Removing lock file for $profile..." -ForegroundColor Red
        Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
    }
    
    # Also clean up socket/cookie locks just in case
    $cookieLock = Join-Path $baseDir $profile "SingletonCookie"
    if (Test-Path $cookieLock) { Remove-Item $cookieLock -Force -ErrorAction SilentlyContinue }
    
    $socketLock = Join-Path $baseDir $profile "SingletonSocket"
    if (Test-Path $socketLock) { Remove-Item $socketLock -Force -ErrorAction SilentlyContinue }
}

Write-Host "✅ Cleanup Complete." -ForegroundColor Green
Start-Sleep -Seconds 1

Write-Host "🚀 Launching Bot 1: Phone Accessories (Tech Profile)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& node niche_farmer.cjs --profile 'profile_tech' --niche 'phone accessories' --url 'https://www.facebook.com/marketplace/category/phone-accessories' --skip-clone" -WorkingDirectory "e:\affiliate marketing\ad_automation"

Write-Host "🚀 Launching Bot 2: Car Accessories (Auto Profile)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& node niche_farmer.cjs --profile 'profile_auto' --niche 'car accessories' --url 'https://www.facebook.com/marketplace/category/car-accessories' --skip-clone" -WorkingDirectory "e:\affiliate marketing\ad_automation"
