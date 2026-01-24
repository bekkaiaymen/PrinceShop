import express from 'express';
import User from './models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// الاتصال بقاعدة البيانات
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ MongoDB Connected');

// بيانات الأدمن
const adminData = {
  name: 'المدير',
  email: 'admin@ghardaia.com',
  password: 'admin123456', // غيّر هذا!
  phone: '0555000000',
  role: 'admin',
  isAdmin: true,
  affiliateCode: 'ADMIN-001'
};

try {
  // التحقق من وجود الأدمن
  const existingAdmin = await User.findOne({ email: adminData.email });
  
  if (existingAdmin) {
    console.log('⚠️  الأدمن موجود بالفعل!');
    console.log('البريد الإلكتروني:', existingAdmin.email);
  } else {
    // إنشاء الأدمن
    const admin = await User.create(adminData);
    console.log('✅ تم إنشاء حساب الأدمن بنجاح!');
    console.log('----------------------------');
    console.log('البريد الإلكتروني:', admin.email);
    console.log('كلمة المرور:', adminData.password);
    console.log('----------------------------');
    console.log('🔗 رابط تسجيل الدخول: http://192.168.1.8:3000/login');
    console.log('🔗 لوحة تحكم الأدمن: http://192.168.1.8:3000/admin');
  }
} catch (error) {
  console.error('❌ خطأ:', error.message);
}

process.exit();
