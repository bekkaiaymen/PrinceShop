# 🎯 دليل Facebook Business APIs المتقدم

## 📊 نظرة عامة على الـ APIs

### 1. Marketing API (للإعلانات) ⭐
**الأفضل لمشروعك!** - تتبع الإعلانات الناجحة والمنتجات الرابحة

**ما يمكنك الحصول عليه:**
- ✅ جميع الإعلانات النشطة على فيسبوك
- ✅ التفاعل الحقيقي (Engagement)
- ✅ عدد النقرات والتحويلات
- ✅ الميزانية والأداء
- ✅ الجمهور المستهدف
- ✅ تحليل المنافسين

### 2. Pages API (للصفحات)
**للتحليل العميق** - تحليل صفحات المنافسين

**ما يمكنك الحصول عليه:**
- ✅ جميع منشورات الصفحة
- ✅ الإعجابات والتعليقات الحقيقية
- ✅ Insights (الإحصائيات)
- ✅ أفضل الأوقات للنشر
- ✅ معدل التفاعل

### 3. Business SDK
مكتبات جاهزة بلغات متعددة (Python, PHP, JavaScript)

---

## 🔑 الإعداد المتقدم

### الخطوة 1: إنشاء Business Manager Account

1. اذهب إلى: https://business.facebook.com/
2. اضغط **"Create Account"**
3. أدخل تفاصيل عملك
4. أكمل التحقق

### الخطوة 2: إنشاء تطبيق Business

1. اذهب إلى: https://developers.facebook.com/apps
2. اضغط **"Create App"**
3. اختر نوع: **"Business"**
4. املأ:
   - App Name: Product Research Pro
   - App Contact Email: your@email.com
   - Business Account: اختر حسابك
5. اضغط **"Create App"**

### الخطوة 3: إضافة Marketing API

من لوحة التطبيق:
1. ابحث عن **"Marketing API"**
2. اضغط **"Set Up"**
3. اتبع الخطوات

### الخطوة 4: الحصول على الصلاحيات المطلوبة

#### للإعلانات (Marketing API):
```
ads_read
ads_management
business_management
```

#### للصفحات (Pages API):
```
pages_read_engagement
pages_show_list
pages_manage_posts
read_insights
```

### الخطوة 5: الحصول على Access Token

#### طريقة Graph API Explorer:
1. https://developers.facebook.com/tools/explorer/
2. اختر تطبيقك
3. اختر **"Get User Access Token"**
4. حدد الصلاحيات أعلاه
5. انسخ Token

#### طريقة Business Manager:
1. اذهب إلى Business Settings
2. System Users → Add
3. أنشئ System User
4. Generate Token مع الصلاحيات

---

## 🚀 استخدام Marketing API (الأكثر أهمية!)

### 1. البحث عن الإعلانات النشطة

**Meta Ads Library API** - للبحث العام:

```python
import requests

url = "https://graph.facebook.com/v18.0/ads_archive"
params = {
    'access_token': 'YOUR_TOKEN',
    'search_terms': 'dropshipping',
    'ad_reached_countries': 'US',
    'ad_active_status': 'ACTIVE',
    'fields': 'id,ad_creative_bodies,ad_delivery_start_time,impressions,spend_estimate'
}

response = requests.get(url, params=params)
ads = response.json()
```

### 2. الحصول على تفاعل الإعلانات

```python
# الحصول على Post ID من الإعلان
post_id = "PAGE_ID_POST_ID"

url = f"https://graph.facebook.com/v18.0/{post_id}"
params = {
    'access_token': 'YOUR_TOKEN',
    'fields': 'likes.summary(true),comments.summary(true),shares'
}

response = requests.get(url, params=params)
engagement = response.json()

likes = engagement['likes']['summary']['total_count']
comments = engagement['comments']['summary']['total_count']
```

### 3. تحليل أداء الإعلانات (إذا كنت تملك Ad Account)

```python
url = f"https://graph.facebook.com/v18.0/act_{AD_ACCOUNT_ID}/ads"
params = {
    'access_token': 'YOUR_TOKEN',
    'fields': 'name,adset{name},insights{impressions,clicks,ctr,spend,actions}',
    'limit': 100
}
```

---

## 📊 استخدام Pages API

### 1. الحصول على منشورات صفحة

```python
url = f"https://graph.facebook.com/v18.0/{PAGE_ID}/posts"
params = {
    'access_token': 'YOUR_TOKEN',
    'fields': '''
        message,
        created_time,
        likes.summary(true),
        comments.summary(true),
        shares,
        insights.metric(post_impressions,post_engaged_users)
    ''',
    'limit': 50
}
```

### 2. الحصول على Insights للصفحة

```python
url = f"https://graph.facebook.com/v18.0/{PAGE_ID}/insights"
params = {
    'access_token': 'YOUR_TOKEN',
    'metric': 'page_impressions,page_engaged_users,page_fans',
    'period': 'day'
}
```

