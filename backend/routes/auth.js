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
      user
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

    // إعادة جلب المستخدم بدون كلمة المرور لضمان عودة جميع الحقول (مثل paymentInfo)
    const validUser = await User.findById(user._id);
    
    res.json({
      success: true,
      token,
      user: validUser
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// الحصول على معلومات المستخدم الحالي
router.get('/me', protect, async (req, res) => {
  // إعادة جلب المستخدم للتأكد من الحصول على أحدث البيانات
  const user = await User.findById(req.user._id);
  
  if (user && user.paymentInfo) {
      console.log('GET /me - User Payment Info for ' + user.name, user.paymentInfo);
  } else {
      console.log('GET /me - No Payment Info for ' + user?.name);
  }

  res.json({
    success: true,
    user
  });
});

// تحديث الملف الشخصي
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, phone, city, paymentInfo } = req.body;
    
    // استخدام $set مع النقاط . للوصول للحقول المتداخلة مباشرة
    // هذا يحل مشاكل Mongoose مع الكائنات المتداخلة
    const updates = {};
    
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (city) updates.city = city;
    
    if (paymentInfo) {
      if (paymentInfo.baridimob) {
        if (paymentInfo.baridimob.rip !== undefined) 
          updates['paymentInfo.baridimob.rip'] = paymentInfo.baridimob.rip;
        if (paymentInfo.baridimob.accountHolder !== undefined) 
          updates['paymentInfo.baridimob.accountHolder'] = paymentInfo.baridimob.accountHolder;
      }

      if (paymentInfo.cash) {
        if (paymentInfo.cash.location !== undefined) 
          updates['paymentInfo.cash.location'] = paymentInfo.cash.location;
        if (paymentInfo.cash.details !== undefined) 
          updates['paymentInfo.cash.details'] = paymentInfo.cash.details;
      }
    }
    
    console.log('Sending updates to MongoDB:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    // التأكد من أن البيانات عادت بشكل صحيح
    const finalUser = await User.findById(req.user._id);

    res.json({
      success: true,
      user: finalUser
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
