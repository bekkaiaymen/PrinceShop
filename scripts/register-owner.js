// Script لتسجيل صاحب الموقع للمرة الأولى
// استخدم هذا السكريبت مرة واحدة فقط لإنشاء حساب المالك

const API_URL = 'https://princeshop-backend.onrender.com/api';
// أو للتطوير المحلي: 'http://localhost:5000/api'

async function registerOwner() {
  const ownerData = {
    username: 'admin',           // غير هذا
    password: 'Admin@123',       // غير هذا إلى كلمة مرور قوية
    email: 'admin@princeshop.com', // غير هذا
    phone: '0664021599'
  };

  try {
    const response = await fetch(`${API_URL}/owner/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ownerData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ تم تسجيل صاحب الموقع بنجاح!');
      console.log('Token:', data.token);
      console.log('Owner Data:', data.owner);
      console.log('\n🔑 يمكنك الآن تسجيل الدخول من:');
      console.log('https://prince-shop47.netlify.app/owner/login');
    } else {
      console.error('❌ خطأ في التسجيل:', data.error);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
  }
}

// تشغيل الدالة
registerOwner();
