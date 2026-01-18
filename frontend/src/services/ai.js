// خدمة الذكاء الاصطناعي - DeepSeek API
const ENV_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
// الحل المباشر لضمان العمل الآن
const DIRECT_API_KEY = 'sk-0f06cf0af19d4171813116ae5ab033d1';
const DEEPSEEK_API_KEY = ENV_API_KEY || DIRECT_API_KEY;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class AIService {
  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.cache = new Map(); // تخزين مؤقت للنتائج
    
    // التحقق من وجود API key
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.error('⚠️ DEEPSEEK_API_KEY غير موجود! تأكد من ملف .env');
      console.log('📝 يجب إضافة VITE_DEEPSEEK_API_KEY في ملف .env');
    } else {
      console.log('✅ DeepSeek API Key محمّل بنجاح');
    }
  }

  // البحث الذكي عن المنتجات - محسّن بذكاء خارق لفهم الفقرات
  async searchProducts(query, products) {
    try {
      // التحقق من وجود نتيجة محفوظة
      const cacheKey = `search_${query.substring(0, 100)}`; // تقليل حجم المفتاح
      if (this.cache.has(cacheKey)) {
        console.log('📦 نتيجة من الذاكرة المؤقتة');
        return this.cache.get(cacheKey);
      }

      console.log('🤖 DeepSeek AI يحلل الاستعلام:', query);
      console.log('📊 عدد المنتجات:', products.length);

      // إنشاء قائمة تفصيلية بالمنتجات
      const productList = products.map((p, idx) => {
        const parts = [`${idx}: ${p.name}`];
        if (p.sku) parts.push(`[SKU: ${p.sku}]`);
        return parts.join(' ');
      }).join('\n');

      // Prompt خارق الذكاء
      const prompt = `أنت محرك بحث بذكاء خارق متخصص في فهم النصوص والفقرات باللغة العربية والإنجليزية والفرنسية.

📝 استعلام المستخدم (قد يكون كلمة أو فقرة كاملة):
"${query}"

📦 المنتجات المتاحة (${products.length} منتج):
${productList}

🧠 مهارات التحليل الخارق:

1️⃣ **فهم النية العميق**:
   - إذا قال "أريد سماعات بلوتوث" → ابحث عن AIRPODS/ECOUTEUR + BLUETOOTH
   - إذا قال "أبحث عن شاحن سريع لسامسونج" → SAMSUNG + CHARGEUR + (FAST/RAPIDE)
   - إذا قال "محتاج حافظة ايفون شفافة" → IPHONE + CASE/ANTICHOC + TRANSPARENT

2️⃣ **فهم الاستبعاد الذكي**:
   - "ليس" / "بدون" / "غير" / "ما عدا" / "إلا" → استبعد المنتجات المذكورة
   - مثال: "سماعات hoco ليس الكاسك" → فقط HOCO مع استبعاد CASQUE

3️⃣ **فهم العلامات التجارية**:
   - HOCO, SAMSUNG, APPLE, BASEUS, UGREEN, etc.
   - العلامة التجارية المذكورة لها أولوية قصوى

4️⃣ **فهم المواصفات التقنية**:
   - بلوتوث = BLUETOOTH, SANS FIL, WIRELESS, TWS
   - سريع = FAST, RAPIDE, QUICK
   - شفاف = TRANSPARENT, CLEAR
   - مضاد للصدمات = ANTICHOC, SHOCKPROOF

5️⃣ **فهم الفقرات الطويلة**:
   - استخرج الكلمات المفتاحية الرئيسية
   - افهم السياق العام
   - ركز على المتطلبات الأساسية
   - مثال: "أنا بحاجة لسماعات بلوتوث بدون أسلاك وبصوت عالي من علامة هوكو ولكن ليس النوع الكبير" 
     → HOCO + BLUETOOTH + SANS FIL + (AIRPODS/ECOUTEUR لا CASQUE)

6️⃣ **الترجمة الذكية**:
   العربية → English/Français:
   - سماعات = AIRPODS, CASQUE, ECOUTEUR, HEADPHONE, EARPHONE
   - حافظة = ANTICHOC, CASE, ETUI, COVER, PROTECTION
   - شاحن = CHARGEUR, CHARGER, ADAPTER
   - كابل = CABLE, WIRE, CORDON
   - بلوتوث = BLUETOOTH, SANS FIL, WIRELESS
   - مكبر = BAFFLE, SPEAKER, HAUT PARLEUR

7️⃣ **دقة عالية**:
   - فقط المنتجات المطابقة 100%
   - لا تضف منتجات "قريبة" أو "مشابهة"
   - إذا شك، لا تضف

🎯 المطلوب منك:
1. حلل الاستعلام بعمق (كلمات مفتاحية + نية + استبعادات)
2. ابحث في قائمة المنتجات
3. أعد فقط أرقام المنتجات المطابقة 100%

📤 الرد المطلوب:
- أرقام المنتجات مفصولة بفواصل: 0,5,12,23
- إذا لم تجد أي منتج مطابق: NONE
- فقط الأرقام، لا تفسيرات

⚠️ تذكر: الدقة > الكمية`;

      // التحقق من API key
      if (!this.apiKey || this.apiKey === 'undefined') {
        console.error('❌ لا يوجد API key!');
        throw new Error('API key is not configured');
      }
      
      console.log('📡 إرسال الطلب إلى DeepSeek...');
      console.log('🔑 API Key:', this.apiKey.substring(0, 10) + '...');

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'أنت محرك بحث بذكاء خارق. تفهم اللغة العربية والإنجليزية والفرنسية بعمق. تحلل النصوص والفقرات الطويلة. تستخرج النية الحقيقية. دقتك 100%. لا تضيف منتجات غير مطابقة أبداً.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.05, // دقة خارقة
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ من DeepSeek:', response.status);
        console.error('📋 تفاصيل:', errorText);
        
        if (response.status === 401) {
          console.error('🔐 API Key غير صالح أو منتهي!');
          console.error('⚠️ سيتم استخدام البحث المحلي الذكي كبديل');
          console.error('💡 للحصول على API key جديد: https://platform.deepseek.com');
        } else if (response.status === 429) {
          console.error('⏱️ تجاوزت الحد الأقصى للطلبات!');
        }
        
        throw new Error(`DeepSeek API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 استجابة DeepSeek الكاملة:', JSON.stringify(data, null, 2));
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ استجابة DeepSeek غير صحيحة:', data);
        throw new Error('Invalid DeepSeek response format');
      }
      
      const aiResponse = data.choices[0].message.content.trim();
      
      console.log('💡 رد DeepSeek AI:', aiResponse);

      // معالجة الرد بذكاء
      if (aiResponse === 'NONE' || aiResponse.toUpperCase().includes('NONE') || aiResponse.length === 0) {
        console.log('❌ AI لم يجد منتجات مطابقة');
        this.cache.set(cacheKey, []);
        return [];
      }

      // استخراج الأرقام بذكاء
      const indices = aiResponse
        .replace(/[^\d,]/g, '') // إزالة كل شيء ماعدا الأرقام والفواصل
        .split(',')
        .map(idx => parseInt(idx.trim()))
        .filter(idx => !isNaN(idx) && idx >= 0 && idx < products.length);
      
      const results = indices.map(idx => products[idx]).filter(p => p !== undefined);

      console.log(`✅ AI وجد ${results.length} منتج مطابق من أصل ${products.length}`);
      
      if (results.length > 0) {
        console.log('🎯 المنتجات المطابقة:', results.map(p => p.name).join(', '));
      }

      // حفظ في الذاكرة المؤقتة
      this.cache.set(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('❌ خطأ في البحث الذكي:', error);
      console.error('📋 تفاصيل الخطأ:', error.message);
      
      // في حالة الفشل، استخدم البحث العادي
      return this.fallbackSearch(query, products);
    }
  }

  // بحث احتياطي ذكي في حالة فشل AI
  fallbackSearch(query, products) {
    console.log('🔍 استخدام البحث المحلي الذكي...');
    const lowerQuery = query.toLowerCase().trim();
    
    // قاموس الترجمة العربية
    const translations = {
      'سماعات': ['airpods', 'casque', 'ecouteur', 'headphone'],
      'سماعة': ['airpods', 'casque', 'ecouteur', 'headphone'],
      'ايربودز': ['airpods', 'air pods'],
      'إيربودز': ['airpods', 'air pods'],
      'حافظة': ['antichoc', 'case', 'etui'],
      'حافظات': ['antichoc', 'case', 'etui'],
      'شاحن': ['chargeur', 'charger'],
      'شواحن': ['chargeur', 'charger'],
      'كابل': ['cable'],
      'كبل': ['cable'],
      'سلك': ['cable'],
      'مكبر': ['baffle', 'speaker', 'haut parleur'],
      'مكبرات': ['baffle', 'speaker', 'haut parleur'],
      'كاسك': ['casque'],
      'كاسكة': ['casque'],
      'بلوتوث': ['bluetooth', 'sans fil', 'wireless'],
      'لاسلكي': ['bluetooth', 'sans fil', 'wireless']
    };
    
    // جمع كل الكلمات المفتاحية
    const keywords = [lowerQuery];
    Object.keys(translations).forEach(arabic => {
      if (lowerQuery.includes(arabic)) {
        keywords.push(...translations[arabic]);
      }
    });
    
    // البحث
    const results = products.filter(p => {
      const productName = p.name.toLowerCase();
      const productSku = (p.sku || '').toLowerCase();
      
      return keywords.some(keyword => 
        productName.includes(keyword) || productSku.includes(keyword)
      );
    });
    
    console.log(`✅ البحث المحلي وجد ${results.length} منتج`);
    return results;
  }

  // تحليل الأرباح والإحصائيات
  async analyzeEarnings(stats) {
    try {
      const prompt = `أنت محلل مالي ذكي.
البيانات:
- إجمالي الأرباح: ${stats.total} دج
- رصيد متاح: ${stats.available} دج
- رصيد معلق: ${stats.pending} دج
- تم سحبه: ${stats.withdrawn} دج
- إجمالي الطلبات: ${stats.orders?.total || 0}
- طلبات مسلمة: ${stats.orders?.delivered || 0}
- نسبة التحويل: ${stats.conversionRate || 0}%

قدم تحليل سريع ونصائح مفيدة في 3 جمل قصيرة بالعربية.`;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('خطأ في تحليل الأرباح:', error);
      return null;
    }
  }

  // اقتراحات المنتجات بناءً على الأرباح
  async suggestProducts(products, userEarnings) {
    try {
      const topProducts = products
        .sort((a, b) => b.affiliate_profit - a.affiliate_profit)
        .slice(0, 20)
        .map((p, idx) => `${idx}: ${p.name} - ربح: ${p.affiliate_profit} دج`)
        .join('\n');

      const prompt = `أنت مستشار تسويق ذكي.
أرباح المسوق الحالية: ${userEarnings} دج

أفضل 20 منتج من حيث الربح:
${topProducts}

اقترح 5 منتجات للمسوق مع سبب مختصر لكل منتج (جملة واحدة).
الصيغة: رقم المنتج: السبب`;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 300
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('خطأ في اقتراح المنتجات:', error);
      return null;
    }
  }

  // مسح الذاكرة المؤقتة
  clearCache() {
    this.cache.clear();
  }
}

export default new AIService();
