@echo off
echo ========================================================
echo       MyAdFinder GitHub Uploader (Safe Mode)
echo ========================================================
echo.
echo This script will merge your new tool with your existing website.
echo NO files from your old website will be deleted.
echo.

:: 1. Setup Remote
git remote remove origin 2>nul
git remote add origin https://github.com/bekkaiaymen/PrinceShop.git

:: 2. Pull Existing Website (Merge)
echo [1/3] Downloading your existing website to merge...
echo Attempting to pull from 'main'...
git pull origin main --allow-unrelated-histories --no-edit
if %errorlevel% neq 0 (
    echo 'main' branch failed or not found. Trying 'master'...
    git pull origin master --allow-unrelated-histories --no-edit
)

:: 3. Prepare Upload
echo.
echo [2/3] Preparing files for upload...
git add .
git commit -m "Add MyAdFinder tool to existing website"

:: 4. Push to GitHub
echo.
echo [3/3] Uploading everything to GitHub...
echo.
echo NOTE: If a pop-up asks for credentials, please sign in.
echo.

git push -u origin main
if %errorlevel% neq 0 (
    git push -u origin master
)

echo.
echo ========================================================
echo                 Process Complete!
echo ========================================================
echo You can now check https://github.com/bekkaiaymen/PrinceShop
pause