import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { Package, Clock, Truck, CheckCircle, XCircle, Calendar } from 'lucide-react';

const statusConfig = {
  new: { label: 'جديد', icon: Package, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
  confirmed: { label: 'مؤكد', icon: CheckCircle, color: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
  shipped: { label: 'قيد التوصيل', icon: Truck, color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-yellow-200' },
  delivered: { label: 'تم التسليم', icon: CheckCircle, color: 'bg-green-100 text-green-700', borderColor: 'border-green-200' },
  canceled: { label: 'ملغي', icon: XCircle, color: 'bg-red-100 text-red-700', borderColor: 'border-red-200' },
  returned: { label: 'مرتجع', icon: XCircle, color: 'bg-gray-100 text-gray-700', borderColor: 'border-gray-200' }
};

export default function AffiliateOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const { data } = await affiliate.getOrders({ status: filter });
      setOrders(data.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filters = [
    { value: 'all', label: 'الكل' },
    { value: 'new', label: 'جديد' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'shipped', label: 'قيد التوصيل' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'canceled', label: 'ملغي' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">طلباتي</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">متابعة جميع طلباتك</p>
        </div>
        <div className="bg-blue-50 px-3 sm:px-4 py-2 rounded-lg w-fit">
          <p className="text-xs sm:text-sm text-gray-600">إجمالي الطلبات</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base touch-manipulation ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;

          return (
            <div key={order._id} className={`bg-white rounded-xl p-4 sm:p-6 border-2 ${status.borderColor}`}>
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={order.product.image}
                    alt={order.product.name}
                    className="w-full h-full object-contain p-1 sm:p-2"
                    onError={(e) => e.target.src = '/placeholder.png'}
                  />
                </div>

                {/* Order Details */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                        {order.product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1" />
                        {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${status.color} w-fit`}>
                      <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {status.label}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">الزبون</p>
                        <p className="font-medium text-sm sm:text-base">{order.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">الهاتف</p>
                        <p className="font-medium text-sm sm:text-base">{order.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">العنوان</p>
                        <p className="font-medium text-sm sm:text-base">{order.customer.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">المدينة</p>
                        <p className="font-medium text-sm sm:text-base">{order.customer.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t gap-2">
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">سعر البيع</p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{order.pricing.sellingPrice} دج</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">التوصيل</p>
                        <p className="font-semibold text-orange-600 text-sm sm:text-base">{order.deliveryFee || 0} دج</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
                        <p className="font-semibold text-blue-600 text-sm sm:text-base">{(order.pricing.sellingPrice || 0) + (order.deliveryFee || 0)} دج</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ربحك</p>
                        <p className="font-bold text-green-600 text-sm sm:text-base">{order.pricing.affiliateProfit} دج</p>
                      </div>
                    </div>
                    {order.notes && (
                      <p className="text-xs sm:text-sm text-gray-500 italic">ملاحظة: {order.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد طلبات بعد</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بالتسويق لتظهر طلباتك هنا</p>
        </div>
      )}
    </div>
  );
}
