import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Withdrawal from '../models/Withdrawal.js';
import { protect, affiliateOnly } from '../middleware/auth.js';

const router = express.Router();

// كل الـ routes محمية ومخصصة للمسوقين فقط
router.use(protect, affiliateOnly);

// Dashboard - الإحصائيات الرئيسية
router.get('/dashboard', async (req, res) => {
  try {
    const affiliate = req.user;
    
    // عدد الطلبات حسب الحالة
    const orderStats = await Order.aggregate([
      { $match: { affiliate: affiliate._id } },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalProfit: { $sum: '$pricing.affiliateProfit' }
        }
      }
    ]);
    
    // تحويل النتائج لشكل أسهل
    const stats = {
      total: 0,
      new: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      canceled: 0,
      returned: 0
    };
    
    orderStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });
    
    res.json({
      success: true,
      data: {
        earnings: affiliate.earnings,
        stats: {
          ...stats,
          conversionRate: affiliate.getConversionRate()
        }
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// قائمة المنتجات مع الأرباح
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({})
      .select('name image sku category suggested_price affiliate_profit')
      .sort({ category: 1, name: 1 });
    
    console.log(`Found ${products.length} products for affiliate ${req.user.affiliateCode}`);
    
    // إضافة رابط التسويق لكل منتج (صفحة الهبوط)
    const productsWithLinks = products.map(product => {
      const roundedPrice = Math.ceil(product.suggested_price / 10) * 10;
      return {
        ...product.toObject(),
        affiliateLink: `${process.env.FRONTEND_URL}/landing/${product._id}?ref=${req.user.affiliateCode}`,
        shareText: `🔥 ${product.name}\n💰 السعر: ${roundedPrice} دج\n📦 توصيل مجاني في غرداية 🏜️\n\n🛒 اطلب الآن:\n${process.env.FRONTEND_URL}/landing/${product._id}?ref=${req.user.affiliateCode}`
      };
    });
    
    res.json({
      success: true,
      count: productsWithLinks.length,
      data: productsWithLinks
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// قائمة الطلبات الخاصة بالمسوق
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { affiliate: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('product.productId', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// طلب سحب
router.post('/withdrawals', async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const affiliate = req.user;
    
    // التحقق من طريقة الدفع
    if (!paymentMethod || !['baridimob', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'الرجاء اختيار طريقة دفع صحيحة' });
    }
    
    // التحقق من وجود معلومات الدفع
    if (paymentMethod === 'baridimob' && !affiliate.paymentInfo?.baridimob?.rip) {
      return res.status(400).json({ message: 'الرجاء ملء معلومات بريدي موب في صفحة الإعدادات' });
    }
    
    if (paymentMethod === 'cash' && !affiliate.paymentInfo?.cash?.location) {
      return res.status(400).json({ message: 'الرجاء ملء معلومات الدفع النقدي في صفحة الإعدادات' });
    }
    
    // التحقق من الرصيد المتاح
    if (amount > affiliate.earnings.available) {
      return res.status(400).json({ 
        message: `الرصيد المتاح غير كافٍ. رصيدك: ${affiliate.earnings.available} دج` 
      });
    }
    
    // الحد الأدنى للسحب
    if (amount < 100) {
      return res.status(400).json({ message: 'الحد الأدنى للسحب 100 دج' });
    }
    
    // تحضير معلومات الدفع
    const paymentDetails = {
      baridimob: paymentMethod === 'baridimob' ? affiliate.paymentInfo.baridimob : undefined,
      cash: paymentMethod === 'cash' ? affiliate.paymentInfo.cash : undefined
    };
    
    // إنشاء طلب السحب بدون خصم من الرصيد
    // سيتم الخصم عند الموافقة من صاحب الموقع
    const withdrawal = await Withdrawal.create({
      affiliate: affiliate._id,
      amount,
      paymentMethod,
      paymentDetails,
      status: 'pending' // قيد المراجعة
    });
    
    res.status(201).json({
      success: true,
      message: 'تم إرسال طلب السحب بنجاح! سيتم مراجعته قريباً.',
      data: withdrawal
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// قائمة السحوبات
router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ affiliate: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: withdrawals.length,
      data: withdrawals
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
