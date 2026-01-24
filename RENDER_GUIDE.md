# دليل النشر على Render (لربطه مع MERN)

بما أنك تستخدم Render، فالأمر سهل جداً لأن السكربت جاهز الآن للعمل عليه.

## الخطوات:

1. **ادخل إلى [Render Dashboard](https://dashboard.render.com/)**.
2. اضغط على **New +** واختر **Web Service**.
3. اربط حساب GitHub الخاص بك واختر المستودع `PrinceShop`.
4. **⚠️ إعدادات مهمة جداً:**
   - **Root Directory:** اكتب `ad_analysis_tool` (هذا مهم جداً لأن الأداة في مجلد فرعي).
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node scraper.js`
5. اضغط **Create Web Service**.

---

## كيف تربطه بموقعك الحالي؟

بمجرد أن يعمل السيرفر على Render، سيغطيك رابطاً مثل:
`https://princeshop-tool.onrender.com`

في كود الـ React الخاص بك (MERN)، استخدم هذا الرابط للتواصل مع الأداة:

```javascript
// مثال على الطلب
fetch('https://princeshop-tool.onrender.com/api/analyze', {
    method: 'POST'
})
.then(response => response.json())
.then(data => console.log(data));
```

## ملاحظة حول الملفات
بما أن Render يستخدم نظام ملفات مؤقت (Ephemeral Filesystem)، فإن الملفات التي ترفعها الأداة قد تُمسح عند إعادة التشغيل.
* **الحل:** الأداة مصممة لتقرأ الملفات وترسل النتائجJSON فوراً، لذا لن تكون هناك مشكلة كبيرة إذا كنت تستخدمها للتحليل اللحظي.
