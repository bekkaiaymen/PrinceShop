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

      // تحديد أول 500 منتج لتغطية أفضل
      const limitedProducts = products.slice(0, 500);
      console.log('✂️ إرسال', limitedProducts.length, 'منتج للـ AI');

      // إنشاء قائمة تفصيلية بالمنتجات
      const productList = limitedProducts.map((p, idx) => {
        const parts = [`${idx}: ${p.name}`];
        if (p.sku) parts.push(`[SKU: ${p.sku}]`);
        return parts.join(' ');
      }).join('\n');

      // Prompt بسيط ومباشر
      const prompt = `أنت محرك بحث ذكي للمنتجات. ابحث عن منتجات تطابق استعلام المستخدم.

استعلام: "${query}"

المنتجات (${limitedProducts.length}):
${productList}

ترجمة سريعة:
- سماعات/سماعة = AIRPODS, CASQUE, ECOUTEUR, HEADPHONE
- حافظة = ANTICHOC, CASE, ETUI
- شاحن = CHARGEUR, CHARGER
- كابل = CABLE
- بلوتوث = BLUETOOTH, SANS FIL, WIRELESS
- مكبر = BAFFLE, SPEAKER
- انكر/أنكر = ANKER

قواعد:
1. طابق المفهوم (سماعة = Airpods ✓)
2. اقبل الأخطاء الإملائية ("يمنع" قد تعني "يحمل" أو "من")
3. إذا ذكر علامة تجارية (ANKER, HOCO, Samsung)، ابحث عنها في اسم المنتج
4. إذا قال "ليس"/"بدون"، استبعد المنتج المذكور

أعد أرقام المنتجات المطابقة فقط (مثال: 0,5,12) أو NONE إذا لم تجد شيئاً.`;

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
        .filter(idx => !isNaN(idx) && idx >= 0 && idx < limitedProducts.length);
      
      const results = indices.map(idx => limitedProducts[idx]).filter(p => p !== undefined);

      console.log(`✅ AI وجد ${results.length} منتج مطابق من أصل ${limitedProducts.length}`);
      
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
