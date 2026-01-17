import React, { useState, useEffect } from 'react';
import { Package, Phone, MapPin, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      
      const { data } = await api.get('/orders', { params });
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('حدث خطأ في تحديث الطلب');
    }
  };

  const statusConfig = {
    pending: { label: 'قيد الانتظار', color: 'yellow', icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    confirmed: { label: 'مؤكد', color: 'blue', icon: CheckCircle, bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    shipping: { label: 'قيد التوصيل', color: 'purple', icon: Truck, bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    delivered: { label: 'تم التوصيل', color: 'green', icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    cancelled: { label: 'ملغي', color: 'red', icon: XCircle, bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  };

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="p-6">
      {/* الرأس */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Package className="text-blue-600" size={40} />
          إدارة الطلبات
        </h1>
        <p className="text-gray-600">عرض وإدارة جميع طلبات الزبائن</p>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="الكل" value={stats.all} active={filter === 'all'} onClick={() => setFilter('all')} color="gray" />
        <StatCard label="قيد الانتظار" value={stats.pending} active={filter === 'pending'} onClick={() => setFilter('pending')} color="yellow" />
        <StatCard label="مؤكد" value={stats.confirmed} active={filter === 'confirmed'} onClick={() => setFilter('confirmed')} color="blue" />
        <StatCard label="قيد التوصيل" value={stats.shipping} active={filter === 'shipping'} onClick={() => setFilter('shipping')} color="purple" />
        <StatCard label="تم التوصيل" value={stats.delivered} active={filter === 'delivered'} onClick={() => setFilter('delivered')} color="green" />
      </div>

      {/* جدول الطلبات */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">جاري تحميل الطلبات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <Package size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات</h3>
          <p className="text-gray-600">لم يتم استقبال أي طلبات بعد</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <OrderCard 
              key={order._id} 
              order={order} 
              statusConfig={statusConfig}
              onStatusChange={updateOrderStatus}
              onViewDetails={() => setSelectedOrder(order)}
              isAffiliate={user?.role === 'affiliate'}
            />
          ))}
        </div>
      )}

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          statusConfig={statusConfig}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
          isAffiliate={user?.role === 'affiliate'}
        />
      )}
    </div>
  );
}

