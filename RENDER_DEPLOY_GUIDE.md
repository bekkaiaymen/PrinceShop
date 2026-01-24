# 🚀 نشر Backend على Render.com

## ✅ الملفات جاهزة للنشر!

---

## 📋 خطوات النشر (10 دقائق):

### 1️⃣ إنشاء حساب على Render

1. اذهب إلى: https://render.com/
2. اضغط **"Get Started"**
3. سجل دخول بحساب GitHub (نفس حساب المشروع)
4. اسمح لـ Render بالوصول للمشروع

---

### 2️⃣ إنشاء Web Service جديد

1. من Dashboard، اضغط **"New +"**
2. اختر **"Web Service"**
3. اختر Repository: **PrinceShop**
4. اضغط **"Connect"**

---

### 3️⃣ إعدادات الخدمة

املأ الحقول التالية:

```
Name:                 princeshop-backend
Region:              Frankfurt (EU Central)
Branch:              main
Root Directory:      backend           👈 مهم جداً!
Runtime:             Node
Build Command:       npm install
Start Command:       npm start
Plan:                Free
```

---

### 4️⃣ إضافة Environment Variables

اضغط على **"Advanced"** ثم أضف:

```
Key: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/princeshop?retryWrites=true&w=majority
```

```
Key: JWT_SECRET
Value: your-super-secret-jwt-key-2026-princeshop
```

```
Key: NODE_ENV
Value: production
```

```
Key: PORT
Value: 10000
```

---

### 5️⃣ إنشاء قاعدة بيانات MongoDB

#### الخيار 1: MongoDB Atlas (موصى به - مجاني)

1. اذهب: https://www.mongodb.com/cloud/atlas/register
2. أنشئ حساب مجاني
3. Create New Cluster → Free Tier (M0)
4. Region: Frankfurt
5. Create Cluster
6. Database Access → Add New User:
   - Username: `princeshop`
   - Password: (أنشئ كلمة سر قوية)
7. Network Access → Add IP: `0.0.0.0/0` (للسماح لـ Render)
8. Connect → Drivers → Copy Connection String
9. استبدل `<password>` بكلمة السر

#### الخيار 2: استخدام MongoDB على Render

أو انتظر حتى أكمل النشر ثم سأساعدك في MongoDB!

---

### 6️⃣ إنشاء الخدمة

1. اضغط **"Create Web Service"**
2. انتظر 2-3 دقائق (Building...)
3. عند الانتهاء سيظهر: **"Live"** ✅

---

### 7️⃣ احصل على رابط Backend

بعد النشر ستحصل على رابط مثل:
```
https://princeshop-backend.onrender.com
```

---

### 8️⃣ ربط Frontend بـ Backend

سأساعدك في ربطهم بعد النشر!

---

## 🎯 الإعدادات الكاملة للنسخ السريع:

```
Name: princeshop-backend
Region: Frankfurt (EU Central)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free

Environment Variables:
- MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/princeshop
- JWT_SECRET = your-secret-key-here
- NODE_ENV = production
- PORT = 10000
```

---

## 📝 ملاحظات مهمة:

1. **Root Directory**: يجب أن يكون `backend` (ليس فارغاً!)
2. **MongoDB**: احتفظ بكلمة السر في مكان آمن
3. **Free Plan**: يدخل في Sleep Mode بعد عدم الاستخدام (يستيقظ تلقائياً)
4. **First Deploy**: قد يأخذ 2-5 دقائق

---

## ✅ الخطوة التالية:

بعد نشر Backend، سأساعدك في:
1. ربط Frontend (Vercel) بـ Backend (Render)
2. تحديث متغيرات البيئة
3. اختبار الاتصال

---

**هل أنت جاهز للبدء؟** 🚀
