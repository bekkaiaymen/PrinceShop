import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Package, DollarSign, Filter, Zap, Headphones, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function HomePage() {
  console.log('HomePage: Component Loaded (v3.0 - Robust)'); // Debug Log
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ترتيب الفئات المطلوب
  const categoryOrder = [
    { 
      name: 'إيربودز', 
      icon: '🎧', 
      keywords: ['AIR PODS', 'AIRPODS'], 
      featured: true 
    },
    { 
      name: 'حافظات مضادة للصدمات', 
      icon: '📱', 
      keywords: ['ANTICHOC'], 
      featured: true 
    },
    { 
      name: 'مكبرات الصوت', 
      icon: '🔊', 
      keywords: ['BAFFLE', 'OMPLE'], 
      featured: true 
    },
    { 
      name: 'كوابل', 
      icon: '🔌', 
      keywords: ['CABLE'], 
      featured: true 
    },
    { 
      name: 'كاسكات', 
      icon: '🎮', 
      keywords: ['CASQUE'], 
      featured: true 
    },
    { 
      name: 'شواحن', 
      icon: '🔋', 
      keywords: ['CHARGEUR'], 
      featured: true 
    },
    { 
      name: 'آلات الحلاقة', 
      icon: '✂️', 
      keywords: ['TONDEUSE'], 
      featured: true 
    },
    { 
      name: 'أخرى', 
      icon: '📦', 
      keywords: [], 
      featured: false 
    }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // تصنيف المنتجات حسب الفئات
  const categorizeProducts = () => {
    const categorized = {};
    
    categoryOrder.forEach(cat => {
      categorized[cat.name] = [];
    });

    if (Array.isArray(allProducts)) {
      allProducts.forEach(product => {
        let matched = false;
        const productName = product.name.toUpperCase();
        
        for (const cat of categoryOrder) {
          if (cat.keywords.length === 0) continue;
          
          if (cat.keywords.some(keyword => productName.includes(keyword))) {
            categorized[cat.name].push(product);
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          categorized['أخرى'].push(product);
        }
      });
    }

    return categorized;
  };

  // فلترة المنتجات حسب البحث
  const filteredProducts = searchTerm 
    ? allProducts.filter(p => {
        const productName = p.name.toUpperCase();
        const searchUpper = searchTerm.toUpperCase();
        
        // البحث في اسم المنتج و SKU
        if (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        }
        
        // البحث في الكلمات المفتاحية للفئات
        for (const category of categoryOrder) {
          if (category.keywords.some(keyword => productName.includes(keyword))) {
            if (category.name.includes(searchTerm) || 
                searchUpper.includes(category.name.toUpperCase())) {
              return true;
            }
          }
        }
        
        return false;
      })
    : null;

  const categorizedProducts = !searchTerm ? categorizeProducts() : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header - محسّن للموبايل */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              متجر الإلكترونيات
            </h1>
            <div className="flex gap-2">
              <Link
                to="/login"
                className="px-3 py-2 text-xs sm:text-base text-gray-700 hover:text-gray-900 font-medium"
              >
                دخول
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-5 py-2 text-xs sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-md"
              >
                كن مسوقاً
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            منصة التسويق بالعمولة
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            اربح المال من بيع المنتجات الإلكترونية بأفضل الأسعار
          </p>
          <Link
            to="/register"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl"
          >
            ابدأ الربح الآن 🚀
          </Link>
        </div>
      </section>

      {/* Search - محسّن للموبايل */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="mt-6 text-blue-600 font-bold text-lg">جاري تحميل المنتجات...</p>
        </div>
      ) : searchTerm ? (
        /* نتائج البحث - محسّن للموبايل */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              نتائج البحث
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              تم العثور على <span className="font-bold text-blue-600">{filteredProducts?.length || 0}</span> منتج
            </p>
          </div>
          {(filteredProducts?.length || 0) === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-lg">
              <Package className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg font-medium">لا توجد نتائج مطابقة</p>
              <p className="text-gray-400 text-sm sm:text-base mt-2">جرب كلمات بحث أخرى</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* عرض حسب الفئات - محسّن للموبايل */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8">
          {categoryOrder.filter(cat => cat.featured).map(category => {
            const products = categorizedProducts[category.name] || [];
            if (products.length === 0) return null;
            
            return (
              <div key={category.name} className="mb-8 sm:mb-12">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 rounded-xl">
                  <span className="text-3xl sm:text-4xl">{category.icon}</span>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex-1">
                    {category.name}
                  </h3>
                  <span className="bg-blue-600 text-white px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    {products.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* باقي المنتجات (أخرى) - محسّن للموبايل */}
          {(() => {
            const otherCategory = categoryOrder.find(cat => !cat.featured);
            const otherProducts = categorizedProducts[otherCategory?.name] || [];
            if (otherProducts.length === 0) return null;
            
            return (
              <div className="mb-8 sm:mb-12">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 bg-gray-100 p-3 sm:p-4 rounded-xl">
                  <span className="text-3xl sm:text-4xl">{otherCategory.icon}</span>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex-1">
                    {otherCategory.name}
                  </h3>
                  <span className="bg-gray-700 text-white px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    {otherProducts.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">{otherProducts.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// مكون بطاقة المنتج - محسّن للموبايل
function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-gray-100">
      {/* صورة المنتج */}
      <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/products/placeholder.png';
          }}
        />
        {/* شارة الربح */}
        <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
          💰 {product.affiliate_profit} دج
        </div>
      </div>
      
      {/* معلومات المنتج */}
      <div className="p-3 sm:p-4">
        {/* اسم المنتج */}
        <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base leading-tight min-h-[2.5rem] sm:min-h-[3rem]">
          {product.name}
        </h3>
        
        {/* السعر والزر */}
        <div className="flex items-center justify-between gap-2">
          {/* السعر */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-0.5">السعر</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{product.suggested_price} دج</p>
          </div>
          
          {/* زر البيع */}
          <Link
            to="/register"
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all text-xs sm:text-sm font-bold shadow-md hover:shadow-lg whitespace-nowrap"
          >
            🚀 ابدأ البيع
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
