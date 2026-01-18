import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import axios from 'axios';
import Product from './models/Product.js';

dotenv.config();

// ============ GOOGLE SHEETS ============
async function getGoogleSheetsData() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${process.env.SHEET_NAME}!A2:H`, // Skip header row
  });

  return response.data.values || [];
}

// ============ IMAGE FETCHING ============
async function fetchImageForProduct(productName, category) {
  try {
    // استخدام صور حقيقية من Unsplash (بدون API key)
    const categoryImages = {
      'Adaptateurs': 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
      'Air Pods': 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500&h=500&fit=crop',
      'Coques Protection': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&h=500&fit=crop',
      'Haut-parleurs': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
      'Batteries': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop',
      'Câbles': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
      'Cartes Mémoire': 'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=500&h=500&fit=crop',
      'Casques Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      'Chargeurs': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&h=500&fit=crop',
      'Clés USB': 'https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=500&h=500&fit=crop',
      'Écouteurs': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
      'Supports': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
      'Montres Connectées': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      'Protection Écran': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
      'Téléphones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
      'Power Banks': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop',
      'Microphones': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&h=500&fit=crop',
      'Pochettes': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&h=500&fit=crop',
      'Tondeuses': 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&h=500&fit=crop',
      'Accessoires': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop',
    };

    // إرجاع صورة حسب الفئة
    const imageUrl = categoryImages[category] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&h=500&fit=crop';
    
    return {
      url: imageUrl,
      source: 'unsplash'
    };

  } catch (error) {
    console.error(`Error fetching image for ${productName}:`, error.message);
    return {
      url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&h=500&fit=crop',
      source: 'unsplash'
    };
  }
}

// ============ CATEGORY DETECTION ============
function detectCategory(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('adaptateur') || name.includes('otg')) return 'Adaptateurs';
  if (name.includes('air pods') || name.includes('airpods')) return 'Air Pods';
  if (name.includes('antichoc') || name.includes('antichoce')) return 'Coques Protection';
  if (name.includes('baffe') || name.includes('baffle')) return 'Haut-parleurs';
  if (name.includes('battery') || name.includes('batteris')) return 'Batteries';
  if (name.includes('cable')) return 'Câbles';
  if (name.includes('carte memoire') || name.includes('sd')) return 'Cartes Mémoire';
  if (name.includes('casque')) return 'Casques Audio';
  if (name.includes('chargeur')) return 'Chargeurs';
  if (name.includes('flash disque') || name.includes('usb')) return 'Clés USB';
  if (name.includes('glass') || name.includes('verre')) return 'Protection Écran';
  if (name.includes('kitman') || name.includes('kitmane')) return 'Écouteurs';
  if (name.includes('power bank')) return 'Power Banks';
  if (name.includes('smart watch') || name.includes('watch')) return 'Montres Connectées';
  if (name.includes('support')) return 'Supports';
  if (name.includes('microphone')) return 'Microphones';
  if (name.includes('tondeuse')) return 'Tondeuses';
  if (name.includes('phone')) return 'Téléphones';
  if (name.includes('pochette')) return 'Pochettes';
  
  return 'Accessoires';
}

// ============ MAIN IMPORT ============
async function importProducts() {
  try {
    console.log('🚀 Starting import from Google Sheets...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Fetch data from Google Sheets
    console.log('📊 Fetching data from Google Sheets...');
    const rows = await getGoogleSheetsData();
    console.log(`📦 Found ${rows.length} products\n`);

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products\n');

    // Import products with images
    console.log('🖼️  Fetching images and importing products...\n');
    let imported = 0;

    for (const [index, row] of rows.entries()) {
      const [name, wholesale_price, suggested_price, affiliate_profit, sku, packaging, category, active] = row;

      if (!name || !sku) {
        console.log(`⚠️  Skipped row ${index + 2}: Missing name or SKU`);
        continue;
      }

      // Detect category
      const detectedCategory = detectCategory(name);

      // Fetch image
      console.log(`[${index + 1}/${rows.length}] ${name.substring(0, 40)}...`);
      const image = await fetchImageForProduct(name, detectedCategory);

      // Calculate affiliate profit: 75% of (Suggested Price - Wholesale Price)
      const calculatedProfit = Math.round((Number(suggested_price) - Number(wholesale_price)) * 0.75);

      const product = new Product({
        name: name.trim(),
        wholesale_price: Number(wholesale_price) || 0,
        suggested_price: Number(suggested_price) || 0,
        // Use calculated profit, fallback to sheet value or 0
        affiliate_profit: calculatedProfit > 0 ? calculatedProfit : (Number(affiliate_profit) || 0),
        sku: sku.trim(),
        packaging: packaging || '',
        category: detectedCategory,
        active: active === 'TRUE' || active === true,
        image: image.url,
        imageSource: image.source,
      });

      await product.save();
      imported++;

      // Delay to avoid rate limiting
      if (image.source === 'unsplash') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Successfully imported ${imported} products!`);

    // Show statistics
    const stats = await Product.aggregate([
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        avgProfit: { $avg: '$affiliate_profit' }
      }},
      { $sort: { count: -1 }}
    ]);

    console.log('\n📊 Statistics by Category:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} products (Avg profit: ${stat.avgProfit.toFixed(2)} DA)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

importProducts();
