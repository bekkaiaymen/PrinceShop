import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

// دالة حساب السعر حسب النسب المطلوبة
function calculateCustomerPrice(wholesalePrice) {
  if (wholesalePrice <= 100) {
    return Math.round(wholesalePrice * 3); // 200% ربح
  } else if (wholesalePrice <= 200) {
    return Math.round(wholesalePrice * 2.5); // 150% ربح
  } else if (wholesalePrice <= 500) {
    return Math.round(wholesalePrice * 2); // 100% ربح
  } else if (wholesalePrice <= 1000) {
    return Math.round(wholesalePrice * 1.3); // 30% ربح
  } else if (wholesalePrice <= 2000) {
    return Math.round(wholesalePrice * 1.3); // 30% ربح
  } else if (wholesalePrice <= 2900) {
    return Math.round(wholesalePrice * 1.2); // 20% ربح
  } else if (wholesalePrice <= 4000) {
    return Math.round(wholesalePrice * 1.15); // 15% ربح
  } else {
    return Math.round(wholesalePrice * 1.1); // 10% ربح
  }
}

async function updatePrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات');

    const products = await Product.find();
    console.log(`\n📦 تم العثور على ${products.length} منتج\n`);

    let updated = 0;
    for (const product of products) {
      const oldPrice = product.suggested_price;
      const newPrice = calculateCustomerPrice(product.wholesale_price);
      
      if (oldPrice !== newPrice) {
        product.suggested_price = newPrice;
        await product.save();
        updated++;
        console.log(`✓ ${product.name}:`);
        console.log(`  سعر الجملة: ${product.wholesale_price} دج`);
        console.log(`  السعر القديم: ${oldPrice} دج`);
        console.log(`  السعر الجديد: ${newPrice} دج\n`);
      }
    }

    console.log(`\n✅ تم تحديث ${updated} منتج من ${products.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

updatePrices();
