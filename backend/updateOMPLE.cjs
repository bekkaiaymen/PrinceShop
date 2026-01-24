const mongoose = require('mongoose');
require('dotenv').config();

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  wholesale_price: Number,
  suggested_price: Number,
  affiliate_profit: Number,
  image: String,
  description: String
});

const Product = mongoose.model('Product', productSchema);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  // BAFFLE products
  const baffleProducts = await Product.find({ name: /^BAFFLE/i });
  console.log(`\nFound ${baffleProducts.length} products starting with BAFFLE:`);
  baffleProducts.forEach(p => console.log(`- ${p.name} (Current: ${p.category})`));
  
  const baffleResult = await Product.updateMany(
    { name: /^BAFFLE/i },
    { $set: { category: 'مكبرات الصوت' } }
  );
  console.log(`\n✅ Updated ${baffleResult.modifiedCount} BAFFLE products to "مكبرات الصوت"`);
  
  // OMPLE products
  const ompleProducts = await Product.find({ name: /^OMPLE/i });
  console.log(`\nFound ${ompleProducts.length} products starting with OMPLE:`);
  ompleProducts.forEach(p => console.log(`- ${p.name} (Current: ${p.category})`));
  
  const ompleResult = await Product.updateMany(
    { name: /^OMPLE/i },
    { $set: { category: 'مكبرات الصوت' } }
  );
  console.log(`\n✅ Updated ${ompleResult.modifiedCount} OMPLE products to "مكبرات الصوت"`);
  
  // Verification
  const allSpeakers = await Product.find({ 
    $or: [{ name: /^BAFFLE/i }, { name: /^OMPLE/i }] 
  });
  console.log(`\nTotal products in مكبرات الصوت: ${allSpeakers.length}`);
  allSpeakers.forEach(p => console.log(`- ${p.name} → ${p.category}`));
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
