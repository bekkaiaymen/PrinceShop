// مساعد البحث الذكي بالعربية

/**
 * تطبيع النص العربي للبحث
 * - إزالة التشكيل
 * - توحيد الألف
 * - توحيد الياء والتاء المربوطة
 */
export function normalizeArabic(text) {
  if (!text) return '';
  
  return text
    // إزالة التشكيل العربي
    .replace(/[\u064B-\u0652]/g, '')
    // توحيد أشكال الألف
    .replace(/[أإآ]/g, 'ا')
    // توحيد الياء
    .replace(/ى/g, 'ي')
    // توحيد التاء المربوطة
    .replace(/ة/g, 'ه')
    // إزالة المسافات الزائدة
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * البحث الذكي في المنتجات
 * يبحث في الاسم، الوصف، SKU مع معالجة خاصة للعربية
 */
export function smartSearch(products, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return products;
  }

  const normalizedSearch = normalizeArabic(searchTerm);
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0);

  return products.filter(product => {
    // تطبيع نصوص المنتج
    const normalizedName = normalizeArabic(product.name || '');
    const normalizedDesc = normalizeArabic(product.description || '');
    const normalizedSku = normalizeArabic(product.sku || '');

    // البحث في جميع الحقول
    const allText = `${normalizedName} ${normalizedDesc} ${normalizedSku}`;

    // يجب أن تتطابق جميع الكلمات
    return searchWords.every(word => allText.includes(word));
  });
}

/**
 * البحث الضبابي - يجد تطابقات جزئية
 */
export function fuzzySearch(products, searchTerm, threshold = 0.6) {
  if (!searchTerm || !searchTerm.trim()) {
    return products;
  }

  const normalizedSearch = normalizeArabic(searchTerm);

  return products.map(product => {
    const normalizedName = normalizeArabic(product.name || '');
    const normalizedDesc = normalizeArabic(product.description || '');
    
    // حساب درجة التطابق
    let score = 0;

    // التطابق في الاسم (أعلى أهمية)
    if (normalizedName.includes(normalizedSearch)) {
      score += 100;
    } else {
      // تطابق جزئي
      const words = normalizedSearch.split(/\s+/);
      words.forEach(word => {
        if (normalizedName.includes(word)) {
          score += 30;
        }
      });
    }

    // التطابق في الوصف
    if (normalizedDesc.includes(normalizedSearch)) {
      score += 50;
    }

    return { product, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => item.product);
}

/**
 * البحث المتقدم مع التصحيح التلقائي للأخطاء الشائعة
 */
export function advancedSearch(products, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return products;
  }

  // تصحيح الأخطاء الشائعة
  const corrections = {
    'ايربودز': 'ايربودز',
    'ايربود': 'ايربودز',
    'شاحن': 'شاحن',
    'كيبل': 'كابل',
    'سماعات': 'سماعه',
    'حافظه': 'حافظه',
    'جراب': 'حافظه',
  };

  let correctedTerm = searchTerm;
  Object.keys(corrections).forEach(key => {
    if (normalizeArabic(searchTerm).includes(normalizeArabic(key))) {
      correctedTerm = correctedTerm.replace(new RegExp(key, 'gi'), corrections[key]);
    }
  });

  return smartSearch(products, correctedTerm);
}

/**
 * تسليط الضوء على النص المطابق
 */
export function highlightMatch(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const normalizedSearch = normalizeArabic(searchTerm);
  const normalizedText = normalizeArabic(text);

  // إيجاد موقع التطابق في النص المطبع
  const index = normalizedText.indexOf(normalizedSearch);
  
  if (index === -1) return text;

  // استخراج الجزء المطابق من النص الأصلي
  const before = text.substring(0, index);
  const match = text.substring(index, index + searchTerm.length);
  const after = text.substring(index + searchTerm.length);

  return { before, match, after, hasMatch: true };
}
