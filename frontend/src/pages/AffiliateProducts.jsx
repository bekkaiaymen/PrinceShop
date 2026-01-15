import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { Copy, Check, Share2, Package, Image as ImageIcon, Download } from 'lucide-react';

export default function AffiliateProducts() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [copiedImage, setCopiedImage] = useState(null);
  const [error, setError] = useState(null);

  // الفئات بنفس الترتيب في صفحة الزبون
  const categoryOrder = [
    { name: 'إيربودز', icon: '🎧', keywords: ['AIR PODS', 'AIRPODS'], featured: true },
    { name: 'حافظات مضادة للصدمات', icon: '📱', keywords: ['ANTICHOC'], featured: true },
    { name: 'مكبرات الصوت', icon: '🔊', keywords: ['BAFFLE'], featured: true },
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
      setAllProducts(data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.response?.data?.message || 'فشل في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  // تصنيف المنتجات حسب الفئات
  const categorizeProducts = () => {
    const categorized = {};
    categoryOrder.forEach(cat => { categorized[cat.name] = []; });

    allProducts.forEach(product => {
      let matched = false;
      const productName = product.name.toUpperCase();
      
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
    // نسخ النص مع رابط الصورة (الطريقة الأسهل والأكثر توافقاً)
    const productText = `🔥 ${product.name}\n\n💰 السعر: ${product.suggested_price} دج\n📦 توصيل مجاني في غرداية 🏜️\n💵 ربحك: ${product.affiliate_profit} دج\n\n📷 صورة المنتج:\n${product.image}\n\n🛒 اطلب الآن:\n${product.affiliateLink}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(productText);
      } else {
        // طريقة بديلة
        const textArea = document.createElement('textarea');
        textArea.value = productText;
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
      prompt('انسخ هذا النص:', productText);
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
        <h1 className="text-3xl font-bold mb-2">منتجاتك للتسويق 🚀</h1>
        <p className="text-blue-100">اختر منتج، انسخ رابطك الخاص، وابدأ الربح!</p>
        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <p className="text-sm mb-2">💡 <strong>نصيحة:</strong> يمكنك نسخ الرابط أو نسخ المنتج كاملاً (صورة + وصف + رابط)</p>
        </div>
      </div>

      {/* عرض المنتجات حسب الفئات */}
      {!loading && !error && (
        <div className="space-y-8">
          {categoryOrder.map(category => {
            const categorizedProducts = categorizeProducts();
            const products = categorizedProducts[category.name] || [];
            
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
                      onCopyLink={() => copyToClipboard(product.affiliateLink, 'link', product._id)}
                      onCopyText={() => copyToClipboard(product.shareText, 'text', product._id)}
                      onCopyAll={() => copyImageAndText(product)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
function ProductCard({ product, copiedLink, copiedText, copiedImage, onCopyLink, onCopyText, onCopyAll }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border-2 border-gray-100 hover:border-blue-200">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/placeholder.png';
          }}
        />
        <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          💰 ربح: {product.affiliate_profit} دج
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
            <p className="text-xl font-bold text-blue-600">{product.suggested_price} دج</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">ربحك</p>
            <p className="text-xl font-bold text-green-600">{product.affiliate_profit} دج</p>
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

          {/* نسخ نص جاهز */}
          <button
            onClick={onCopyText}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-bold shadow-md hover:shadow-lg"
          >
            {copiedText === product._id ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم النسخ! ✅</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>نسخ نص جاهز</span>
              </>
            )}
          </button>

          {/* نسخ المنتج كاملاً (صورة + نص) */}
          <button
            onClick={onCopyAll}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all text-sm font-bold shadow-md hover:shadow-lg"
          >
            {copiedImage === product._id ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم النسخ! ✅</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>نسخ المنتج كاملاً</span>
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
