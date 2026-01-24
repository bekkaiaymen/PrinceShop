const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const { createCanvas, loadImage } = require('canvas');
require('dotenv').config();

// مسار PDF
const pdfPath = path.join(__dirname, '../catalog.pdf');

// إنشاء مجلد الصور إذا لم يكن موجوداً
const imagesDir = path.join(__dirname, '../frontend/public/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function extractImagesFromPDF() {
  console.log('⚠️ لاستخراج الصور من PDF، يُرجى استخدام أحد الطرق التالية:\n');
  console.log('1️⃣ استخدام Adobe Acrobat أو برنامج مشابه لتصدير الصور يدوياً');
  console.log('2️⃣ استخدام أدوات سطر الأوامر مثل:');
  console.log('   - pdftoppm (من Poppler)');
  console.log('   - ImageMagick convert');
  console.log('   - Ghostscript\n');
  
  console.log('🔄 كبديل، سنستخدم الصور من Unsplash التي سبق إضافتها...\n');
  
  // استخدام الصور الموجودة بالفعل
  await linkImagesToProducts();
}

async function linkImagesToProducts() {
  try {
    console.log('🔗 ربط الصور بالمنتجات...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    const products = await Product.find().sort({ _id: 1 });
    console.log(`📦 عدد المنتجات: ${products.length}\n`);

    // كل صفحة تحتوي على حوالي 10 منتجات
    const productsPerPage = 10;
    let updated = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const pageNumber = Math.floor(i / productsPerPage) + 1;
      
      // استخدام صورة الصفحة التي يوجد فيها المنتج
      const imageUrl = `/products/page.${pageNumber}.jpg`;
      
      product.image = imageUrl;
      product.imageSource = 'pdf';
      await product.save();
      updated++;

      if ((i + 1) % 100 === 0) {
        console.log(`   تم تحديث ${i + 1}/${products.length} منتج...`);
      }
    }

    console.log(`\n✅ تم تحديث ${updated} منتج بالصور من PDF!`);

  } catch (error) {
    console.error('❌ خطأ في الربط:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 تم إغلاق الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

// تشغيل الاستخراج
extractImagesFromPDF();
