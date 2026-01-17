import mongoose from 'mongoose';
import Product from './backend/models/Product.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function updateOMPLEProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // البحث عن المنتجات التي تبدأ بـ OMPLE
    const products = await Product.find({ name: /^OMPLE/i });
    
    console.log(`\nFound ${products.length} products starting with OMPLE:`);
    products.forEach(p => {
      console.log(`- ${p.name} (Current category: ${p.category})`);
    });

    // تحديث الفئة إلى "مكبرات الصوت"
    const result = await Product.updateMany(
      { name: /^OMPLE/i },
      { $set: { category: 'مكبرات الصوت' } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} products to category "مكبرات الصوت"`);

    // التحقق من التحديث
    const updatedProducts = await Product.find({ name: /^OMPLE/i });
    console.log('\nUpdated products:');
    updatedProducts.forEach(p => {
      console.log(`- ${p.name} → ${p.category}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateOMPLEProducts();
