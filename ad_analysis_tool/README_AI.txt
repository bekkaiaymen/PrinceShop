# AI-Driven Ad Farming Guide

This setup allows you to find "Hot Products" from Telegram suppliers using AI, and then use those product names to target Facebook Ads.

## Step 1: Configuration
1. Open `telegram_vision.js` in VS Code.
2. Find the line: `const GEMINI_API_KEY = "YOUR_API_KEY_HERE";`
3. Replace `"YOUR_API_KEY_HERE"` with your actual Google Gemini API Key.
   (Get one here: https://aistudio.google.com/app/apikey)
4. (Optional) Edit `suppliers.json` to add more Telegram channel usernames (without @ or t.me/).

## Step 2: Extract Products (The "Vision" Step)
Run this command to scan Telegram and identify products:
   node telegram_vision.js

*Outcome*: This will create a file named `hot_products.json` containing Arabic keywords for the products found in the images.

## Step 3: Run the Farmer
Run the new AI-enabled bot:
   node niche_farmer_ai.cjs

*Outcome*: The bot will read `hot_products.json` automatically and prioritize searching for those specific products on Facebook to "warm up" the pixel/profile for exactly what the suppliers are selling.

## Notes
- The original `niche_farmer.cjs` is untouched and safe.
- If `hot_products.json` is missing or empty, the bot will use the default niche keywords.
