import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, DollarSign, Package, TrendingUp, Copy, Check, Share2 } from 'lucide-react';
import api from '../services/api';

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyProductInfo = () => {
    const roundedPrice = Math.ceil(product.suggested_price / 10) * 10;
    const priceIncrease = roundedPrice - product.suggested_price;
    const actualProfit = product.affiliate_profit + priceIncrease;
    const text = `
🔥 ${product.name}

💰 السعر: ${roundedPrice} دج
🎁 عمولتك: ${actualProfit.toLocaleString('fr-DZ')} دج
📦 SKU: ${product.sku}

📲 للطلب والاستفسار تواصل معنا
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const roundedPrice = Math.ceil(product.suggested_price / 10) * 10;
    const priceIncrease = roundedPrice - product.suggested_price;
    const actualProfit = product.affiliate_profit + priceIncrease;
    const text = `🔥 ${product.name}\n\n💰 السعر: ${roundedPrice} دج\n🎁 عمولتك: ${actualProfit.toLocaleString('fr-DZ')} دج\n📦 SKU: ${product.sku}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="mt-4 text-indigo-600 font-semibold">جاري التحميل...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-50 to-pink-50">
        <Package size={64} className="text-gray-400 mb-4" />
        <p className="text-2xl text-gray-600 font-bold">المنتج غير موجود</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          العودة للمنتجات
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <ArrowRight size={20} />
            العودة للمنتجات
          </button>
        </div>
      </header>

      {/* Product Details */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="relative">
              <div className="relative h-96 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-xl overflow-hidden shadow-lg">
                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
                  </div>
                )}
                
                {imageError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-indigo-600">
                    <Package size={96} strokeWidth={1.5} />
                    <span className="text-lg mt-4 text-gray-500">صورة المنتج</span>
                  </div>
                ) : (
                  <img
                    src={product.image || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={product.name}
                    onError={() => { setImageError(true); setImageLoading(false); }}
                    onLoad={() => setImageLoading(false)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  />
                )}
              </div>
              
              <span className="absolute top-6 left-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-lg font-bold shadow-xl text-sm">
                {product.category}
              </span>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">{product.name}</h1>
                <p className="text-gray-500 mb-6 font-mono text-sm bg-gray-50 px-4 py-2 rounded-lg inline-block">
                  رمز المنتج: <span className="font-bold text-gray-700">{product.sku}</span>
                </p>

                {/* Pricing */}
                <div className="space-y-4 mb-8 mt-6">
                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
                    <span className="text-gray-700 flex items-center gap-2 font-semibold">
                      <DollarSign size={22} />
                      سعر الجملة
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{product.wholesale_price.toFixed(2)} دج</span>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm border-2 border-indigo-100">
                    <span className="text-indigo-700 flex items-center gap-2 font-bold">
                      <Package size={22} />
                      السعر المقترح
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">{Math.ceil(product.suggested_price / 10) * 10} دج</span>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-lg">
                    <span className="text-green-700 flex items-center gap-2 font-extrabold text-lg">
                      <TrendingUp size={26} />
                      عمولتك (الربح)
                    </span>
                    <span className="text-4xl font-extrabold text-green-600">+{(() => {
                      const roundedPrice = Math.ceil(product.suggested_price / 10) * 10;
                      const priceIncrease = roundedPrice - product.suggested_price;
                      return (product.affiliate_profit + priceIncrease).toLocaleString('fr-DZ');
                    })()} دج</span>
                  </div>
                </div>

                {/* Profit Percentage */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-xl text-center mb-6 shadow-lg">
                  <p className="text-xl font-extrabold">
                    🎯 نسبة الربح: {(() => {
                      const roundedPrice = Math.ceil(product.suggested_price / 10) * 10;
                      const priceIncrease = roundedPrice - product.suggested_price;
                      const actualProfit = product.affiliate_profit + priceIncrease;
                      return ((actualProfit / product.wholesale_price) * 100).toFixed(1);
                    })()}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={copyProductInfo}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {copied ? <Check size={22} /> : <Copy size={22} />}
                  {copied ? '✅ تم النسخ بنجاح!' : 'نسخ معلومات المنتج'}
                </button>

                <button 
                  onClick={shareOnWhatsApp}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Share2 size={22} />
                  مشاركة على واتساب
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
