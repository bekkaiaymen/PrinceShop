import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { TrendingUp, ShoppingBag, Clock, XCircle, DollarSign, Activity } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: response } = await affiliate.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  const stats = [
    {
      title: 'إجمالي الأرباح',
      value: `${data?.earnings?.total || 0} دج`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'رصيد متاح',
      value: `${data?.earnings?.available || 0} دج`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'رصيد معلق',
      value: `${data?.earnings?.pending || 0} دج`,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'تم سحبه',
      value: `${data?.earnings?.withdrawn || 0} دج`,
      icon: Activity,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const orderStats = [
    {
      title: 'إجمالي الطلبات',
      value: data?.stats?.total || 0,
      icon: ShoppingBag,
      color: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'طلبات جديدة',
      value: data?.stats?.new || 0,
      icon: Clock,
      color: 'border-yellow-200',
      textColor: 'text-yellow-600'
    },
    {
      title: 'تم التسليم',
      value: data?.stats?.delivered || 0,
      icon: TrendingUp,
      color: 'border-green-200',
      textColor: 'text-green-600'
    },
    {
      title: 'ملغاة',
      value: data?.stats?.canceled || 0,
      icon: XCircle,
      color: 'border-red-200',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">متابعة أرباحك وطلباتك</p>
      </div>

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-4 sm:p-6 border border-gray-100`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">{stat.title}</h3>
            <p className={`text-xl sm:text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Stats */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">إحصائيات الطلبات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {orderStats.map((stat, index) => (
            <div key={index} className={`bg-white rounded-xl p-4 sm:p-6 border-2 ${stat.color}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.textColor}`} />
                <span className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
              </div>
              <h3 className="text-gray-700 font-medium text-sm sm:text-base">{stat.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Rate */}
      {data?.stats?.total > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">نسبة التحويل</h3>
              <p className="text-gray-600">نسبة الطلبات المسلمة من إجمالي الطلبات</p>
            </div>
            <div className="text-4xl font-bold text-blue-600">
              {data?.stats?.conversionRate}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
