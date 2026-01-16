import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import CustomerOrder from './models/CustomerOrder.js';
import User from './models/User.js';
import Owner from './models/Owner.js';
import authRoutes from './routes/auth.js';
import affiliateRoutes from './routes/affiliate.js';
import adminRoutes from './routes/admin.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Check allow list and Vercel/Netlify domains
    const allowed = [
      'http://localhost:3000',
      'http://192.168.1.8:3000',
      'https://prince-shop47.vercel.app',
      'https://prince-shop47.netlify.app', // Netlify Production
      process.env.FRONTEND_URL
    ];

    if (allowed.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    } else {
      console.log('⚠️ CORS blocked:', origin);
      // For development stability, we allow it but log the warning
      return callback(null, true); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
connectDB();

// ============ دالة حساب سعر البيع بناءً على نسب الربح ============
function calculateCustomerPrice(wholesalePrice) {
  if (wholesalePrice <= 100) {
    // من 0 إلى 100: ربح 200% (السعر النهائي = التكلفة × 3)
    return wholesalePrice * 3;
  } else if (wholesalePrice <= 200) {
    // من 100 إلى 200: ربح 150% (السعر النهائي = التكلفة × 2.5)
    return wholesalePrice * 2.5;
  } else if (wholesalePrice <= 500) {
    // من 200 إلى 500: ربح 100% (السعر النهائي = التكلفة × 2)
    return wholesalePrice * 2;
  } else if (wholesalePrice <= 1000) {
    // من 500 إلى 1000: ربح 30% (السعر النهائي = التكلفة × 1.3)
    return wholesalePrice * 1.3;
  } else if (wholesalePrice <= 2000) {
    // من 1000 إلى 2000: ربح 30% (السعر النهائي = التكلفة × 1.3)
    return wholesalePrice * 1.3;
  } else if (wholesalePrice <= 2900) {
    // من 2000 إلى 2900: ربح 20% (السعر النهائي = التكلفة × 1.2)
    return wholesalePrice * 1.2;
  } else if (wholesalePrice <= 4000) {
    // من 2900 إلى 4000: ربح 15% (السعر النهائي = التكلفة × 1.15)
    return wholesalePrice * 1.15;
  } else {
    // أكثر من 4000: ربح 10% (السعر النهائي = التكلفة × 1.1)
    return wholesalePrice * 1.1;
  }
}

// ============ ROUTES ============

// Auth & Affiliate Routes
app.use('/api/auth', authRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/admin', adminRoutes);

// إنشاء طلب جديد
app.post('/api/orders', async (req, res) => {
  try {
    const { productId, customerName, customerPhone, deliveryLocation, deliveryCoordinates, quantity, notes, affiliateCode, deliveryFee, deliveryTime } = req.body;
    
    console.log('Received order data:', req.body);
    
    // التحقق من البيانات المطلوبة
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ error: 'الاسم مطلوب' });
    }
    
    if (!customerPhone || customerPhone.trim() === '') {
      return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
    }
    
    if (!deliveryLocation || deliveryLocation.trim() === '') {
      return res.status(400).json({ error: 'مكان التوصيل مطلوب' });
    }
    
    // جلب معلومات المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    
    // حساب المبلغ الإجمالي (سعر المنتج + التوصيل)
    const productTotal = product.suggested_price * (quantity || 1);
    const totalAmount = productTotal + (deliveryFee || 0);
    
    // البحث عن المسوق إذا تم تقديم رمز المسوق
    let affiliateId = null;
    let affiliateProfit = 0;
    let orderSource = 'direct'; // افتراضياً الطلب مباشر
    
    if (affiliateCode) {
      const affiliate = await User.findOne({ affiliateCode, role: 'affiliate' });
      if (affiliate) {
        affiliateId = affiliate._id;
        affiliateProfit = product.affiliate_profit * (quantity || 1);
        orderSource = 'affiliate'; // الطلب من مسوق
      }
    }
    
    // إنشاء الطلب
    const order = new CustomerOrder({
      customerName,
      customerPhone,
      deliveryLocation,
      deliveryCoordinates: deliveryCoordinates || {},
      product: productId,
      productName: product.name,
      productImage: product.image,
      productPrice: product.suggested_price,
      quantity: quantity || 1,
      totalAmount,
      deliveryFee: deliveryFee || 0,
      deliveryTime: deliveryTime || 'morning',
      notes,
      affiliate: affiliateId,
      affiliateProfit,
      orderSource // إضافة مصدر الطلب
    });
    
    await order.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'حدث خطأ في إرسال الطلب' });
  }
});

// جلب جميع الطلبات (للداشبورد)
app.get('/api/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      CustomerOrder.find(query)
        .populate('product', 'name image sku')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip),
      CustomerOrder.countDocuments(query)
    ]);
    
    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// تحديث حالة الطلب
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await CustomerOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('product');
    
    if (!order) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products (with filters)
