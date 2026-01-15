import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function ImageVerification() {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await axios.get('/api/products');
      setProducts(data.products);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsCorrect = () => {
    goToNext();
  };

  const markAsIncorrect = () => {
    const product = products[currentIndex];
    if (!issues.find(i => i._id === product._id)) {
      setIssues([...issues, product]);
    }
    goToNext();
  };

  const goToNext = () => {
    if (currentIndex < products.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const downloadIssues = () => {
    const data = JSON.stringify(issues, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'image_issues.json';
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const product = products[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            التحقق من الصور
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-gray-600">
                المنتج {currentIndex + 1} من {products.length}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">مشاكل محتملة</p>
              <p className="text-2xl font-bold text-red-600">{issues.length}</p>
            </div>
          </div>
        </div>

        {/* Product Display */}
        {product && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-6">
            {/* Product Image */}
            <div className="bg-gray-100 rounded-xl p-6 mb-6 flex items-center justify-center" style={{ minHeight: '400px' }}>
              <img
                src={product.image}
                alt={product.name}
                className="max-w-full max-h-96 object-contain"
                onError={(e) => {
                  e.target.src = '/products/placeholder.png';
                }}
              />
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">اسم المنتج</p>
                <p className="text-xl font-bold text-gray-900">{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-mono text-gray-900">{product.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">السعر</p>
                  <p className="font-bold text-gray-900">{product.suggested_price} دج</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">مسار الصورة</p>
                <p className="font-mono text-xs text-gray-600">{product.image}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={markAsCorrect}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg"
          >
            <Check className="w-6 h-6" />
            صحيحة ✓
          </button>
          <button
            onClick={markAsIncorrect}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg"
          >
            <X className="w-6 h-6" />
            خاطئة ✗
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-5 h-5" />
            السابق
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === products.length - 1}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Download Issues */}
        {issues.length > 0 && (
          <button
            onClick={downloadIssues}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg"
          >
            <AlertTriangle className="w-6 h-6" />
            تحميل قائمة المشاكل ({issues.length})
          </button>
        )}
      </div>
    </div>
  );
}