### 3. البحث عن صفحات المنافسين

```python
url = "https://graph.facebook.com/v18.0/pages/search"
params = {
    'access_token': 'YOUR_TOKEN',
    'q': 'dropshipping store',
    'type': 'page',
    'fields': 'name,category,fan_count,engagement',
    'limit': 20
}
```

---

## 🎯 الاستراتيجية المثلى لمشروعك

### المرحلة 1: البحث عن المنتجات الرابحة

1. **استخدم Meta Ads Library API**
   - ابحث عن إعلانات نشطة
   - فلتر حسب: dropshipping, trending products
   - احصل على الإعلانات الأقدم (تشير للنجاح)

2. **احصل على التفاعل الحقيقي**
   - استخرج Post ID من كل إعلان
   - احصل على: Likes, Comments, Shares
   - طبق القاعدة: Comments >= Likes × 10%

### المرحلة 2: تحليل المنافسين

1. **تتبع الصفحات الناجحة**
   - استخدم Pages API
   - راقب منشوراتهم
   - حلل أنماط النجاح

2. **تحليل الاتجاهات**
   - تتبع المنشورات عبر الزمن
   - اكتشف المنتجات المتكررة
   - حدد أفضل أوقات الإطلاق

---

## 🔧 الأدوات المتقدمة

### Facebook Business SDK (Python)

تثبيت:
```bash
pip install facebook-business
```

استخدام:
```python
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount

# Initialize
FacebookAdsApi.init(
    app_id='YOUR_APP_ID',
    app_secret='YOUR_APP_SECRET',
    access_token='YOUR_TOKEN'
)

# Get Ad Account
account = AdAccount('act_YOUR_AD_ACCOUNT_ID')

# Get Ads
ads = account.get_ads(fields=['name', 'insights'])
```

---

## 📈 Rate Limits (الحدود)

### Marketing API:
- **200 calls/hour** per user
- **4,800 calls/hour** per app

### Pages API:
- **200 calls/hour** per user
- **Insights**: 5 calls/hour per page

### نصيحة:
استخدم **Batch Requests** لتقليل عدد الطلبات:

```python
batch = [
    {'method': 'GET', 'relative_url': f'/{page_id}/posts'},
    {'method': 'GET', 'relative_url': f'/{page_id}/insights'},
]

url = "https://graph.facebook.com/v18.0/"
params = {
    'access_token': 'YOUR_TOKEN',
    'batch': json.dumps(batch)
}
```

---

## 🎓 أمثلة عملية

### مثال 1: البحث عن أفضل 10 إعلانات dropshipping

```python
# 1. ابحث في Ads Library
# 2. احصل على engagement لكل إعلان
# 3. رتب حسب النسبة (comments/likes)
# 4. استخرج المنتجات
```

### مثال 2: تحليل منافس

```python
# 1. احصل على Page ID للمنافس
# 2. اجمع آخر 50 منشور
# 3. حلل أنماط النجاح
# 4. استخرج المنتجات الأكثر تفاعلاً
```

### مثال 3: تتبع اتجاهات السوق

```python
# 1. ابحث عن صفحات ecommerce
# 2. تتبع منشوراتهم يومياً
# 3. اكتشف المنتجات المتكررة
# 4. حدد الترند الصاعد
```

---

## ⚠️ ملاحظات مهمة

### 1. موافقة Facebook (App Review)
بعض الصلاحيات تحتاج موافقة:
- `ads_management`: لإدارة الإعلانات
- `read_insights`: للإحصائيات التفصيلية

**للحصول على الموافقة:**
1. اذهب إلى App Review
2. اطلب الصلاحيات
3. قدم شرح واضح للاستخدام
4. قدم فيديو توضيحي

### 2. Privacy & Compliance
- التزم بسياسات فيسبوك
- لا تجمع بيانات شخصية
- احترم خصوصية المستخدمين

### 3. Data Retention
- لا تحفظ البيانات لفترة طويلة
- احذف البيانات القديمة
- استخدم التشفير للبيانات الحساسة

---

## 🔗 روابط مهمة

- **Marketing API Docs**: https://developers.facebook.com/docs/marketing-apis
- **Pages API Docs**: https://developers.facebook.com/docs/pages
- **Business SDK**: https://github.com/facebook/facebook-python-business-sdk
- **Ads Library**: https://www.facebook.com/ads/library/api
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Business Manager**: https://business.facebook.com/

---

## ✅ الخطوة التالية

لقد أنشأت لك:
- ✅ `marketing_api_tracker.py` - متتبع احترافي للإعلانات
- ✅ `pages_api_tracker.py` - محلل الصفحات
- ✅ `business_sdk_example.py` - أمثلة على استخدام SDK

جربها الآن! 🚀
