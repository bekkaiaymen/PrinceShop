import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { Copy, Check, Share2, Package, Image as ImageIcon, Download, FileText } from 'lucide-react';

export default function AffiliateProducts() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [copiedImage, setCopiedImage] = useState(null);
  const [copiedName, setCopiedName] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [minProfit, setMinProfit] = useState('');
  const [maxProfit, setMaxProfit] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('profit-high');
  const [showFilters, setShowFilters] = useState(true);

  // الفئات بنفس الترتيب في صفحة الزبون
  const categoryOrder = [
    { name: 'إيربودز', icon: '🎧', keywords: ['AIR PODS', 'AIRPODS'], featured: true },
    { name: 'حافظات مضادة للصدمات', icon: '📱', keywords: ['ANTICHOC'], featured: true },
    { name: 'مكبرات الصوت', icon: '🔊', keywords: ['BAFFLE', 'OMPLE'], featured: true },
    { name: 'كوابل', icon: '🔌', keywords: ['CABLE'], featured: true },
    { name: 'كاسكات', icon: '🎮', keywords: ['CASQUE'], featured: true },
    { name: 'شواحن', icon: '🔋', keywords: ['CHARGEUR'], featured: true },
    { name: 'آلات الحلاقة', icon: '✂️', keywords: ['TONDEUSE'], featured: true },
    { name: 'أخرى', icon: '📦', keywords: [], featured: false }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await affiliate.getProducts();
      console.log('Products data:', data);
      setAllProducts(data.products || data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.response?.data?.message || 'فشل في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  // تصنيف المنتجات حسب الفئات مع الفلتر
  const categorizeProducts = () => {
    const categorized = {};
    categoryOrder.forEach(cat => { categorized[cat.name] = []; });

    if (!Array.isArray(allProducts)) return categorized;

    // تطبيق الفلتر
    let filtered = allProducts.filter(product => {
      // فلتر البحث
      const matchSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // فلتر قيمة الربح
      let matchProfit = true;
      if (minProfit !== '' || maxProfit !== '') {
        const profit = product.affiliate_profit || 0;
        const min = minProfit === '' ? 0 : parseFloat(minProfit);
        const max = maxProfit === '' ? Infinity : parseFloat(maxProfit);
        matchProfit = profit >= min && profit <= max;
      }
      
      // فلتر السعر المخصص
      let matchPrice = true;
      if (minPrice !== '' || maxPrice !== '') {
        const price = product.customerPrice || product.suggested_price || 0;
        const min = minPrice === '' ? 0 : parseFloat(minPrice);
        const max = maxPrice === '' ? Infinity : parseFloat(maxPrice);
        matchPrice = price >= min && price <= max;
      }
      
      return matchSearch && matchProfit && matchPrice;
    });

    // ترتيب المنتجات
    filtered.sort((a, b) => {
      const profitPercentA = a.profit_percent || 0;
      const profitPercentB = b.profit_percent || 0;
      const profitAmountA = a.affiliate_profit || 0;
      const profitAmountB = b.affiliate_profit || 0;
      const priceA = a.customerPrice || a.suggested_price || 0;
      const priceB = b.customerPrice || b.suggested_price || 0;
      
      switch(sortBy) {
        case 'profit-high':
          return profitAmountB - profitAmountA; // ترتيب حسب قيمة الربح
        case 'profit-low':
          return profitAmountA - profitAmountB; // ترتيب حسب قيمة الربح
        case 'profit-percent-high':
          return profitPercentB - profitPercentA; // ترتيب حسب نسبة الربح
        case 'profit-percent-low':
          return profitPercentA - profitPercentB; // ترتيب حسب نسبة الربح
        case 'price-high':
          return priceB - priceA;
        case 'price-low':
          return priceA - priceB;
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    filtered.forEach(product => {
      let matched = false;
      const productName = product.name?.toUpperCase() || '';
      
      for (const cat of categoryOrder) {
        if (cat.keywords.length === 0) continue;
        
        const hasKeyword = cat.keywords.some(keyword => 
          productName.includes(keyword.toUpperCase())
        );
        
        if (hasKeyword) {
          categorized[cat.name].push(product);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        categorized['أخرى'].push(product);
      }
    });

    return categorized;
  };
  
  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'الكل',
    minProfit !== '' || maxProfit !== '',
    minPrice !== '' || maxPrice !== ''
  ].filter(Boolean).length;
  
  // حساب إحصائيات الفلترة
  const filteredCategories = categorizeProducts();
  const totalFilteredProducts = Object.values(filteredCategories).reduce((sum, products) => sum + products.length, 0);
  
  // مسح كل الفلاتر
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('الكل');
    setMinProfit('');
    setMaxProfit('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('profit-high');
  };

  const copyToClipboard = async (text, type, productId) => {
    try {
      // محاولة استخدام Clipboard API الحديث
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // طريقة بديلة للمتصفحات القديمة
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('فشل النسخ:', err);
          textArea.remove();
          throw err;
        }
      }
      
      if (type === 'link') {
        setCopiedLink(productId);
        setTimeout(() => setCopiedLink(null), 2000);
      } else if (type === 'text') {
        setCopiedText(productId);
        setTimeout(() => setCopiedText(null), 2000);
      }
    } catch (err) {
      console.error('فشل النسخ:', err);
      // عرض النص للمستخدم لنسخه يدوياً
      const result = prompt('انسخ هذا النص:', text);
    }
  };

  const copyImageAndText = async (product) => {
    // نسخ رابط الصورة فقط
    const imageUrl = product.image;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(imageUrl);
      } else {
        // طريقة بديلة
        const textArea = document.createElement('textarea');
        textArea.value = imageUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopiedImage(product._id);
      setTimeout(() => setCopiedImage(null), 2000);
    } catch (error) {
      console.error('فشل النسخ:', error);
      prompt('انسخ رابط الصورة:', imageUrl);
    }
  };

  const copyProductName = async (product) => {
    // نسخ اسم المنتج والوصف إذا كان موجود
    let text = product.name;
    if (product.description && product.description.trim()) {
      text += `\n\n${product.description}`;
    }
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // طريقة بديلة
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopiedName(product._id);
      setTimeout(() => setCopiedName(null), 2000);
    } catch (error) {
      console.error('فشل النسخ:', error);
      prompt('انسخ هذا النص:', text);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProducts}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">منتجاتك للتسويق 🚀</h1>
            <p className="text-blue-100 mb-4">اختر منتج، انسخ رابطك الخاص، وابدأ الربح!</p>
            
            {/* إحصائيات الفلترة */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-xs text-blue-100">إجمالي المنتجات</div>
                <div className="text-2xl font-bold">{allProducts.length}</div>
              </div>
              {activeFiltersCount > 0 && (
                <div className="bg-green-500/30 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-green-300">
                  <div className="text-xs text-green-100">نتائج الفلترة</div>
                  <div className="text-2xl font-bold">{totalFilteredProducts}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* زر التحكم بالفلاتر */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              فلاتر البحث المتقدمة
            </h3>
            
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                مسح الكل ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">🔍</span>
                البحث
              </label>
              <input
                type="text"
                placeholder="اسم المنتج أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                الفئة
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="الكل">الكل</option>
                {categoryOrder.filter(cat => cat.keywords.length > 0).map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            {/* Profit Range Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">💰</span>
                نطاق الربح (دج)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="من (مثال: 100)"
                    value={minProfit}
                    onChange={(e) => setMinProfit(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div className="flex items-center text-gray-500 font-bold">-</div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="إلى (مثال: 500)"
                    value={maxProfit}
                    onChange={(e) => setMaxProfit(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">ابحث عن المنتجات حسب قيمة الربح</p>
            </div>

            {/* Custom Price Range */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">💵</span>
                نطاق السعر (دج)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="من (مثال: 500)"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div className="flex items-center text-gray-500 font-bold">-</div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="إلى (مثال: 2000)"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sort By - Full Width */}
          <div className="mt-4 pt-4 border-t-2 border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">↕️</span>
              الترتيب حسب
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                { value: 'profit-high', label: '💎 قيمة الربح: الأعلى أولاً', color: 'green' },
                { value: 'profit-low', label: '📉 قيمة الربح: الأقل أولاً', color: 'orange' },
                { value: 'profit-percent-high', label: '📈 نسبة الربح: الأعلى أولاً', color: 'emerald' },
                { value: 'profit-percent-low', label: '📊 نسبة الربح: الأقل أولاً', color: 'teal' },
                { value: 'price-high', label: '💰 السعر: الأغلى أولاً', color: 'purple' },
                { value: 'price-low', label: '🏷️ السعر: الأرخص أولاً', color: 'blue' },
                { value: 'newest', label: '🆕 الأحدث', color: 'indigo' },
                { value: 'name', label: '🔤 الاسم (أ-ي)', color: 'gray' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    sortBy === option.value
                      ? `bg-${option.color}-100 text-${option.color}-700 ring-2 ring-${option.color}-500`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* عرض المنتجات حسب الفئات */}
      {!loading && !error && (
        <div className="space-y-8">
          {(() => {
            const categorizedProducts = categorizeProducts();
            
            return categoryOrder.map(category => {
              const products = categorizedProducts[category.name] || [];
              
              // فلتر الفئة المحددة
              if (selectedCategory !== 'الكل' && category.name !== selectedCategory) return null;
              if (products.length === 0) return null;
              
              return (
                <div key={category.name}>
                  {/* رأس الفئة */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 mb-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{category.icon}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {products.length} منتج • ربح يصل إلى {Math.max(...products.map(p => p.affiliate_profit))} دج
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* المنتجات */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        copiedLink={copiedLink}
                        copiedText={copiedText}
                        copiedImage={copiedImage}
                        copiedName={copiedName}
                        onCopyLink={() => copyToClipboard(product.affiliateLink, 'link', product._id)}
                        onCopyText={() => copyToClipboard(product.shareText, 'text', product._id)}
                        onCopyImage={() => copyImageAndText(product)}
                        onCopyName={() => copyProductName(product)}
                      />
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* رسالة عدم وجود نتائج بعد الفلترة */}
      {!loading && !error && totalFilteredProducts === 0 && allProducts.length > 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
          <p className="text-gray-600 mb-4">لم نجد منتجات تطابق معايير البحث الخاصة بك</p>
          <button
            onClick={clearAllFilters}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            مسح جميع الفلاتر
          </button>
        </div>
      )}

      {/* رسالة عدم وجود منتجات من الأساس */}
      {allProducts.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
        </div>
      )}
    </div>
  );
}

// بطاقة المنتج
function ProductCard({ product, copiedLink, copiedText, copiedImage, copiedName, onCopyLink, onCopyText, onCopyImage, onCopyName }) {
  // دالة لتدوير السعر
  const formatPrice = (price) => {
    const rounded = Math.ceil(price / 10) * 10;
    return rounded.toLocaleString('fr-DZ');
  };

  // حساب الربح الفعلي بناءً على السعر المدور
  const roundedPrice = Math.ceil(product.suggested_price / 10) * 10;
  const priceIncrease = roundedPrice - product.suggested_price;
  const actualProfit = product.affiliate_profit + priceIncrease;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border-2 border-gray-100 hover:border-blue-200">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
          }}
        />
        <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          💰 ربح: {actualProfit.toLocaleString('fr-DZ')} دج
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-base leading-tight min-h-[3rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500">سعر البيع</p>
            <p className="text-xl font-bold text-blue-600">{formatPrice(product.suggested_price)} دج</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">ربحك</p>
            <p className="text-xl font-bold text-green-600">{actualProfit.toLocaleString('fr-DZ')} دج</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* نسخ رابط التسويق */}
          <button
            onClick={onCopyLink}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-bold shadow-md hover:shadow-lg"
          >
            {copiedLink === product._id ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم النسخ! ✅</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ رابط التسويق</span>
              </>
            )}
          </button>

          {/* نسخ رابط الصورة */}
          <button
            onClick={onCopyImage}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-bold shadow-md hover:shadow-lg"
          >
            {copiedImage === product._id ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم النسخ! ✅</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>نسخ رابط الصورة</span>
              </>
            )}
          </button>

          {/* نسخ اسم المنتج والوصف */}
          <button
            onClick={onCopyName}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all text-sm font-bold shadow-md hover:shadow-lg"
          >
            {copiedName === product._id ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم النسخ! ✅</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>نسخ الاسم والوصف</span>
              </>
            )}
          </button>
        </div>

        {/* SKU */}
        {product.sku && (
          <p className="text-xs text-gray-400 mt-3 text-center font-mono">
            {product.sku}
          </p>
        )}
      </div>
    </div>
  );
}
