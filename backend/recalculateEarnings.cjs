const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas directly
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  affiliateCode: String,
  earnings: {
    total: Number,
    available: Number,
    pending: Number,
    withdrawn: Number
  }
});

const orderSchema = new mongoose.Schema({
  affiliate: mongoose.Schema.Types.ObjectId,
  affiliateProfit: Number,
  status: String
});

const User = mongoose.model('User', userSchema);
const CustomerOrder = mongoose.model('CustomerOrder', orderSchema);

async function recalculateEarnings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const affiliates = await User.find({ role: 'affiliate' });
    
    for (const affiliate of affiliates) {
      console.log(`\n===== ${affiliate.name} (${affiliate.affiliateCode}) =====`);
      console.log(`Current earnings:`, affiliate.earnings);

      // حساب الأرباح من الصفر
      const orders = await CustomerOrder.find({ affiliate: affiliate._id });
      
      let pending = 0;
      let available = 0;
      let total = 0;

      orders.forEach(order => {
        const profit = order.affiliateProfit || 0;
        
        if (order.status === 'delivered') {
          available += profit;
          total += profit;
        } else if (order.status !== 'cancelled') {
          pending += profit;
        }
      });

      console.log(`\nRecalculated from orders:`);
      console.log(`- Total orders: ${orders.length}`);
      console.log(`- Pending: ${pending} دج`);
      console.log(`- Available: ${available} دج`);
      console.log(`- Total: ${total} دج`);
      console.log(`- Withdrawn: ${affiliate.earnings.withdrawn} دج (no change)`);

      // تحديث الأرباح
      affiliate.earnings.pending = pending;
      affiliate.earnings.available = available - affiliate.earnings.withdrawn;
      affiliate.earnings.total = total;
      
      await affiliate.save();
      
      console.log(`\n✅ Updated earnings:`, affiliate.earnings);
    }

    console.log('\n\n🎉 All earnings recalculated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

recalculateEarnings();