app.get('/api/products', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10000, // رفع الحد الأقصى لعرض جميع المنتجات
      active = 'true'
    } = req.query;

    const query = { active: active === 'true' };

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.suggested_price = {};
      if (minPrice) query.suggested_price.$gte = Number(minPrice);
      if (maxPrice) query.suggested_price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip),
      Product.countDocuments(query)
    ]);

    // إضافة customerPrice المحسوب لكل منتج
    const productsWithCustomerPrice = products.map(product => ({
      ...product.toObject(),
      customerPrice: calculateCustomerPrice(product.wholesale_price)
    }));

    // BACKWARD COMPATIBILITY: Send both 'products' (for old frontend) and 'data' (for newer standard)
    // This fixes the issue where cached frontend expects 'products' array but might receive something else
    res.json({
      success: true,
      products: productsWithCustomerPrice, // Old Frontend property
      data: productsWithCustomerPrice,     // New Standard property
      total,
      count: productsWithCustomerPrice.length,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    console.log('📦 Fetching product with ID:', req.params.id);
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      console.log('❌ Product not found with ID:', req.params.id);
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    
    console.log('✅ Product found:', product.name);
    res.json({
      _id: product._id,
      name: product.name,
      imageUrl: product.imageUrl || product.image || '',
      sku: product.sku,
      category: product.category,
      description: product.description || '',
      suggested_price: product.suggested_price,
      wholesale_price: product.wholesale_price,
      affiliate_profit: product.affiliate_profit,
      customerPrice: calculateCustomerPrice(product.wholesale_price),
      active: product.active
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get product by SKU
app.get('/api/products/sku/:sku', async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // إضافة customerPrice المحسوب
    const productWithCustomerPrice = {
      ...product.toObject(),
      customerPrice: calculateCustomerPrice(product.wholesale_price)
    };
    res.json(productWithCustomerPrice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [totalProducts, categories, avgProfit] = await Promise.all([
      Product.countDocuments({ active: true }),
      Product.distinct('category'),
      Product.aggregate([
        { $match: { active: true } },
        { $group: { _id: null, avgProfit: { $avg: '$affiliate_profit' } } }
      ])
    ]);

    res.json({
      totalProducts,
      totalCategories: categories.length,
      categories,
      avgProfit: avgProfit[0]?.avgProfit || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ OWNER ROUTES ============

// تسجيل صاحب الموقع (للمرة الأولى فقط)
app.post('/api/owner/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    
    // التحقق من عدم وجود مالك مسجل
    const existingOwner = await Owner.findOne();
    if (existingOwner) {
      return res.status(400).json({ error: 'المالك مسجل مسبقاً' });
    }
    
    const owner = new Owner({ username, password, email, phone });
    await owner.save();
    
    const token = jwt.sign({ ownerId: owner._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      token,
      owner: {
        id: owner._id,
        username: owner.username,
        email: owner.email,
        phone: owner.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تسجيل دخول صاحب الموقع
app.post('/api/owner/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const owner = await Owner.findOne({ username });
    if (!owner) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    
    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    
    const token = jwt.sign({ ownerId: owner._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      token,
      owner: {
        id: owner._id,
        username: owner.username,
        email: owner.email,
        phone: owner.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// جلب جميع الطلبات لصاحب الموقع
app.get('/api/owner/orders', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, orderSource, search, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // فلتر حسب الحالة
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // فلتر حسب المصدر (مباشر أو من مسوق)
    if (orderSource && orderSource !== 'all') {
      query.orderSource = orderSource;
    }
    
    // بحث في اسم الزبون أو رقم الهاتف
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // فلتر حسب التاريخ
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const [orders, total] = await Promise.all([
      CustomerOrder.find(query)
        .populate('product', 'name image sku price wholesalePrice')
        .populate('affiliate', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip),
      CustomerOrder.countDocuments(query)
    ]);
    
    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching owner orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// جلب إحصائيات صاحب الموقع
app.get('/api/owner/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    
    // إجمالي الطلبات
    const totalOrders = await CustomerOrder.countDocuments(dateQuery);
    
    // الطلبات المباشرة
    const directOrders = await CustomerOrder.countDocuments({ ...dateQuery, orderSource: 'direct' });
    
    // الطلبات عبر المسوقين
    const affiliateOrders = await CustomerOrder.countDocuments({ ...dateQuery, orderSource: 'affiliate' });
    
    // إجمالي المبيعات
    const salesData = await CustomerOrder.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalDeliveryFees: { $sum: '$deliveryFee' },
          totalAffiliatePayments: { $sum: '$affiliateProfit' }
        }
      }
    ]);
    
    const stats = salesData[0] || { totalRevenue: 0, totalDeliveryFees: 0, totalAffiliatePayments: 0 };
    
    // صافي الربح = إجمالي المبيعات + رسوم التوصيل - مدفوعات المسوقين
    const netProfit = stats.totalRevenue + stats.totalDeliveryFees - stats.totalAffiliatePayments;
    
    // الطلبات حسب الحالة
    const ordersByStatus = await CustomerOrder.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // أكثر المسوقين نشاطاً
    const topAffiliates = await CustomerOrder.aggregate([
      { $match: { ...dateQuery, orderSource: 'affiliate' } },
      {
        $group: {
          _id: '$affiliate',
          ordersCount: { $sum: 1 },
          totalCommission: { $sum: '$affiliateProfit' }
        }
      },
      { $sort: { ordersCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'affiliateInfo'
        }
      },
      { $unwind: '$affiliateInfo' }
    ]);
    
    // المنتجات الأكثر مبيعاً
    const topProducts = await CustomerOrder.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$product',
          totalSold: { $sum: '$quantity' },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' }
    ]);
    
    res.json({
      overview: {
        totalOrders,
        directOrders,
        affiliateOrders,
        totalRevenue: stats.totalRevenue,
        totalDeliveryFees: stats.totalDeliveryFees,
        totalAffiliatePayments: stats.totalAffiliatePayments,
        netProfit
      },
      ordersByStatus,
      topAffiliates,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching owner statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check - Also serves as a keep-alive endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// ROOT endpoint - Important for Render health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'Backend is running!', 
    version: '2.0',
    timestamp: new Date(),
    endpoints: ['/api/products', '/api/orders', '/api/health']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.8:${PORT}`);
});
