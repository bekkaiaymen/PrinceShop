// خدمة الذكاء الاصطناعي - DeepSeek API
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class AIService {
  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.cache = new Map(); // تخزين مؤقت للنتائج
  }

  // البحث الذكي عن المنتجات - محسّن بذكاء خارق
  async searchProducts(query, products) {
    try {
      // التحقق من وجود نتيجة محفوظة
      const cacheKey = `search_${query}`;
      if (this.cache.has(cacheKey)) {
        console.log('📦 نتيجة من الذاكرة المؤقتة');
        return this.cache.get(cacheKey);
      }

      console.log('🤖 DeepSeek AI يحلل الاستعلام:', query);

      // إنشاء قائمة تفصيلية بالمنتجات مع كل التفاصيل
      const productList = products.map((p, idx) => {
        const details = [];
        details.push(`رقم: ${idx}`);
        details.push(`الاسم: ${p.name}`);
        if (p.sku) details.push(`SKU: ${p.sku}`);
        if (p.description) details.push(`الوصف: ${p.description}`);
        return details.join(' | ');
      }).join('\n');

      const prompt = `أنت محرك بحث ذكي متخصص في المنتجات الإلكترونية. مهمتك تحليل استعلام المستخدم بدقة عالية جداً.

📋 استعلام المستخدم: "${query}"

📦 قائمة المنتجات:
${productList}

🎯 قواعد البحث الذكي:
1. **فهم اللغة العربية بعمق**:
   - "سماعات" = AIRPODS, CASQUE, ECOUTEUR, HEADPHONE
   - "حافظة" = ANTICHOC, ETUI, CASE
   - "شاحن" = CHARGEUR, CHARGER
   - "كابل" = CABLE
   - "بلوتوث" = BLUETOOTH, SANS FIL, WIRELESS

2. **فهم العلامات التجارية**:
   - إذا ذكر "hoco" أو "HOCO" - ابحث فقط عن HOCO
   - إذا ذكر "samsung" - ابحث فقط عن Samsung
   - العلامة التجارية أولوية قصوى

3. **فهم الاستبعاد**:
   - إذا قال "ليس الكاسك" أو "بدون casque" - استبعد كل منتج يحتوي على CASQUE
   - إذا قال "ليس" أو "بدون" أو "غير" - استبعد المنتجات المذكورة بعدها
   - الاستبعاد له أولوية عالية

4. **فهم المواصفات**:
   - إذا ذكر "بلوتوث" - ابحث عن BLUETOOTH أو SANS FIL
   - إذا ذكر نوع محدد (TWS, BASS, etc) - يجب أن يكون موجود
   - المواصفات المحددة إلزامية

5. **الدقة العالية**:
   - لا تضف منتجات لا تطابق الاستعلام تماماً
   - إذا شك، لا تضف المنتج
   - الأولوية للدقة على الكمية

📝 مثال على التفكير:
استعلام: "سماعات بلوتوث hoco ليس الكاسك"
التحليل:
- يريد: سماعات (AIRPODS/ECOUTEUR فقط، ليس CASQUE)
- يريد: بلوتوث (BLUETOOTH/SANS FIL)
- يريد: علامة HOCO فقط
- لا يريد: CASQUE
النتيجة: منتجات HOCO التي تحتوي على AIRPODS/ECOUTEUR + BLUETOOTH/SANS FIL وليس CASQUE

🎯 المطلوب:
أعد فقط أرقام المنتجات المطابقة 100% للاستعلام، مفصولة بفواصل.
مثال: 0,5,12,23
إذا لم تجد أي منتج مطابق تماماً، أعد: NONE

⚠️ تحذير: لا تضف منتجات "قريبة" أو "شبيهة" - فقط المطابقة التامة!`;

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
              content: 'أنت محرك بحث ذكي متخصص في فهم اللغة العربية والإنجليزية والفرنسية. تتميز بالدقة العالية جداً في فهم الاستعلامات المعقدة والاستبعادات.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // دقة عالية جداً
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ من DeepSeek:', errorData);
        throw new Error('فشل الاتصال بخدمة الذكاء الاصطناعي');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();
      
      console.log('💡 رد DeepSeek AI:', aiResponse);

      // معالجة الرد
      if (aiResponse === 'NONE' || aiResponse.includes('NONE')) {
        console.log('❌ لم يجد AI أي منتجات مطابقة');
        this.cache.set(cacheKey, []);
        return [];
      }

      // استخراج الأرقام من الرد
      const indices = aiResponse
        .split(/[,\s]+/)
        .map(idx => parseInt(idx.trim()))
        .filter(idx => !isNaN(idx) && idx >= 0 && idx < products.length);
      
      const results = indices.map(idx => products[idx]).filter(p => p !== undefined);

      console.log(`✅ AI وجد ${results.length} منتج مطابق`);

      // حفظ في الذاكرة المؤقتة
      this.cache.set(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('❌ خطأ في البحث الذكي:', error);
      // في حالة الفشل، استخدم البحث العادي
      return this.fallbackSearch(query, products);
    }
  }

  // بحث احتياطي في حالة فشل AI
  fallbackSearch(query, products) {
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.sku && p.sku.toLowerCase().includes(lowerQuery))
    );
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
