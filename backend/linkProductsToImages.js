import mongoose from 'mongoose';
import Product from './models/Product.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function linkProductsToImages() {
  try {
    console.log('🔗 ربط المنتجات بصورها الحقيقية (الربط المباشر)...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    // الحصول على جميع الصور من المجلد
    const productsDir = path.join(__dirname, '../frontend/public/products');
    const imageFiles = fs.readdirSync(productsDir)
      .filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg'))
      .sort();  // ترتيب الصور حسب الاسم
    
    console.log(`📸 عدد الصور المتوفرة: ${imageFiles.length}\n`);

    // الحصول على جميع المنتجات من قاعدة البيانات
    const dbProducts = await Product.find().sort({ _id: 1 });
    console.log(`📦 عدد المنتجات في قاعدة البيانات: ${dbProducts.length}\n`);

    let matched = 0;
    let notMatched = 0;

    // ربط كل منتج بصورته (ربط مباشر 1:1)
    for (let i = 0; i < dbProducts.length; i++) {
      const dbProduct = dbProducts[i];
      
      // ربط مباشر: المنتج رقم i يحصل على الصورة رقم i
      if (i < imageFiles.length) {
        dbProduct.image = `/products/${imageFiles[i]}`;
        dbProduct.imageSource = 'pdf';
        await dbProduct.save();
        matched++;
        
        if (matched % 100 === 0) {
          console.log(`   ✅ تم ربط ${matched} منتج...`);
        }
      } else {
        // في حالة عدم توفر صور كافية
        notMatched++;
        dbProduct.image = '/products/product_001_01.jpeg';
        await dbProduct.save();
      }
    }

    console.log(`\n✅ النتائج:`);
    console.log(`   ✓ تم ربط ${matched} منتج بصوره الحقيقية`);
    console.log(`   ⚠ ${notMatched} منتج استخدم صورة بديلة`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 تم إغلاق الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

// دالة حساب التشابه بين النصوص
function stringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// حساب مسافة Levenshtein
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

linkProductsToImages();
