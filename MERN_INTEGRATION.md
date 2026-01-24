# دليل دمج الأداة مع موقعك (MERN Stack)

بما أنك تستخدم MERN Stack (MongoDB, Express, React, Node.js) وموقعك مستضاف على Cloudflare Pages (`princeshop.pages.dev`)، فهذا يعني أن **الواجهة الأمامية (Frontend)** مفصولة عن **الخلفية (Backend)**.

هذه الأداة (`MyAdFinder`) هي تطبيق **Backend (Node.js)** لأنها تتعامل مع الملفات. لا يمكن تشغيلها مباشرة على Cloudflare Pages (الذي يستضيف ملفات ثابتة فقط).

إليك أفضل 3 طرق لدمجها:

---

### الطريقة 1: التشغيل كخدمة مستقلة (الأسهل والأسرع) ✅
هذه الطريقة لا تتطلب تعديل كود موقعك الحالي كثيراً.

1. **ارفع مجلد `ad_analysis_tool`** إلى استضافة تدعم Node.js (مثل **Render** أو **Railway** أو **Replit**).
2. ستحصل على رابط جديد (مثلاً: `https://my-ad-tool.onrender.com`).
3. في موقعك الأصلي (React)، قم بإنشاء صفحة جديدة "تحليل الإعلانات" واستخدم الكود التالي للاتصال بالأداة:

```jsx
// React Component Example
import React, { useState } from 'react';

const AdAnalyzer = () => {
  const [loading, setLoading] = useState(false);
  
  // استبدل هذا برابط الأداة الذي حصلت عليه من Replit/Render
  const TOOL_API_URL = "https://your-tool-url.com/api/analyze"; 

  const handleAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(TOOL_API_URL, { method: 'POST' });
      const data = await response.json();
      alert(`تم التحليل! وجدنا ${data.count} منتج رابح.`);
      // يمكنك هنا توجيه المستخدم لصفحة النتائج
      window.open("https://your-tool-url.com/dashboard", "_blank");
    } catch (error) {
      alert("حدث خطأ في الاتصال بالأداة");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded shadow">
      <h3>🔍 MyAdFinder</h3>
      <p>اضغط للبحث عن المنتجات الرابحة الجديدة</p>
      <button 
        onClick={handleAnalysis} 
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "جاري التحليل..." : "بحث الآن"}
      </button>
    </div>
  );
};

export default AdAnalyzer;
```

---

### الطريقة 2: دمج الكود داخل الـ Backend الخاص بك (للمحترفين) 🛠️
إذا كان لديك سيرفر Express قائم بالفعل (مثلاً على Heroku أو VPS)، يمكنك نسخ منطق الملف `scraper.js` داخله.

1. انسخ دوال التحليل (مثل `analyzeInputFolder` و `parsePost`) من `scraper.js` إلى ملف جديد في الـ Backend الخاص بك (مثلاً `controllers/adController.js`).
2. أنشئ Route جديد في Express:

```javascript
// في ملف routes/api.js
router.get('/analyze-ads', async (req, res) => {
  try {
    const results = await analyzeAdsLogic(); // دالتك المستوردة
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### نصيحة هامة بخصوص الهاتف 📱
بما أنك تريد استخدامها من الهاتف:
* استخدم **الطريقة الأولى (Replit)** لأنها تعطيك لوحة تحكم جاهزة وتعمل فوراً دون الحاجة لبرمجة معقدة.
* فقط ادخل على Replit، شغل الأداة، وانسخ الرابط لفتحه في متصفح هاتفك.
