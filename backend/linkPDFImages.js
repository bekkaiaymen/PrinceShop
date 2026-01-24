import mongoose from 'mongoose';
import Product from './models/Product.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function linkPDFImagesToProducts() {
  try {
    console.log('🔗 ربط صور PDF بالمنتجات...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    // الحصول على قائمة الصور المستخرجة
    const imagesDir = path.join(__dirname, '../frontend/public/products');
    const imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.startsWith('product_') && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')))
      .sort((a, b) => {
        // ترتيب حسب رقم الصفحة ثم رقم الصورة
        const aMatch = a.match(/product_(\d+)_(\d+)/);
        const bMatch = b.match(/product_(\d+)_(\d+)/);
        if (aMatch && bMatch) {
          const pageA = parseInt(aMatch[1]);
          const pageB = parseInt(bMatch[1]);
          if (pageA !== pageB) return pageA - pageB;
          return parseInt(aMatch[2]) - parseInt(bMatch[2]);
        }
        return 0;
      });

    console.log(`📸 عدد الصور المستخرجة: ${imageFiles.length}\n`);

    // الحصول على جميع المنتجات مرتبة
    const products = await Product.find().sort({ _id: 1 });
    console.log(`📦 عدد المنتجات: ${products.length}\n`);

    let updated = 0;

    // ربط كل منتج بصورته (كل 10 منتجات من نفس الصفحة يأخذون صور الصفحة)
    for (let i = 0; i < products.length && i < imageFiles.length; i++) {
      const product = products[i];
      const imagePath = `/products/${imageFiles[i]}`;
      
      product.image = imagePath;
      product.imageSource = 'pdf';
      await product.save();
      updated++;

      if ((i + 1) % 100 === 0) {
        console.log(`   ✅ تم تحديث ${i + 1}/${products.length} منتج...`);
      }
    }

    console.log(`\n✅ تم تحديث ${updated} منتج بصور PDF الحقيقية!`);
    console.log(`📁 الصور متاحة في: /products/`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 تم إغلاق الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

linkPDFImagesToProducts();
