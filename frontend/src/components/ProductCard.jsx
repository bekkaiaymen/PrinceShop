import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package } from 'lucide-react';

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl fade-in"
    >
      {/* Image */}
      <div className="relative h-56 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-indigo-600">
            <Package size={64} strokeWidth={1.5} />
            <span className="text-sm mt-2 text-gray-500">صورة المنتج</span>
          </div>
        ) : (
          <img
            src={product.image || 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={product.name}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
        
        <span className="absolute top-3 right-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-lg">
          {product.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        <p className="text-xs text-gray-500 mb-4 font-mono">SKU: {product.sku}</p>

        {/* Pricing */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600 font-semibold">السعر المقترح</span>
            <span className="text-xl font-bold text-indigo-600">{product.suggested_price.toFixed(2)} دج</span>
          </div>

          <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border-2 border-green-200">
            <span className="text-sm text-green-700 font-bold flex items-center gap-2">
              <TrendingUp size={18} />
              عمولتك
            </span>
            <span className="text-xl font-extrabold text-green-600">+{product.affiliate_profit.toFixed(2)} دج</span>
          </div>
        </div>

        {/* Button */}
        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg">
          عرض التفاصيل
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
