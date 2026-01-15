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
    const { name, email, password, phone, city } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // إنشاء مسوق جديد
    const user = await User.create({
      name,
      email,
      password,
      phone,
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
        email: user.email,
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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
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
        email: user.email,
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
    const { name, phone, city, paymentMethod, paymentDetails } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, city, paymentMethod, paymentDetails },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
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
