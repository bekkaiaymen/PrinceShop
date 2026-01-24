import express from 'express';
import User from '../models/User.js';
import CustomerOrder from '../models/CustomerOrder.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Middleware للتحقق من صلاحيات الأدمن
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({ message: 'غير مصرح لك بالوصول - أدمن فقط' });
  }
};

// استخدام الحماية والتحقق من الأدمن
router.use(protect, adminOnly);

// الحصول على جميع الطلبات مع معلومات المسوقين
router.get('/orders', async (req, res) => {
  try {
    const { status, affiliate, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (affiliate) query.affiliate = affiliate;
    
    const orders = await CustomerOrder.find(query)
      .populate('product', 'name image sku')
      .populate('affiliate', 'name affiliateCode phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CustomerOrder.countDocuments(query);
    
    res.json({
      success: true,
      orders,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// الحصول على إحصائيات المسوقين
router.get('/affiliates', async (req, res) => {
  try {
    const affiliates = await User.find({ role: 'affiliate' })
      .select('name affiliateCode phone email city createdAt');
    
    // حساب إحصائيات كل مسوق
    const affiliatesWithStats = await Promise.all(
      affiliates.map(async (affiliate) => {
        const orders = await CustomerOrder.find({ affiliate: affiliate._id });
        const totalOrders = orders.length;
        const totalProfit = orders.reduce((sum, order) => sum + (order.affiliateProfit || 0), 0);
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
        
        return {
          ...affiliate.toObject(),
          totalOrders,
          totalProfit,
          deliveredOrders,
          conversionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0
        };
      })
    );
    
    // ترتيب حسب الأرباح
    affiliatesWithStats.sort((a, b) => b.totalProfit - a.totalProfit);
    
    res.json({
      success: true,
      affiliates: affiliatesWithStats,
      total: affiliatesWithStats.length
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// الحصول على تفاصيل مسوق محدد
router.get('/affiliates/:id', async (req, res) => {
  try {
    const affiliate = await User.findById(req.params.id)
      .select('-password');
    
    if (!affiliate) {
      return res.status(404).json({ message: 'المسوق غير موجود' });
    }
    
    const orders = await CustomerOrder.find({ affiliate: affiliate._id })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    
    const stats = {
      totalOrders: orders.length,
      totalProfit: orders.reduce((sum, o) => sum + (o.affiliateProfit || 0), 0),
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length
    };
    
    res.json({
      success: true,
      affiliate,
      stats,
      orders
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// الإحصائيات العامة
router.get('/stats', async (req, res) => {
  try {
    const [totalOrders, totalAffiliates, totalProducts, orders] = await Promise.all([
      CustomerOrder.countDocuments(),
      User.countDocuments({ role: 'affiliate' }),
      Product.countDocuments(),
      CustomerOrder.find()
    ]);
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalAffiliateProfit = orders.reduce((sum, o) => sum + (o.affiliateProfit || 0), 0);
    
    const statusBreakdown = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipping: orders.filter(o => o.status === 'shipping').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalAffiliates,
        totalProducts,
        totalRevenue,
        totalAffiliateProfit,
        netProfit: totalRevenue - totalAffiliateProfit,
        statusBreakdown
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// تحديث حالة طلب
router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await CustomerOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('product').populate('affiliate');
    
    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// حذف طلب
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await CustomerOrder.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }
    
    res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
