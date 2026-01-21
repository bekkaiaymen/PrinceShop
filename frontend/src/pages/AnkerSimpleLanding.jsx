import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Shield, Truck, Phone, MapPin, User, Package, Star } from 'lucide-react';
import api from '../services/api';

function AnkerSimpleLanding() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    city: 'غرداية',
    address: '',
    quantity: 1
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const affiliateCode = searchParams.get('ref');
  const productId = '410';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/orders', {
        productId,
        affiliateCode: affiliateCode || null,
        ...formData
      });

      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: getPrice() * formData.quantity,
          currency: 'USD',
          content_name: 'AIR PODS ANKER R50INC',
          content_ids: ['410'],
          content_type: 'product',
          num_items: formData.quantity
        });
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (formData.quantity >= 3) return 2900; // خصم 17%
    if (formData.quantity >= 2) return 3150; // خصم 10%
    return 3500;
  };

  const getDiscount = () => {
    if (formData.quantity >= 3) return '18%';
    if (formData.quantity >= 2) return '11%';
    return '0%';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-black text-white rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-4">شكراً لك! 🎉</h2>
          <p className="text-gray-300 mb-6">
            سنتصل بك خلال دقائق للتأكيد.
            <br />
            التوصيل خلال 24 ساعة لغرداية! 🚀
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <div className="bg-black text-white py-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            <span className="font-bold text-lg">Anker R50i NC</span>
          </div>
          <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full text-sm font-bold">
            <MapPin className="w-4 h-4" />
            <span>توصيل سريع - غرداية</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-4">
              توصيل مجاني بضمان الوكالة الرسمية عين الفهد ✅
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-6">
              سماعة أنكر <span className="text-red-600">Anker R50i NC</span>
            </h1>
            <p className="text-2xl font-bold mb-4 text-gray-800">بسعر 3500 دج فقط! 🔥</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* المنتج */}
            <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
              <div className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xl mb-6 inline-block">
                ⚠️ إلغاء الضوضاء ANC + بطارية 45 ساعة
              </div>
              
              <div className="relative mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500&h=500&fit=crop" 
                  alt="Anker AirPods"
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-right font-bold">محركات ديناميكية 10 ملم (BassUp™)</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-right font-bold">مريحة وخفيفة وبتصميم جديد</span>
                </div>
              </div>
            </div>

            {/* المقارنة */}
            <div className="space-y-6">
              <div className="bg-black text-white rounded-3xl p-6">
                <h3 className="text-2xl font-bold mb-6 text-center">ANKER R50i NC</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">إلغاء الضوضاء النشط (ANC) - 42 ديسيبل</p>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">بطارية 10 ساعات + 45 ساعة مع العلبة</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">4 ميكروفونات مع ذكاء اصطناعي للمكالمات</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">دعم تطبيق Soundcore + حامل هاتف</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">صوت قوي مع تقنية BassUp™</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">مقاومة للماء و الغبار (IP54)</p>
                  </div>
                </div>
              </div>

              <div className="bg-black text-white rounded-3xl p-6">
                <h3 className="text-2xl font-bold mb-4 text-center">السماعات العادية</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">صوت رديء مع تشويش</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">بطارية ضعيفة (2 ساعات فقط)</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">تسقط من الأذن باستمرار</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">تخرب بسرعة - بلا ضمان</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* شهادات العملاء - مثل الصورة 3 */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
            ماذا قالوا عن منتجنا؟ ⭐
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm mb-2">Mohamed_47</p>
                <p className="text-sm">الصوت ولا أروع! نفس جودة AirPods بـ 10 مرات أقل. شكراً!</p>
              </div>
            </div>

            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm mb-2">Sarah_Alger</p>
                <p className="text-sm">🔥 البطارية تدوم معايا اليوم كامل. أحسن من الصينية!</p>
              </div>
            </div>

            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm mb-2">Youcef_Oran</p>
                <p className="text-sm">وصلوني في غرداية في 24 ساعة. أصليين 100%. Top qualité!</p>
              </div>
            </div>

            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm">Vous êtes les meilleurs en Algérie! Merci 🙏</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* عروض الكمية - مثل الصورة 4 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            إذا عندك أكثر من واحد... <span className="text-red-600">خفضنا فيك!</span>
          </h2>
          <p className="text-center text-gray-600 mb-12">سماعة لكل فرد في العائلة بأقل سعر!</p>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* عرض 2 قطع */}
            <div className="border-4 border-black rounded-3xl p-8 text-center relative bg-gray-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm">
                DISCOUNT SPECIAL
              </div>
              
              <p className="text-xl font-bold mb-4 mt-4">عند أخذ سماعتين</p>
              
              <div className="flex justify-center gap-4 mb-6">
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-3xl">🎧</span>
                </div>
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-3xl">🎧</span>
                </div>
              </div>

              <div className="bg-red-600 text-white py-6 px-4 rounded-2xl mb-4">
                <p className="text-sm mb-2">راح تربح:</p>
                <p className="text-4xl font-black">تخفيض 10%</p>
              </div>

              <p className="text-2xl font-bold">
                <span className="line-through text-gray-400">7,000 دج</span>
                <br />
                <span className="text-red-600 text-4xl">6,300 دج</span>
              </p>
            </div>

            {/* عرض 3 قطع */}
            <div className="border-4 border-red-600 rounded-3xl p-8 text-center relative bg-red-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full font-bold text-sm animate-pulse">
                ⚠️ الأكثر طلباً
              </div>
              
              <p className="text-xl font-bold mb-4 mt-4">عند أخذ 3 سماعات</p>
              
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-2xl">🎧</span>
                </div>
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-2xl">🎧</span>
                </div>
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-2xl">🎧</span>
                </div>
              </div>

              <div className="bg-black text-white py-6 px-4 rounded-2xl mb-4">
                <p className="text-sm mb-2">راح تربح:</p>
                <p className="text-4xl font-black">تخفيض 17%</p>
              </div>

              <p className="text-2xl font-bold">
                <span className="line-through text-gray-400">10,500 دج</span>
                <br />
                <span className="text-red-600 text-5xl">8,700 دج</span>
              </p>

              <div className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
                عرض يخفر بخلاص في كل لحصة!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* المصداقية - غرداية */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12">لماذا تختارنا؟</h2>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white border-4 border-black rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">توصيل سريع</h3>
              <p className="text-gray-600">نحن في <span className="font-bold text-red-600">غرداية</span> - التوصيل خلال 24 ساعة فقط!</p>
            </div>

            <div className="bg-white border-4 border-black rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">ضمان + مصداقية</h3>
              <p className="text-gray-600">ضمان رسمي لمدة سنة. آلاف العملاء الراضين في الجزائر!</p>
            </div>

            <div className="bg-white border-4 border-black rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">دفع عند الاستلام</h3>
              <p className="text-gray-600">استلم المنتج، تأكد منه، ثم ادفع. بسيطة!</p>
            </div>
          </div>
        </div>
      </section>

      {/* نموذج الطلب */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white text-black rounded-3xl p-8">
            <h2 className="text-3xl font-black text-center mb-2">اطلب الآن 🚀</h2>
            <p className="text-center text-gray-600 mb-8">املأ البيانات وسنتصل بك فوراً</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="flex items-center gap-2 font-bold mb-2">
                  <User className="w-5 h-5 text-red-600" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:outline-none text-lg"
                  placeholder="أدخل اسمك"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold mb-2">
                  <Phone className="w-5 h-5 text-red-600" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:outline-none text-lg"
                  placeholder="0550123456"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold mb-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  الولاية
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:outline-none text-lg"
                  placeholder="غرداية"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold mb-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  العنوان
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:outline-none resize-none text-lg"
                  rows="3"
                  placeholder="الحي، الشارع، رقم المنزل..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold mb-2">
                  <Package className="w-5 h-5 text-red-600" />
                  الكمية
                </label>
                <select
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:outline-none text-lg font-bold"
                >
                  <option value={1}>1 قطعة - 3,500 دج</option>
                  <option value={2}>2 قطعة - 6,300 دج (خصم 10%)</option>
                  <option value={3}>3 قطع - 8,700 دج (خصم 17%) ⭐</option>
                  <option value={4}>4 قطع - {(2900 * 4).toLocaleString()} دج (خصم 17%)</option>
                  <option value={5}>5 قطع - {(2900 * 5).toLocaleString()} دج (خصم 17%)</option>
                </select>
              </div>

              {formData.quantity >= 2 && (
                <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 text-center">
                  <p className="font-black text-red-600 text-xl">
                    🎉 توفير {getDiscount()} = {((4770 * formData.quantity) - (getPrice() * formData.quantity)).toLocaleString()} دج!
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 text-center">
                <p className="font-black text-2xl">
                  المجموع: <span className="text-red-600 text-4xl">{(getPrice() * formData.quantity).toLocaleString()} دج</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-2xl hover:bg-red-700 transition-all disabled:opacity-50 shadow-xl"
              >
                {loading ? 'جاري الإرسال...' : 'أطلب الآن 🎮'}
              </button>

              <p className="text-center text-sm text-gray-500">
                ✓ دفع عند الاستلام | ✓ توصيل مجاني | ✓ ضمان سنة
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-bold">© 2026 جميع الحقوق محفوظة - غرداية 🏜️</p>
        </div>
      </footer>
    </div>
  );
}

export default AnkerSimpleLanding;
