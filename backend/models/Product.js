import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  wholesale_price: {
    type: Number,
    required: true,
    min: 0,
  },
  suggested_price: {
    type: Number,
    required: true,
    min: 0,
  },
  affiliate_profit: {
    type: Number,
    required: true,
    min: 0,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  packaging: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    default: '',
  },
  imageSource: {
    type: String,
    enum: ['unsplash', 'google', 'manual', 'placeholder', 'pdf'],
    default: 'placeholder',
  },
}, {
  timestamps: true,
});

// Indexes for performance
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ active: 1 });
productSchema.index({ sku: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
