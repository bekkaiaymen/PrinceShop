# Vercel Deployment Instructions 🚀

## الملف الحالي غير صحيح - اتبع التعليمات التالية:

### ⚠️ المشكلة:
Vercel يحاول نشر المشروع الكامل (backend + frontend) لكن يجب نشر Frontend فقط.

### ✅ الحل:

#### الطريقة 1: النشر من مجلد Frontend فقط (موصى به)

1. **في إعدادات Vercel Project:**
   - اذهب إلى Dashboard → Your Project → Settings
   - في قسم "Root Directory"
   - اختر `frontend` كمجلد الجذر
   - احفظ التغييرات

2. **أعد النشر:**
   - اذهب إلى Deployments
   - اضغط على "Redeploy"

#### الطريقة 2: استخدام الأوامر المحلية

```bash
# في مجلد المشروع الرئيسي
cd frontend
vercel --prod
```

### 📋 التكوين الصحيح:

**Framework Preset:** Vite  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`  
**Root Directory:** `frontend` (مهم جداً!)

### 🔧 المتغيرات البيئية المطلوبة في Vercel:

اذهب إلى Settings → Environment Variables وأضف:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_URL=your_backend_url_here
```

### 📝 ملاحظات:

1. **Backend منفصل:**
   - Backend يجب نشره على Render أو Railway أو Heroku
   - لا يمكن نشر Node.js + MongoDB على Vercel مجاناً

2. **بعد نشر Backend:**
   - احصل على رابط Backend (مثلاً: https://your-backend.onrender.com)
   - أضفه كـ `VITE_API_URL` في Vercel Environment Variables
   - أعد النشر

### 🐛 إذا استمرت المشكلة:

```bash
# احذف .vercel من المشروع
rm -rf .vercel

# جرب النشر من جديد
cd frontend
vercel --prod
```

### 📱 للاختبار المحلي:

```bash
cd frontend
npm run build
npm run preview
```

---
**تحديث:** 15 يناير 2026
