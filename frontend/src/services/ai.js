// خدمة الذكاء الاصطناعي - DeepSeek API
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class AIService {
  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.cache = new Map(); // تخزين مؤقت للنتائج
  }

  // البحث الذكي عن المنتجات
  async searchProducts(query, products) {
    try {
      // التحقق من وجود نتيجة محفوظة
      const cacheKey = `search_${query}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // إنشاء قائمة مختصرة بأسماء المنتجات
      const productList = products.map((p, idx) => `${idx}: ${p.name}`).join('\n');

      const prompt = `أنت مساعد بحث ذكي في متجر إلكتروني.
المستخدم يبحث عن: "${query}"

قائمة المنتجات المتاحة:
${productList}

المهمة:
1. ابحث عن المنتجات التي تطابق استعلام المستخدم
2. استخدم الترجمة الذكية (عربي ↔ إنجليزي/فرنسي)
3. فهم النية من البحث (مثلاً: "سماعات" تعني AIRPODS/CASQUE)

أعد فقط أرقام المنتجات المطابقة مفصولة بفواصل، مثال: 0,5,12,23
إذا لم تجد أي منتج مطابق، أعد: NONE`;

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
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بخدمة الذكاء الاصطناعي');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();

      // معالجة الرد
      if (aiResponse === 'NONE') {
        this.cache.set(cacheKey, []);
        return [];
      }

      const indices = aiResponse.split(',').map(idx => parseInt(idx.trim())).filter(idx => !isNaN(idx));
      const results = indices.map(idx => products[idx]).filter(p => p !== undefined);

      // حفظ في الذاكرة المؤقتة
      this.cache.set(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('خطأ في البحث الذكي:', error);
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
