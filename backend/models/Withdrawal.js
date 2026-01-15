import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  affiliate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  amount: {
    type: Number,
    required: [true, 'المبلغ مطلوب'],
    min: [100, 'الحد الأدنى للسحب 100 دج']
  },
  
  paymentMethod: {
    type: String,
    enum: ['bank', 'ccp', 'baridimob', 'cash'],
    required: true
  },
  
  paymentDetails: {
    accountHolder: String,
    accountNumber: String,
    bankName: String
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  
  notes: {
    type: String,
    default: ''
  },
  
  adminNotes: {
    type: String,
    default: ''
  },
  
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  processedAt: Date,
  completedAt: Date
  
}, {
  timestamps: true
});

withdrawalSchema.index({ affiliate: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Withdrawal', withdrawalSchema);
