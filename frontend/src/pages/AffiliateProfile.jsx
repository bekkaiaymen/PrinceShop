import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { User, Mail, Phone, MapPin, CreditCard, Lock, Save } from 'lucide-react';

export default function AffiliateProfile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || ''
  });

  const [paymentData, setPaymentData] = useState({
    baridimob: {
      rip: user?.paymentInfo?.baridimob?.rip || '',
      accountHolder: user?.paymentInfo?.baridimob?.accountHolder || ''
    },
    cash: {
      location: user?.paymentInfo?.cash?.location || '',
      details: user?.paymentInfo?.cash?.details || ''
    }
  });

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || ''
      });
      
      setPaymentData({
        baridimob: {
          rip: user.paymentInfo?.baridimob?.rip || '',
          accountHolder: user.paymentInfo?.baridimob?.accountHolder || ''
        },
        cash: {
          location: user.paymentInfo?.cash?.location || '',
          details: user.paymentInfo?.cash?.details || ''
        }
      });
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await auth.updateProfile(profileData);
      updateUser(data.user);
      setSuccess('تم تحديث الملف الشخصي بنجاح');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('Payment data being sent:', paymentData);

    try {
      const { data } = await auth.updateProfile({
        paymentInfo: paymentData
      });
      console.log('Response from server:', data);
      updateUser(data.user);
      setSuccess('تم تحديث معلومات الدفع بنجاح');
      
      // إعادة تحميل الصفحة بعد ثانيتين لإظهار التحديثات
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error updating payment info:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      await auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('تم تغيير كلمة المرور بنجاح');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'المعلومات الشخصية', icon: User },
    { id: 'payment', label: 'معلومات الدفع', icon: CreditCard },
    { id: 'password', label: 'تغيير كلمة المرور', icon: Lock }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{user?.name}</h1>
            <p className="text-blue-600 font-mono text-xs sm:text-base">{user?.affiliateCode}</p>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4 inline ml-2" />
                الاسم الكامل
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 inline ml-2" />
                رقم الهاتف
              </label>
              <input
                type="tel"
                required
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline ml-2" />
                المدينة
              </label>
              <input
                type="text"
                required
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">معلومات طرق الدفع</h3>
            <p className="text-sm text-gray-600">املأ معلومات طرق الدفع المتاحة. ستستخدم هذه المعلومات عند طلب السحب.</p>
          </div>

          <form onSubmit={handlePaymentUpdate} className="space-y-6">
            {/* بريدي موب */}
            <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                بريدي موب (Baridimob)
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم RIP (20 رقم)
                  </label>
                  <input
                    type="text"
                    placeholder="00799999001234567890"
                    value={paymentData.baridimob.rip}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      baridimob: { ...paymentData.baridimob, rip: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    maxLength="20"
                  />
                  <p className="text-xs text-gray-500 mt-1">أدخل رقم RIP الخاص ببريدي موب (20 رقم)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم صاحب الحساب
                  </label>
                  <input
                    type="text"
                    placeholder="الاسم الكامل كما في البطاقة"
                    value={paymentData.baridimob.accountHolder}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      baridimob: { ...paymentData.baridimob, accountHolder: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* الدفع النقدي */}
            <div className="border-2 border-green-100 rounded-xl p-4 bg-green-50">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                الدفع النقدي (Cash)
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مكان الاستلام
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الجزائر العاصمة - باب الوادي"
                    value={paymentData.cash.location}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cash: { ...paymentData.cash, location: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">أين تريد استلام الأموال نقداً؟</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تفاصيل إضافية
                  </label>
                  <textarea
                    placeholder="مثال: أمام مقهى النصر، بجانب البريد المركزي"
                    value={paymentData.cash.details}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      cash: { ...paymentData.cash, details: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">معلومات إضافية لتسهيل الاستلام</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
            >
              <Save className="w-5 h-5" />
              {loading ? 'جاري الحفظ...' : 'حفظ معلومات الدفع'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
