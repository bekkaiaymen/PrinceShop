import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الرجاء إدخال الاسم'],
    trim: true
  },
  email: {
    type: String,
    // unique: true,  // تم إزالة unique لأنه اختياري ويسبب مشكلة null duplicate
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'الرجاء إدخال كلمة المرور'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'الرجاء إدخال رقم الهاتف'],
    unique: true,
    trim: true
  },
  telegram: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['affiliate', 'admin'],
    default: 'affiliate'
  },
  
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // معلومات المسوق
  affiliateCode: {
    type: String,
    unique: true,
    sparse: true // للسماح بـ null للـ admin
  },
  city: {
    type: String,
    default: ''
  },
  
  // معلومات الدفع
  paymentInfo: {
    // معلومات بريدي موب
    baridimob: {
      rip: { type: String, default: '' },
      accountHolder: { type: String, default: '' }
    },
    // معلومات الدفع النقدي
    cash: {
      location: { type: String, default: '' },
      details: { type: String, default: '' }
    }
  },
  
  // الأرباح
  earnings: {
    total: { type: Number, default: 0 },      // إجمالي الأرباح
    available: { type: Number, default: 0 },  // قابل للسحب
    pending: { type: Number, default: 0 },    // معلق (طلبات قيد التوصيل)
    withdrawn: { type: Number, default: 0 }   // تم سحبه
  },
  
  // إحصائيات
  stats: {
    totalOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    canceledOrders: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// توليد كود المسوق قبل الحفظ
userSchema.pre('save', async function(next) {
  if (this.role === 'affiliate' && !this.affiliateCode) {
    // توليد كود فريد من الاسم + رقم عشوائي
    const baseName = this.name.toLowerCase().replace(/\s+/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.affiliateCode = `${baseName}${randomNum}`;
    
    // التأكد من عدم التكرار
    const exists = await mongoose.models.User.findOne({ affiliateCode: this.affiliateCode });
    if (exists) {
      this.affiliateCode = `${baseName}${randomNum + Math.floor(Math.random() * 100)}`;
    }
  }
  next();
});

// مقارنة كلمة المرور
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// حساب نسبة التحويل
userSchema.methods.getConversionRate = function() {
  if (this.stats.totalOrders === 0) return 0;
  return ((this.stats.deliveredOrders / this.stats.totalOrders) * 100).toFixed(2);
};

export default mongoose.model('User', userSchema);
