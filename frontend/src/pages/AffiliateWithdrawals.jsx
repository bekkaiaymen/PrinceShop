import { useState, useEffect } from 'react';
import { affiliate } from '../services/api';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending: { label: 'قيد المراجعة', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'تمت الموافقة', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'bg-red-100 text-red-700' },
  completed: { label: 'مكتمل', icon: CheckCircle, color: 'bg-green-100 text-green-700' }
};

export default function AffiliateWithdrawals() {
  const { user, updateUser } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWithdrawals();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: response } = await affiliate.getDashboard();
      if (response.data.earnings && user) {
        updateUser({
          ...user,
          earnings: response.data.earnings
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const { data } = await affiliate.getWithdrawals();
      console.log('Withdrawals data:', data);
      setWithdrawals(data.data || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentMethod) {
      setError('الرجاء اختيار طريقة الدفع');
      return;
    }

    // Check if payment info is filled
    if (paymentMethod === 'baridimob' && !user?.paymentInfo?.baridimob?.rip) {
      setError('الرجاء ملء معلومات بريدي موب في صفحة الإعدادات أولاً');
      return;
    }

    if (paymentMethod === 'cash' && !user?.paymentInfo?.cash?.location) {
      setError('الرجاء ملء معلومات الدفع النقدي في صفحة الإعدادات أولاً');
      return;
    }

    setSubmitting(true);

    try {
      await affiliate.requestWithdrawal({ 
        amount: Number(amount),
        paymentMethod 
      });
      setSuccess('تم إرسال طلب السحب بنجاح! سيتم مراجعته قريباً.');
      setAmount('');
      setPaymentMethod('');
      setShowForm(false);
      loadWithdrawals();
      // Reload user data to update available balance
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء طلب السحب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const availableBalance = user?.earnings?.available || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">السحوبات</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">اطلب سحب أرباحك</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <h3 className="text-xs sm:text-sm text-gray-600">رصيد متاح</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">{availableBalance} دج</p>
          <p className="text-xs text-gray-500 mt-1 sm:mt-2">يمكنك سحبه الآن</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 sm:p-6 border border-yellow-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            <h3 className="text-xs sm:text-sm text-gray-600">رصيد معلق</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{user?.earnings?.pending || 0} دج</p>
          <p className="text-xs text-gray-500 mt-1 sm:mt-2">في انتظار التسليم</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h3 className="text-xs sm:text-sm text-gray-600">تم سحبه</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700">{user?.earnings?.withdrawn || 0} دج</p>
          <p className="text-xs text-gray-500 mt-1 sm:mt-2">إجمالي ما سحبته</p>
        </div>
      </div>

      {/* Request Withdrawal Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          disabled={availableBalance < 100}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
        >
          طلب سحب جديد
        </button>
      )}

      {availableBalance < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">الحد الأدنى للسحب</p>
            <p className="text-sm text-yellow-700">يجب أن يكون لديك 100 دج على الأقل لطلب السحب</p>
          </div>
        </div>
      )}

      {/* Withdrawal Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border-2 border-green-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">طلب سحب جديد</h3>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* اختيار طريقة الدفع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                طريقة الدفع
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* بريدي موب */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('baridimob')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'baridimob'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'baridimob' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">بريدي موب</span>
                  </div>
                  {user?.paymentInfo?.baridimob?.rip ? (
                    <div className="text-xs text-left">
                      <p className="text-gray-600">RIP: {user.paymentInfo.baridimob.rip}</p>
                      <p className="text-gray-500">{user.paymentInfo.baridimob.accountHolder}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500">لم يتم ملء المعلومات</p>
                  )}
                </button>

                {/* نقدي */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">نقداً</span>
                  </div>
                  {user?.paymentInfo?.cash?.location ? (
                    <div className="text-xs text-left">
                      <p className="text-gray-600">{user.paymentInfo.cash.location}</p>
                      {user.paymentInfo.cash.details && (
                        <p className="text-gray-500 line-clamp-1">{user.paymentInfo.cash.details}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-500">لم يتم ملء المعلومات</p>
                  )}
                </button>
              </div>
            </div>

            {/* المبلغ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المبلغ (دج)
              </label>
              <input
                type="number"
                required
                min="100"
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="المبلغ المطلوب"
              />
              <p className="text-xs text-gray-500 mt-1">
                الحد الأدنى: 100 دج | المتاح: {availableBalance} دج
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !paymentMethod}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setPaymentMethod('');
                  setAmount('');
                }}
                className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Withdrawals History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">سجل السحوبات</h2>
        
        {withdrawals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">لم تقم بأي طلب سحب بعد</p>
            <p className="text-sm text-gray-400">عندما يصبح لديك رصيد متاح ≥ 100 دج، يمكنك طلب السحب</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => {
              const status = statusConfig[withdrawal.status];
              const StatusIcon = status.icon;

            return (
              <div key={withdrawal._id} className="bg-white rounded-lg p-5 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {withdrawal.amount} دج
                      </span>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString('ar-DZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {withdrawal.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">ملاحظة: {withdrawal.notes}</p>
                    )}
                    {withdrawal.adminNotes && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>رد الإدارة:</strong> {withdrawal.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
