import React, { useState, useEffect } from 'react';
import { 
  Users, Package, ShoppingBag, TrendingUp, DollarSign, 
  Phone, MapPin, Eye, CheckCircle, Clock, Truck, XCircle 
} from 'lucide-react';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalAffiliates: 0,
    totalProducts: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippingOrders: 0,
    deliveredOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topAffiliates, setTopAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, affiliatesRes, productsRes] = await Promise.all([
        axios.get('/api/admin/orders'),
        axios.get('/api/admin/affiliates'),
        axios.get('/api/products')
      ]);

      const orders = ordersRes.data.orders || [];
      const affiliates = affiliatesRes.data.affiliates || [];
      
      // حساب الإحصائيات
      const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const pending = orders.filter(o => o.status === 'pending').length;
      const confirmed = orders.filter(o => o.status === 'confirmed').length;
      const shipping = orders.filter(o => o.status === 'shipping').length;
      const delivered = orders.filter(o => o.status === 'delivered').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue: revenue,
        totalAffiliates: affiliates.length,
        totalProducts: productsRes.data.count || 0,
        pendingOrders: pending,
        confirmedOrders: confirmed,
        shippingOrders: shipping,
        deliveredOrders: delivered
      });

      setRecentOrders(orders.slice(0, 10));
      setTopAffiliates(affiliates.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    pending: { label: 'قيد الانتظار', color: 'yellow', icon: Clock },
    confirmed: { label: 'مؤكد', color: 'blue', icon: CheckCircle },
    shipping: { label: 'قيد التوصيل', color: 'purple', icon: Truck },
    delivered: { label: 'تم التوصيل', color: 'green', icon: CheckCircle },
    cancelled: { label: 'ملغي', color: 'red', icon: XCircle }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* الرأس */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Users className="text-blue-600" size={40} />
          لوحة تحكم المدير
        </h1>
        <p className="text-gray-600">نظرة شاملة على جميع العمليات والمسوقين</p>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="blue"
          subtitle="جميع الطلبات"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString()} دج`}
          icon={DollarSign}
          color="green"
          subtitle="إجمالي المبيعات"
        />
        <StatCard
          title="عدد المسوقين"
          value={stats.totalAffiliates}
          icon={Users}
          color="purple"
          subtitle="المسوقين النشطين"
        />
        <StatCard
          title="عدد المنتجات"
          value={stats.totalProducts}
          icon={Package}
          color="orange"
          subtitle="المنتجات المتاحة"
        />
      </div>

      {/* إحصائيات حالة الطلبات */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={28} />
          حالة الطلبات
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OrderStatusCard status="pending" count={stats.pendingOrders} label="قيد الانتظار" color="yellow" />
          <OrderStatusCard status="confirmed" count={stats.confirmedOrders} label="مؤكد" color="blue" />
          <OrderStatusCard status="shipping" count={stats.shippingOrders} label="قيد التوصيل" color="purple" />
          <OrderStatusCard status="delivered" count={stats.deliveredOrders} label="تم التوصيل" color="green" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أحدث الطلبات */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="text-blue-600" size={28} />
            أحدث الطلبات
          </h2>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد طلبات</p>
            ) : (
              recentOrders.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  statusConfig={statusConfig}
                  onViewDetails={() => setSelectedOrder(order)}
                />
              ))
            )}
          </div>
        </div>

        {/* أفضل المسوقين */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-blue-600" size={28} />
            أفضل المسوقين
          </h2>
          <div className="space-y-3">
            {topAffiliates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا يوجد مسوقين</p>
            ) : (
              topAffiliates.map((affiliate, index) => (
                <AffiliateCard key={affiliate._id} affiliate={affiliate} rank={index + 1} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          statusConfig={statusConfig}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

// بطاقة إحصائية
function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={40} className="opacity-80" />
      </div>
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-sm opacity-90">{title}</p>
      {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
    </div>
  );
}

// بطاقة حالة الطلب
function OrderStatusCard({ status, count, label, color }) {
  const colors = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    green: 'bg-green-100 text-green-800 border-green-300'
  };

  return (
    <div className={`${colors[color]} border-2 rounded-xl p-4 text-center`}>
      <div className="text-4xl font-bold">{count}</div>
      <div className="text-sm mt-2">{label}</div>
    </div>
  );
}

// بطاقة الطلب المصغرة
function OrderCard({ order, statusConfig, onViewDetails }) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all border border-gray-200">
      <div className="flex items-start gap-3">
        <img 
          src={order.productImage} 
          alt={order.productName}
          className="w-16 h-16 object-contain bg-white rounded-lg p-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon size={14} className={`text-${status.color}-600`} />
            <span className={`text-xs font-bold text-${status.color}-600`}>{status.label}</span>
          </div>
          <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{order.productName}</h4>
          <p className="text-xs text-gray-600">{order.customerName} • {order.customerPhone}</p>
          {order.affiliate && (
            <p className="text-xs text-purple-600 font-bold mt-1">
              👤 مسوق: {order.affiliate.name}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-blue-600">{order.totalAmount} دج</span>
            <button
              onClick={onViewDetails}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Eye size={14} className="inline ml-1" />
              عرض
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// بطاقة المسوق
function AffiliateCard({ affiliate, rank }) {
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{medals[rank - 1] || '🏅'}</div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{affiliate.name}</h4>
          <p className="text-sm text-gray-600 font-mono">{affiliate.affiliateCode}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-blue-600 font-bold">
              📦 {affiliate.totalOrders || 0} طلب
            </span>
            <span className="text-green-600 font-bold">
              💰 {(affiliate.totalProfit || 0).toLocaleString()} دج
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// نافذة تفاصيل الطلب
function OrderDetailsModal({ order, statusConfig, onClose }) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* الرأس */}
        <div className={`bg-${status.color}-100 text-${status.color}-800 p-6 rounded-t-2xl border-b-4 border-${status.color}-300`}>
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">📦 المنتج</h3>
            <div className="bg-gray-50 rounded-xl p-4 flex gap-4">
              <img 
                src={order.productImage} 
                alt={order.productName}
                className="w-32 h-32 object-contain bg-white rounded-xl p-2"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-2">{order.productName}</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">السعر:</span> <span className="font-bold">{order.productPrice} دج</span></p>
                  <p><span className="text-gray-600">الكمية:</span> <span className="font-bold">{order.quantity}</span></p>
                  <p className="text-xl font-bold text-blue-600 mt-2">المجموع: {order.totalAmount} دج</p>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الزبون */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">👤 معلومات الزبون</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div><span className="text-gray-600">الاسم:</span> <span className="font-bold">{order.customerName}</span></div>
              <div><span className="text-gray-600">الهاتف:</span> <span className="font-mono font-bold">{order.customerPhone}</span></div>
              <div><span className="text-gray-600">الولاية:</span> <span className="font-bold">غرداية</span></div>
              <div>
                <span className="text-gray-600">مكان التوصيل:</span> 
                <span className="font-bold">{order.deliveryLocation}</span>
                
                {/* عرض الموقع على الخريطة */}
                {order.deliveryCoordinates && order.deliveryCoordinates.lat && (
                  <div className="mt-3">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      📍 موقع محدد بدقة
                    </span>
                    <div className="mt-2 border rounded-lg overflow-hidden" style={{ height: '150px' }}>
                      <iframe
                        src={`https://www.google.com/maps?q=${order.deliveryCoordinates.lat},${order.deliveryCoordinates.lng}&z=16&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* معلومات المسوق */}
          {order.affiliate && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">👨‍💼 معلومات المسوق</h3>
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="space-y-2">
                  <div><span className="text-gray-600">الاسم:</span> <span className="font-bold">{order.affiliate.name}</span></div>
                  <div><span className="text-gray-600">الرمز:</span> <span className="font-mono font-bold">{order.affiliate.affiliateCode}</span></div>
                  <div><span className="text-gray-600">الهاتف:</span> <span className="font-bold">{order.affiliate.phone}</span></div>
                  <div className="pt-2 border-t border-purple-300">
                    <span className="text-gray-600">ربح المسوق:</span> 
                    <span className="text-2xl font-bold text-green-600 mr-2">{order.affiliateProfit} دج</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الملاحظات */}
          {order.notes && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📝 ملاحظات</h3>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* التاريخ */}
          <div className="text-sm text-gray-600 text-center border-t pt-4">
            تم الطلب في: {new Date(order.createdAt).toLocaleString('ar-DZ', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
