import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function checkProducts() {
  try {
    console.log('🔗 جاري الاتصال بـ MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات');
    
    const count = await Product.countDocuments();
    console.log(`📊 عدد المنتجات: ${count}`);
    
    if (count > 0) {
      const products = await Product.find({}).limit(5);
      console.log('\n📦 المنتجات الموجودة:');
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (ID: ${p._id})`);
        console.log(`   السعر: ${p.suggested_price} دج`);
        console.log(`   الصورة: ${p.imageUrl ? '✅' : '❌'}`);
      });
    } else {
      console.log('⚠️ لا توجد منتجات في قاعدة البيانات!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

checkProducts();
