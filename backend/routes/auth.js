import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// توليد JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// تسجيل مسوق جديد
router.post('/register', async (req, res) => {
  try {
    const { name, password, phone, telegram, city } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });
    }
    
    // إنشاء مسوق جديد
    const user = await User.create({
      name,
      password,
      phone,
      telegram,
      city,
      role: 'affiliate'
    });
    
    const token = signToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        affiliateCode: user.affiliateCode
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال رقم الهاتف وكلمة المرور' });
    }
    
    const user = await User.findOne({ phone }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'حسابك معطل، تواصل مع الإدارة' });
    }
    
    const token = signToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        affiliateCode: user.affiliateCode
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// الحصول على معلومات المستخدم الحالي
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// تحديث الملف الشخصي
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, phone, city, paymentInfo } = req.body;
    
    // استخدام طريقة save() لضمان تحديث الكائنات المتداخلة
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    
    if (paymentInfo) {
      // التأكد من تهيئة paymentInfo
      if (!user.paymentInfo) user.paymentInfo = {};

      if (paymentInfo.baridimob) {
        if (!user.paymentInfo.baridimob) user.paymentInfo.baridimob = {};
        if (paymentInfo.baridimob.rip !== undefined) user.paymentInfo.baridimob.rip = paymentInfo.baridimob.rip;
        if (paymentInfo.baridimob.accountHolder !== undefined) user.paymentInfo.baridimob.accountHolder = paymentInfo.baridimob.accountHolder;
      }

      if (paymentInfo.cash) {
        if (!user.paymentInfo.cash) user.paymentInfo.cash = {};
        if (paymentInfo.cash.location !== undefined) user.paymentInfo.cash.location = paymentInfo.cash.location;
        if (paymentInfo.cash.details !== undefined) user.paymentInfo.cash.details = paymentInfo.cash.details;
      }
      
      // Mark as modified explicitly to be safe
      user.markModified('paymentInfo');
    }
    
    const updatedUser = await user.save();
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// تغيير كلمة المرور
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    user.password = newPassword;
    await user.save();
    
    const token = signToken(user._id);
    
    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
