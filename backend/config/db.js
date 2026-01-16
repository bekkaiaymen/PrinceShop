import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // خيارات لتحسين الأداء والثبات ( Mongoose 6+ default options are mostly good)
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Connected Professionally: ${conn.connection.host}`);
    
    // مراقبة أحداث الاتصال
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection disconnected. Retrying...');
    });

  } catch (error) {
    console.error(`❌ Error Config DB: ${error.message}`);
    process.exit(1); // إيقاف السيرفر في حال فشل الاتصال بقاعدة البيانات
  }
};

export default connectDB;
