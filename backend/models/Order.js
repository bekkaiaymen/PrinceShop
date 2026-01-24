import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // معلومات المسوق
  affiliate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  affiliateCode: {
    type: String,
    required: true
  },
  
  // معلومات الزبون
  customer: {
    name: {
      type: String,
      required: [true, 'اسم الزبون مطلوب']
    },
    phone: {
      type: String,
      required: [true, 'رقم هاتف الزبون مطلوب']
    },
    address: {
      type: String,
      required: [true, 'عنوان الزبون مطلوب']
    },
    city: {
      type: String,
      required: [true, 'المدينة مطلوبة']
    }
  },
  
  // معلومات المنتج (snapshot لحظة الطلب)
  product: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    image: String,
    sku: String
  },
  
  // الأسعار (snapshot لحظة الطلب - مهم!)
  pricing: {
    wholesalePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    ourCommission: { type: Number, default: 0 },
    affiliateProfit: { type: Number, required: true }
  },
  
  // حالة الطلب
  status: {
    type: String,
    enum: ['new', 'confirmed', 'shipped', 'delivered', 'canceled', 'returned'],
    default: 'new'
  },
  
  // ملاحظات
  notes: {
    type: String,
    default: ''
  },
  
  // تفاصيل التتبع
  tracking: {
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    canceledAt: Date,
    cancelReason: String
  },
  
  // مدفوع للمسوق؟
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date
  
}, {
  timestamps: true
});

// فهرسة للبحث السريع
orderSchema.index({ affiliate: 1, status: 1 });
orderSchema.index({ affiliateCode: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
