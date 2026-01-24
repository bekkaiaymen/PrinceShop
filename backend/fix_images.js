import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB متصل'))
  .catch(err => console.error('❌ خطأ في الاتصال:', err));

async function fixProductImages() {
  try {
    // جلب جميع المنتجات
    const products = await Product.find().sort({ _id: 1 });
    console.log(`\n📦 عدد المنتجات في قاعدة البيانات: ${products.length}\n`);

    let updatedCount = 0;
    let pageNum = 1;
    let imageNumOnPage = 2;  // نبدأ من 02 في كل صفحة
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const oldImage = product.image;
      
      // تكوين اسم الصورة
      const newImage = `/products/product_${String(pageNum).padStart(3, '0')}_${String(imageNumOnPage).padStart(2, '0')}.jpeg`;
      
      // تحديث فقط إذا كان هناك تغيير
      if (oldImage !== newImage) {
        product.image = newImage;
        await product.save();
        updatedCount++;
        
        if (updatedCount <= 20) {  // نعرض أول 20 فقط
          console.log(`✓ ${product.name.substring(0, 40)}...`);
          console.log(`  من: ${oldImage}`);
          console.log(`  إلى: ${newImage}\n`);
        }
      }
      
      // الانتقال للصورة التالية
      imageNumOnPage++;
      
      // إذا وصلنا إلى 11، ننتقل للصفحة التالية
      if (imageNumOnPage > 11) {
        pageNum++;
        imageNumOnPage = 2;
      }
    }
    
    console.log(`\n✅ تم تحديث ${updatedCount} منتج`);
    console.log(`📝 إجمالي المنتجات: ${products.length}`);
    
    // عرض إحصائيات
    const withImages = await Product.countDocuments({ 
      image: { $regex: /^\/products\/product_\d+_\d+\.jpeg$/ }
    });
    const withPlaceholder = await Product.countDocuments({ 
      image: '/products/placeholder.png'
    });
    
    console.log(`\n📊 الإحصائيات:`);
    console.log(`   - منتجات لديها صور: ${withImages}`);
    console.log(`   - منتجات بصورة افتراضية: ${withPlaceholder}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 تم قطع الاتصال بقاعدة البيانات');
  }
}

fixProductImages();
