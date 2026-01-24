import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function findProduct() {
  try {
    console.log('🔗 جاري الاتصال...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');
    
    const productId = '6964fbade5d3036c5e5047e0';
    console.log(`🔍 البحث عن المنتج: ${productId}`);
    
    const product = await Product.findById(productId);
    
    if (product) {
      console.log('\n✅ المنتج موجود:');
      console.log(`الاسم: ${product.name}`);
      console.log(`السعر: ${product.suggested_price} دج`);
      console.log(`الفئة: ${product.category}`);
      console.log(`الصورة: ${product.imageUrl || '❌ مفقودة'}`);
    } else {
      console.log('\n❌ المنتج غير موجود!');
      console.log('ابحث عن منتج مع صورة...\n');
      
      const productsWithImages = await Product.find({ imageUrl: { $exists: true, $ne: '' } }).limit(5);
      if (productsWithImages.length > 0) {
        console.log('📦 منتجات تحتوي على صور:');
        productsWithImages.forEach((p, i) => {
          console.log(`\n${i + 1}. ${p.name}`);
          console.log(`   ID: ${p._id}`);
          console.log(`   الصورة: ${p.imageUrl}`);
        });
      } else {
        console.log('⚠️ لا توجد منتجات بصور!');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

findProduct();
