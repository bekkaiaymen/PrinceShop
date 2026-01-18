import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { TrendingUp, ShoppingBag, Clock, XCircle, DollarSign, Activity, Copy, Check, Link, Sparkles, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import aiService from '../services/ai';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // PWA Install Prompt - يظهر للمسوقين على الجوال
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // التحقق من أن التطبيق غير مثبت + على الجوال
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isMobile && !isStandalone) {
        // إظهار الرسالة بعد 3 ثواني من دخول المسوق للداشبورد
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ تم تثبيت التطبيق بنجاح');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const loadDashboard = async () => {
    try {
      const { data: response } = await affiliate.getDashboard();
      setData(response.data);
      
      // تحديث بيانات المستخدم مع الأرباح الجديدة
      if (response.data.earnings && user) {
        updateUser({
          ...user,
          earnings: response.data.earnings
        });
      }
      
      // تحليل AI للأرباح
      if (response.data.earnings && response.data.stats) {
        loadAIAnalysis(response.data.earnings, response.data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async (earnings, stats) => {
    try {
      setLoadingAI(true);
      const conversionRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
      const analysis = await aiService.analyzeEarnings({
        total: earnings.total,
        available: earnings.available,
        pending: earnings.pending,
        withdrawn: earnings.withdrawn,
        orders: {
          total: stats.total,
          delivered: stats.delivered
        },
        conversionRate
      });
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setLoadingAI(false);
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
      value: `${(user?.earnings?.total || 0).toLocaleString('fr-DZ')} دج`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'رصيد متاح',
      value: `${(user?.earnings?.available || 0).toLocaleString('fr-DZ')} دج`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'رصيد معلق',
      value: `${(user?.earnings?.pending || 0).toLocaleString('fr-DZ')} دج`,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'تم سحبه',
      value: `${(user?.earnings?.withdrawn || 0).toLocaleString('fr-DZ')} دج`,
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
      {/* PWA Install Prompt - يظهر للمسوقين غير المثبتين */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-4 text-white">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-xl flex-shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">ثبّت التطبيق 📱</h3>
                <p className="text-sm text-white/90 mb-3">
                  احصل على تجربة أفضل وأسرع! ثبّت التطبيق على هاتفك للوصول السريع وإدارة أرباحك
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-white text-blue-600 font-bold py-2 px-4 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    تثبيت الآن
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="bg-white/20 text-white font-bold py-2 px-4 rounded-xl hover:bg-white/30 transition-colors"
                  >
                    لاحقاً
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* AI Analysis Card */}
      {(aiAnalysis || loadingAI) && (
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">تحليل AI للأرباح 🤖</h3>
                <p className="text-sm text-gray-600">نصائح ذكية لزيادة أرباحك</p>
              </div>
            </div>
          </div>
          
          {loadingAI ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-600 animate-pulse" />
                <p className="text-gray-600">AI يحلل بياناتك...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-yellow-200">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {aiAnalysis}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Earnings Explanation */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          كيف تعمل الأرباح؟
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-semibold text-gray-900">إجمالي الأرباح</p>
              <p className="text-sm text-gray-600">مجموع كل أرباحك من الطلبات التي تم توصيلها بنجاح</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-900">رصيد متاح</p>
              <p className="text-sm text-gray-600">الأرباح من الطلبات المسلمة - يمكنك سحبها الآن</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-gray-900">رصيد معلق</p>
              <p className="text-sm text-gray-600">الأرباح من الطلبات المؤكدة أو قيد التوصيل - ستصبح متاحة بعد التسليم</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📤</span>
            <div>
              <p className="font-semibold text-gray-900">تم سحبه</p>
              <p className="text-sm text-gray-600">المبلغ الذي سحبته من أرباحك</p>
            </div>
          </div>
        </div>
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
