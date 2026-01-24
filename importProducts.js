import fs from 'fs';
import pdf from 'pdf-parse';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// ============ CONFIGURATION ============
const PDF_FILE_PATH = process.env.PDF_FILE_PATH || './catalog.pdf';
const GOOGLE_CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || './service-account-key.json';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = process.env.SHEET_NAME || 'Products';
const DEFAULT_CATEGORY = process.env.DEFAULT_CATEGORY || 'General';

// ============ GOOGLE SHEETS SETUP ============
async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: GOOGLE_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    return sheets;
  } catch (error) {
    console.error('❌ Error initializing Google Sheets client:', error.message);
    throw error;
  }
}

// ============ PDF PARSING ============
async function extractProductsFromPDF(pdfPath) {
  try {
    console.log('📄 Reading PDF file...');
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    
    console.log(`📊 Total pages: ${pdfData.numpages}`);
    console.log('🔍 Extracting text...\n');
    
    return pdfData.text;
  } catch (error) {
    console.error('❌ Error reading PDF:', error.message);
    throw error;
  }
}

// ============ TEXT CLEANING ============
function cleanText(text) {
  // Remove common noise patterns
  let cleaned = text
    // Remove phone numbers (various formats)
    .replace(/\b\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}\b/g, '')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common footer/header patterns
    .replace(/page \d+ of \d+/gi, '')
    .replace(/catalogue|catalog/gi, '')
    .trim();
  
  return cleaned;
}

// ============ PRODUCT EXTRACTION ============
function parseProducts(text) {
  const products = [];
  
  // Split into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentProduct = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers, footers, and noise
    if (
      /^(page|catalogue|catalog|tél|fixe|email|sph)/i.test(line) ||
      /^\d{2}$/.test(line) || // Skip page numbers like "01", "02"
      line.includes('@') || // Skip emails
      line.length < 3
    ) {
      continue;
    }
    
    // Product name starts with /
    if (line.startsWith('/')) {
      // If we have a complete product, save it
      if (currentProduct.name && currentProduct.sku && currentProduct.wholesale_price) {
        products.push({ ...currentProduct });
      }
      
      // Start new product
      currentProduct = {
        name: line.substring(1).trim(), // Remove leading /
        sku: null,
        wholesale_price: null,
        packaging: null,
      };
      continue;
    }
    
    // Continue product name if it's a text line (not Prix, SKU, or Contenance)
    if (currentProduct.name && 
        !currentProduct.sku && 
        !line.startsWith('Prix') && 
        !/^\d{8}$/.test(line) && 
        !line.includes('Contenance') &&
        line.length > 2 &&
        line.length < 100) {
      // Append to existing name
      currentProduct.name += ' ' + line.trim();
      continue;
    }
    
    // Prix pattern: "Prix : 300,00"
    if (line.startsWith('Prix :') && currentProduct.name) {
      const priceMatch = line.match(/Prix\s*:\s*([\d\s,]+)/i);
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(/\s/g, '').replace(',', '.');
        currentProduct.wholesale_price = parseFloat(priceStr);
      }
      continue;
    }
    
    // SKU pattern: 8 digits like "00000080"
    if (/^\d{8}$/.test(line) && currentProduct.name) {
      currentProduct.sku = line;
      continue;
    }
    
    // Packaging: "Contenance emballage : 1"
    if (line.includes('Contenance emballage') && currentProduct.name) {
      const packMatch = line.match(/:\s*(\d+)/);
      if (packMatch) {
        currentProduct.packaging = parseInt(packMatch[1], 10);
      }
      continue;
    }
  }
  
  // Add last product
  if (currentProduct.name && currentProduct.sku && currentProduct.wholesale_price) {
    products.push(currentProduct);
  }
  
  return products;
}

// ============ DATA STRUCTURING ============
function structureProducts(rawProducts) {
  return rawProducts
    .filter(p => p.name && p.sku && p.wholesale_price) // Only valid products
    .map(product => {
      const wholesale = Number(product.wholesale_price) || 0;
      const suggested = Math.round(wholesale * 1.4 * 100) / 100; // Round to 2 decimals
      const profit = Math.round((suggested - wholesale) * 100) / 100;
      
      return {
        name: product.name,
        wholesale_price: wholesale,
        suggested_price: suggested,
        affiliate_profit: profit,
        sku: product.sku,
        packaging: product.packaging || '',
        category: product.category || DEFAULT_CATEGORY,
        active: true,
      };
    });
}

// ============ GOOGLE SHEETS WRITING ============
async function writeToGoogleSheets(sheets, products) {
  try {
    console.log(`\n📝 Writing ${products.length} products to Google Sheets...`);
    
    // Prepare header row
    const headers = [
      'name',
      'wholesale_price',
      'suggested_price',
      'affiliate_profit',
      'sku',
      'packaging',
      'category',
      'active'
    ];
    
    // Prepare data rows
    const rows = products.map(p => [
      p.name,
      p.wholesale_price,
      p.suggested_price,
      p.affiliate_profit,
      p.sku,
      p.packaging,
      p.category,
      p.active
    ]);
    
    // Combine headers + data
    const values = [headers, ...rows];
    
    // Clear existing data first (optional)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z`,
    });
    
    // Write new data
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values,
      },
    });
    
    console.log(`✅ Successfully wrote ${response.data.updatedRows} rows to Google Sheets`);
    return response.data;
  } catch (error) {
    console.error('❌ Error writing to Google Sheets:', error.message);
    throw error;
  }
}

// ============ MAIN EXECUTION ============
async function main() {
  try {
    console.log('🚀 Starting PDF to Google Sheets Import\n');
    console.log('Configuration:');
    console.log(`  PDF: ${PDF_FILE_PATH}`);
    console.log(`  Spreadsheet ID: ${SPREADSHEET_ID}`);
    console.log(`  Sheet Name: ${SHEET_NAME}\n`);
    
    // Step 1: Extract text from PDF
    const rawText = await extractProductsFromPDF(PDF_FILE_PATH);
    
    // Step 2: Parse products directly from raw text (minimal cleaning)
    console.log('🔧 Parsing products...');
    const rawProducts = parseProducts(rawText);
    console.log(`📦 Found ${rawProducts.length} raw product entries\n`);
    
    // Step 4: Structure and validate data
    console.log('🏗️  Structuring data...');
    const structuredProducts = structureProducts(rawProducts);
    console.log(`✅ Validated ${structuredProducts.length} products\n`);
    
    if (structuredProducts.length === 0) {
      console.warn('⚠️  No valid products found. Check PDF format and parsing logic.');
      return;
    }
    
    // Preview first 3 products
    console.log('📋 Preview (first 3 products):');
    structuredProducts.slice(0, 3).forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   SKU: ${p.sku}`);
      console.log(`   Wholesale: ${p.wholesale_price} | Suggested: ${p.suggested_price} | Profit: ${p.affiliate_profit}`);
      console.log(`   Packaging: ${p.packaging || 'N/A'} | Category: ${p.category}`);
    });
    
    // Step 5: Initialize Google Sheets
    const sheets = await getGoogleSheetsClient();
    
    // Step 6: Write to Google Sheets
    await writeToGoogleSheets(sheets, structuredProducts);
    
    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Total products imported: ${structuredProducts.length}`);
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
