Write-Host "🚀 STARTING AFFILIATE AUTOMATION SYSTEM" -ForegroundColor Green
Write-Host "========================================"

# Step 1: Run Telegram Vision (Data Extraction)
Write-Host "`n👁️  STEP 1: Telegram Vision (Checking for new products...)" -ForegroundColor Cyan
node "e:\affiliate marketing\ad_automation\telegram_vision.js"

# Check if hot_products.json exists
if (Test-Path "e:\affiliate marketing\ad_automation\hot_products.json") {
    $content = Get-Content "e:\affiliate marketing\ad_automation\hot_products.json" -Raw
    Write-Host "`n✅ Found Hot Products: $content" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️ No hot products file found. Farmer will use default niche keywords." -ForegroundColor Gray
}

# Step 2: Run Facebook Farmer (Action)
Write-Host "`n🚜 STEP 2: Facebook Niche Farmer (Warming & Scraping...)" -ForegroundColor Cyan

Write-Host "🧹 Ensuring all Chrome processes are closed to release file locks..." -ForegroundColor Gray
Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue

node "e:\affiliate marketing\ad_automation\niche_farmer_ai.cjs" --profile=profile_tech

Write-Host "`n✅ AUTOMATION CYCLE COMPLETE." -ForegroundColor Green
Read-Host "Press Enter to exit..."