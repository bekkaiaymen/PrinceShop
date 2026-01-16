import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Menu, X, MapPin, Phone } from 'lucide-react';
import api from '../services/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

function CustomerHome() {
  console.log('CustomerHome: Component Loaded (v3.0 - Robust)'); // Debug Log
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const affiliateCode = searchParams.get('ref'); // رمز المسوق من الرابط
  const productIdFromUrl = searchParams.get('product'); // معرف المنتج من الرابط
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // الفئات
  const categoryOrder = [
    { name: 'إيربودز', icon: '🎧', keywords: ['AIR PODS', 'AIRPODS'] },
    { name: 'حافظات مضادة للصدمات', icon: '📱', keywords: ['ANTICHOC'] },
    { name: 'مكبرات الصوت', icon: '🔊', keywords: ['BAFFLE'] },
    { name: 'كوابل', icon: '🔌', keywords: ['CABLE'] },
    { name: 'كاسكات', icon: '🎮', keywords: ['CASQUE'] },
    { name: 'شواحن', icon: '🔋', keywords: ['CHARGEUR'] },
    { name: 'آلات الحلاقة', icon: '✂️', keywords: ['TONDEUSE'] },
    { name: 'أخرى', icon: '📦', keywords: [] }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  // فتح المنتج تلقائياً إذا كان في الرابط
  useEffect(() => {
    if (productIdFromUrl && allProducts.length > 0) {
      const product = allProducts.find(p => p._id === productIdFromUrl);
      if (product) {
        setSelectedProduct(product);
        setOrderModalOpen(true);
        // تمرير سلس إلى المنتج
        setTimeout(() => {
          const productElement = document.getElementById(`product-${productIdFromUrl}`);
          if (productElement) {
            productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [productIdFromUrl, allProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      console.log('API Response:', data);
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // تصنيف المنتجات
  const categorizeProducts = () => {
    const categorized = {};
    categoryOrder.forEach(cat => { categorized[cat.name] = []; });

    if (!Array.isArray(allProducts)) return categorized;

    allProducts.forEach(product => {
      let matched = false;
      const productName = product.name?.toUpperCase() || '';
      
      for (const cat of categoryOrder) {
        if (cat.keywords.length === 0) continue;
        if (cat.keywords.some(keyword => productName.includes(keyword))) {
          categorized[cat.name].push(product);
          matched = true;
          break;
        }
      }
      
      if (!matched) categorized['أخرى'].push(product);
    });

    return categorized;
  };

  const filteredProducts = searchTerm 
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const categorizedProducts = !searchTerm ? categorizeProducts() : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header احترافي */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-blue-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  متجر الإلكترونيات
                </h1>
                <p className="text-xs text-gray-500">أفضل الأسعار والعروض</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                الرئيسية
              </Link>
              <Link to="#categories" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                الفئات
              </Link>
              <Link to="#offers" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                العروض
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">تسجيل دخول</span>
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl"
              >
                كن مسوقاً 🚀
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in">
            اكتشف أفضل المنتجات الإلكترونية ⚡
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100">
            جودة عالية • أسعار منافسة • توصيل سريع 🚚
          </p>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن منتجك المفضل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 sm:py-5 border-0 rounded-2xl focus:ring-4 focus:ring-white/30 text-base sm:text-lg shadow-2xl text-gray-800"
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="mt-6 text-blue-600 font-bold text-lg">جاري تحميل المنتجات...</p>
        </div>
      ) : searchTerm ? (
        /* نتائج البحث */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-2xl mb-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              نتائج البحث 🔍
            </h3>
            <p className="text-base sm:text-lg text-gray-600">
              وجدنا <span className="font-bold text-blue-600">{filteredProducts?.length || 0}</span> منتج
            </p>
          </div>
          {(filteredProducts?.length || 0) === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-gray-500 text-lg font-medium">لم نجد ما تبحث عنه</p>
              <p className="text-gray-400 text-sm mt-2">جرب كلمات بحث أخرى</p>
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
        /* عرض الفئات */
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
          {categoryOrder.map(category => {
            const products = categorizedProducts[category.name] || [];
            if (products.length === 0) return null;
            
            return (
              <div key={category.name} className="mb-10 sm:mb-16">
                {/* عنوان الفئة */}
                <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-2xl shadow-md">
                  <span className="text-4xl sm:text-5xl">{category.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {products.length} منتج متاح
                    </p>
                  </div>
                </div>
                
                {/* المنتجات */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {products.map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product}
                      onBuyClick={() => {
                        const url = `/landing/${product._id}${affiliateCode ? `?ref=${affiliateCode}` : ''}`;
                        navigate(url);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نموذج الطلب */}
      {orderModalOpen && selectedProduct && (
        <OrderModal
          product={selectedProduct}
          affiliateCode={affiliateCode}
          onClose={() => {
            setOrderModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <h4 className="text-xl sm:text-2xl font-bold mb-2">متجر الإلكترونيات</h4>
            <p className="text-gray-400 text-sm sm:text-base">أفضل الأسعار والعروض في الجزائر 🇩🇿</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 text-sm sm:text-base">
            <Link to="/" className="hover:text-blue-400 transition-colors">الرئيسية</Link>
            <Link to="/register" className="hover:text-blue-400 transition-colors">كن مسوقاً</Link>
            <Link to="/login" className="hover:text-blue-400 transition-colors">تسجيل الدخول</Link>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">
            © 2026 جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}

// بطاقة المنتج للعملاء (بدون معلومات الربح)
function ProductCard({ product, onBuyClick }) {
  return (
    <div 
      id={`product-${product._id}`}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 hover:border-blue-200"
    >
      {/* صورة المنتج */}
      <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = '/products/placeholder.png'; }}
        />
      </div>
      
      {/* معلومات المنتج */}
      <div className="p-3 sm:p-4">
        {/* اسم المنتج */}
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-sm sm:text-base leading-tight min-h-[2.5rem] sm:min-h-[3rem]">
          {product.name}
        </h3>
        
        {/* السعر والزر */}
        <div className="flex items-center justify-between gap-2">
          {/* السعر */}
          <div className="flex-1">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {product.suggested_price}
              <span className="text-sm sm:text-base"> دج</span>
            </p>
          </div>
          
          {/* زر الشراء */}
          <button
            onClick={onBuyClick}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all text-xs sm:text-sm font-bold shadow-md hover:shadow-lg whitespace-nowrap"
          >
            🛒 اشتري الآن
          </button>
        </div>
      </div>
    </div>
  );
}

// نموذج الطلب
function OrderModal({ product, affiliateCode, onClose }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: '',
    quantity: 1,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Sending order data:', {
        productId: product._id,
        ...formData,
        affiliateCode: affiliateCode || null
      });
      
      const response = await api.post('/orders', {
        productId: product._id,
        ...formData,
        affiliateCode: affiliateCode || null
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = product.suggested_price * formData.quantity;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">تم إرسال طلبك بنجاح!</h3>
          <p className="text-gray-600">سنتواصل معك قريباً لتأكيد الطلب</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        {/* رأس النموذج */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">إكمال الطلب 🛒</h3>
              <p className="text-blue-100 text-sm">املأ البيانات لتأكيد الطلب</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-blue-700 rounded-full p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* معلومات المنتج */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex gap-4">
            <img src={product.image} alt={product.name} className="w-20 h-20 object-contain bg-white rounded-lg p-2" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{product.name}</h4>
              <p className="text-2xl font-bold text-blue-600">{product.suggested_price} دج</p>
            </div>
          </div>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* الاسم */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <User className="inline ml-1" size={16} /> الاسم الكامل *
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="أدخل اسمك الكامل"
            />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Phone className="inline ml-1" size={16} /> رقم الهاتف *
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="0555 123 456"
            />
          </div>

          {/* الولاية (غرداية فقط) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <MapPin className="inline ml-1" size={16} /> الولاية
            </label>
            <div className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 rounded-xl text-gray-700 font-bold">
              غرداية 🏜️
            </div>
          </div>

          {/* مكان التوصيل */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <MapPin className="inline ml-1" size={16} /> مكان التوصيل (الحي) *
            </label>
            <textarea
              required
              value={formData.deliveryLocation}
              onChange={(e) => setFormData({...formData, deliveryLocation: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              rows="3"
              placeholder="مثال: حي تاجنينت، بالقرب من مسجد النور، العمارة رقم 15"
            />
            <p className="text-xs text-orange-600 mt-2 flex items-start gap-1">
              <span>⚠️</span>
              <span>يرجى تحديد مكان التوصيل بدقة (اسم الحي، معالم قريبة، رقم العمارة أو المنزل) لضمان وصول الطلب بسرعة</span>
            </p>
          </div>

          {/* الكمية */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الكمية</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية (اختياري)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              rows="2"
              placeholder="أي ملاحظات أو طلبات خاصة..."
            />
          </div>

          {/* المبلغ الإجمالي */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-bold">المبلغ الإجمالي:</span>
              <span className="text-3xl font-bold text-blue-600">{totalAmount} دج</span>
            </div>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : '✅ تأكيد الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerHome;