// بطاقة إحصائية
function StatCard({ label, value, active, onClick, color }) {
  const colors = {
    gray: 'border-gray-300 bg-gray-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    blue: 'border-blue-300 bg-blue-50',
    purple: 'border-purple-300 bg-purple-50',
    green: 'border-green-300 bg-green-50'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all ${active ? 'ring-4 ring-blue-200 scale-105' : 'hover:scale-105'} ${colors[color]}`}
    >
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </button>
  );
}

// بطاقة الطلب
function OrderCard({ order, statusConfig, onStatusChange, onViewDetails, isAffiliate = false }) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* معلومات المنتج */}
          <div className="flex gap-4 flex-1">
            <img 
              src={order.productImage} 
              alt={order.productName}
              className="w-24 h-24 object-contain bg-gray-50 rounded-xl p-2"
            />
            <div className="flex-1">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-2 ${status.bg} ${status.text} border-2 ${status.border}`}>
                <StatusIcon size={16} />
                {status.label}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{order.productName}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="text-gray-600">
                  <span className="text-xs">سعر السلعة:</span>
                  <span className="font-bold text-gray-900 mr-1">{order.productPrice} دج</span>
                </div>
                <div className="text-gray-600">
                  <span className="text-xs">الكمية:</span>
                  <span className="font-bold text-gray-900 mr-1">{order.quantity}</span>
                </div>
                <div className="text-gray-600">
                  <span className="text-xs">التوصيل:</span>
                  <span className="font-bold text-orange-600 mr-1">{order.deliveryFee || 0} دج</span>
                </div>
                <div className="text-blue-600">
                  <span className="text-xs">المجموع:</span>
                  <span className="font-bold text-xl mr-1">{order.totalAmount} دج</span>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الزبون */}
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-blue-600" />
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              <span className="font-mono">{order.customerPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              <span className="line-clamp-1">غرداية - {order.deliveryLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span>{new Date(order.createdAt).toLocaleString('ar-DZ')}</span>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex flex-col gap-2 lg:w-48">
            <button
              onClick={onViewDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Eye size={18} />
              عرض التفاصيل
            </button>
            
            {!isAffiliate && (
              <>
                {order.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'confirmed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    ✅ تأكيد
                  </button>
                )}
                
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'shipping')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                  >
                    🚚 شحن
                  </button>
                )}
                
                {order.status === 'shipping' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'delivered')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    ✅ تم التوصيل
                  </button>
                )}
                
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => onStatusChange(order._id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    ❌ إلغاء
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// نافذة تفاصيل الطلب
function OrderDetailsModal({ order, statusConfig, onClose, onStatusChange, isAffiliate = false }) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* الرأس */}
        <div className={`${status.bg} ${status.text} p-6 rounded-t-2xl border-b-4 ${status.border}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusIcon size={32} />
                <h2 className="text-3xl font-bold">{status.label}</h2>
              </div>
              <p className="opacity-80">رقم الطلب: {order._id.slice(-8)}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <XCircle size={28} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* معلومات المنتج */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={24} className="text-blue-600" />
              معلومات المنتج
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 flex gap-4">
              <img 
                src={order.productImage} 
                alt={order.productName}
                className="w-32 h-32 object-contain bg-white rounded-xl p-2"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-3">{order.productName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                    <span className="text-gray-600">سعر السلعة:</span>
                    <span className="font-bold text-gray-900">{order.productPrice} دج</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                    <span className="text-gray-600">الكمية:</span>
                    <span className="font-bold text-gray-900">{order.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                    <span className="text-gray-600">سعر التوصيل:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-orange-600">{order.deliveryFee || 0} دج</span>
                      {order.deliveryTime && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.deliveryTime === 'morning' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.deliveryTime === 'morning' ? '🌅 صباحاً' : '🌙 مساءً'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                    <span className="text-gray-900 font-bold">المجموع:</span>
                    <span className="text-xl font-bold text-blue-600">{order.totalAmount} دج</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الزبون */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={24} className="text-blue-600" />
              معلومات الزبون
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">الاسم:</span>
                <span className="font-bold">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">الهاتف:</span>
                <span className="font-mono font-bold">{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">الولاية:</span>
                <span className="font-bold">غرداية 🏜️</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-600 w-32">مكان التوصيل:</span>
                <div className="flex-1">
                  <span className="font-bold block mb-2">{order.deliveryLocation}</span>
                  
                  {/* عرض الموقع على الخريطة إذا كانت الإحداثيات موجودة */}
                  {order.deliveryCoordinates && order.deliveryCoordinates.lat && order.deliveryCoordinates.lng && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          📍 تم تحديد الموقع بدقة
                          {order.deliveryCoordinates.method === 'current' && ' (الموقع الحالي)'}
                        </span>
                      </div>
                      
                      {/* خريطة صغيرة */}
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                        <iframe
                          src={`https://www.google.com/maps?q=${order.deliveryCoordinates.lat},${order.deliveryCoordinates.lng}&z=16&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                        ></iframe>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                        <span className="font-mono text-gray-600">
                          {order.deliveryCoordinates.lat.toFixed(6)}, {order.deliveryCoordinates.lng.toFixed(6)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${order.deliveryCoordinates.lat},${order.deliveryCoordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          فتح في Google Maps ←
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* الملاحظات */}
          {order.notes && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ملاحظات</h3>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* تاريخ الطلب */}
          <div className="text-sm text-gray-600 text-center border-t pt-4">
            تم الطلب في: {new Date(order.createdAt).toLocaleString('ar-DZ', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}
          </div>

          {/* أزرار الإجراءات */}
          {!isAffiliate ? (
            <div className="grid grid-cols-2 gap-3">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      onStatusChange(order._id, 'confirmed');
                      onClose();
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    ✅ تأكيد الطلب
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange(order._id, 'cancelled');
                      onClose();
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    ❌ إلغاء الطلب
                  </button>
                </>
              )}
              
              {order.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => {
                      onStatusChange(order._id, 'shipping');
                      onClose();
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                  >
                    🚚 شحن الطلب
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange(order._id, 'cancelled');
                      onClose();
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    ❌ إلغاء
                  </button>
                </>
              )}
              
              {order.status === 'shipping' && (
                <button
                  onClick={() => {
                    onStatusChange(order._id, 'delivered');
                    onClose();
                  }}
                  className="col-span-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  ✅ تم التوصيل
                </button>
              )}
              
              <button
                onClick={onClose}
                className={`${order.status === 'delivered' || order.status === 'cancelled' ? 'col-span-2' : 'col-span-2'} px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors`}
              >
                إغلاق
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;
