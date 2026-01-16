import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { TrendingUp, ShoppingBag, Clock, XCircle, DollarSign, Activity, Copy, Check, Link } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const copyAffiliateCode = async () => {
    try {
      await navigator.clipboard.writeText(user?.affiliateCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

      {/* Affiliate Code Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Link className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">رمز المسوق الخاص بك</h3>
              <p className="text-blue-100 text-sm">استخدمه في روابط التسويق</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-blue-100 mb-1">الكود</p>
              <p className="text-2xl font-mono font-bold">{user?.affiliateCode}</p>
            </div>
            <button
              onClick={copyAffiliateCode}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              {copiedCode ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <p className="text-sm text-blue-100 mb-2">💡 <strong>كيف تستخدم رمزك؟</strong></p>
          <ol className="text-sm text-blue-100 space-y-1 mr-4">
            <li>1. اذهب إلى قسم "المنتجات"</li>
            <li>2. اختر منتج واضغط "نسخ رابط التسويق"</li>
            <li>3. شارك الرابط مع عملائك على فيسبوك، واتساب، أو إنستغرام</li>
            <li>4. عندما يشتري أحد من رابطك، تحصل على ربحك تلقائياً! 🎉</li>
          </ol>
        </div>
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
