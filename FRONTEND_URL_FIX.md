# إصلاح رابط التسويق - تحديث المتغيرات البيئية

## المشكلة
رابط التسويق يستخدم `http://192.168.1.8:3000` بدلاً من الرابط الفعلي `https://prince-shop47.netlify.app`

## الحل: تحديث FRONTEND_URL في Render

### الخطوات:

#### 1. تسجيل الدخول إلى Render
- اذهب إلى: https://dashboard.render.com/
- سجل الدخول بحسابك

#### 2. اختر خدمة الباك إند
- ابحث عن: `princeshop-backend` (أو اسم الخدمة الخاص بك)
- اضغط على اسم الخدمة

#### 3. تحديث المتغيرات البيئية
- في القائمة الجانبية، اضغط على **Environment**
- ابحث عن `FRONTEND_URL`
- قم بتحديث القيمة إلى: `https://prince-shop47.netlify.app`

#### 4. حفظ التغييرات
- اضغط على **Save Changes**
- سيتم إعادة تشغيل الخدمة تلقائياً

### النتيجة المتوقعة:
بعد التحديث، روابط التسويق ستكون:
```
https://prince-shop47.netlify.app/landing/[PRODUCT_ID]?ref=[AFFILIATE_CODE]
```

### مثال:
```
https://prince-shop47.netlify.app/landing/507f1f77bcf86cd799439011?ref=AFF-JOHN123
```

## التحقق من نجاح التحديث

### الطريقة 1: من Dashboard المسوق
1. سجل الدخول كمسوق
2. اذهب إلى قسم "المنتجات"
3. اضغط "نسخ رابط التسويق"
4. الصق الرابط في Notepad
5. تأكد أنه يبدأ بـ `https://prince-shop47.netlify.app`

### الطريقة 2: من API مباشرة
افتح في المتصفح:
```
https://princeshop-backend.onrender.com/api/affiliate/products
```
(مع تسجيل دخول المسوق)

ابحث عن `affiliateLink` في الاستجابة - يجب أن تبدأ بـ `https://prince-shop47.netlify.app`

## ملاحظات مهمة

### متغيرات البيئة المطلوبة في Render:
```
FRONTEND_URL=https://prince-shop47.netlify.app
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### إذا كان لديك domain خاص:
إذا حصلت على دومين مخصص مثل `princeshop.com`، غير `FRONTEND_URL` إلى:
```
FRONTEND_URL=https://princeshop.com
```

## اختبار شامل

بعد التحديث، جرب:
1. انسخ رابط منتج من dashboard المسوق
2. افتح الرابط في متصفح خفي (Incognito)
3. اطلب المنتج
4. تحقق من أن الطلب ظهر في dashboard المسوق
5. تحقق من أن الربح محسوب بشكل صحيح

## الدعم
إذا واجهت مشكلة:
- تأكد من أن Render أعاد تشغيل الخدمة بعد التحديث
- تحقق من logs في Render للتأكد من عدم وجود أخطاء
- امسح cache المتصفح وحاول مرة أخرى
