import mongoose from 'mongoose';

const customerOrderSchema = new mongoose.Schema({
  // معلومات الزبون
  customerName: {
    type: String,
    required: [true, 'الاسم مطلوب']
  },
  customerPhone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب']
  },
  deliveryLocation: {
    type: String,
    required: [true, 'مكان التوصيل مطلوب']
  },
  deliveryCoordinates: {
    lat: { type: Number },
    lng: { type: Number },
    method: { type: String, enum: ['current', 'manual', ''], default: '' }
  },
  
  // معلومات المنتج
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  productImage: String,
  productPrice: Number,
  
  // الكمية والمبلغ
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // حالة الطلب
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // ملاحظات
  notes: String,
  
  // المسوق (اختياري)
  affiliate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // ربح المسوق من هذا الطلب
  affiliateProfit: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const CustomerOrder = mongoose.model('CustomerOrder', customerOrderSchema);

export default CustomerOrder;
