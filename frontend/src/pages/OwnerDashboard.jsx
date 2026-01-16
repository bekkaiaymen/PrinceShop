import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBagIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [ownerData, setOwnerData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, direct, affiliate
  const [filters, setFilters] = useState({
    status: 'all',
    orderSource: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = localStorage.getItem('ownerToken');
    const data = localStorage.getItem('ownerData');
    
    if (!token || !data) {
      navigate('/owner/login');
      return;
    }
    
    setOwnerData(JSON.parse(data));
    fetchOrders();
    fetchStatistics();
  }, [page, filters]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('ownerToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });

      const response = await axios.get(`${API_URL}/owner/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data.orders);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('ownerToken');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_URL}/owner/statistics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerData');
    navigate('/owner/login');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const token = localStorage.getItem('ownerToken');
      await axios.patch(
        `${API_URL}/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // تحديث القائمة
      fetchOrders();
      fetchStatistics();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      shipping: 'قيد التوصيل',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/assets/logo.png" alt="Prince Shop" className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prince Shop</h1>
                <p className="text-sm text-gray-600">لوحة تحكم صاحب الموقع</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{ownerData?.username}</p>
                <p className="text-xs text-gray-500">{ownerData?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.overview.totalOrders}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-green-600">مباشر: {statistics.overview.directOrders}</span>
                    <span className="text-purple-600">مسوقين: {statistics.overview.affiliateOrders}</span>
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.overview.totalRevenue.toLocaleString()} دج
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    + {statistics.overview.totalDeliveryFees.toLocaleString()} دج توصيل
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">عمولات المسوقين</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.overview.totalAffiliatePayments.toLocaleString()} دج
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    من {statistics.overview.affiliateOrders} طلب
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">صافي الربح</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.overview.netProfit.toLocaleString()} دج
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    بعد خصم العمولات
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">الفلاتر</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Order Source */}
            <select
              value={filters.orderSource}
              onChange={(e) => handleFilterChange('orderSource', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              <option value="all">كل المصادر</option>
              <option value="direct">طلبات مباشرة</option>
              <option value="affiliate">طلبات المسوقين</option>
            </select>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option>
              <option value="shipping">قيد التوصيل</option>
              <option value="delivered">تم التوصيل</option>
              <option value="cancelled">ملغي</option>
            </select>

            {/* Start Date */}
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              الطلبات ({orders.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنتج</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الزبون</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المصدر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المسوق</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمولة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={order.productImage} 
                          alt={order.productName}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{order.productName}</p>
                          <p className="text-sm text-gray-500">{order.product?.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.orderSource === 'direct' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {order.orderSource === 'direct' ? '🔗 مباشر' : '👥 مسوق'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.affiliate ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.affiliate.name}</p>
                          <p className="text-xs text-gray-500">{order.affiliate.phone}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.totalAmount.toLocaleString()} دج
                        </p>
                        {order.deliveryFee > 0 && (
                          <p className="text-xs text-gray-500">
                            + {order.deliveryFee} دج توصيل
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.affiliateProfit > 0 ? (
                        <span className="text-sm font-medium text-purple-600">
                          {order.affiliateProfit.toLocaleString()} دج
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                              disabled={updatingOrderId === order._id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {updatingOrderId === order._id ? '...' : 'تأكيد'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                              disabled={updatingOrderId === order._id}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {updatingOrderId === order._id ? '...' : 'إلغاء'}
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'shipping')}
                            disabled={updatingOrderId === order._id}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {updatingOrderId === order._id ? '...' : 'قيد التوصيل'}
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                            disabled={updatingOrderId === order._id}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {updatingOrderId === order._id ? '...' : 'تم التوصيل'}
                          </button>
                        )}
                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                          <span className="text-xs text-gray-400">لا توجد إجراءات</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-sm text-gray-700">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
