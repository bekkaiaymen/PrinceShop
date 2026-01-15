import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Order from './models/Order.js';
import CustomerOrder from './models/CustomerOrder.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import affiliateRoutes from './routes/affiliate.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

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
    const { productId, customerName, customerPhone, deliveryLocation, deliveryCoordinates, quantity, notes, affiliateCode } = req.body;
    
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
    
    // حساب المبلغ الإجمالي
    const totalAmount = product.suggested_price * (quantity || 1);
    
    // البحث عن المسوق إذا تم تقديم رمز المسوق
    let affiliateId = null;
    let affiliateProfit = 0;
    if (affiliateCode) {
      const affiliate = await User.findOne({ affiliateCode, role: 'affiliate' });
      if (affiliate) {
        affiliateId = affiliate._id;
        affiliateProfit = product.affiliate_profit * (quantity || 1);
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
      notes,
      affiliate: affiliateId,
      affiliateProfit
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

    res.json({
      products: productsWithCustomerPrice,
      total,
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.8:${PORT}`);
});
