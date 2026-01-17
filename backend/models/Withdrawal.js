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
    enum: ['baridimob', 'cash'],
    required: true
  },
  
  paymentDetails: {
    // \u0644\u0628\u0631\u064a\u062f\u064a \u0645\u0648\u0628
    baridimob: {
      rip: String,
      accountHolder: String
    },
    // \u0646\u0642\u062f\u064a
    cash: {
      location: String,
      details: String
    }
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
