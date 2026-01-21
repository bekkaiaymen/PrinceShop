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
    if (formData.quantity >= 3) return 3910; // خصم 18%
    if (formData.quantity >= 2) return 4245; // خصم 11%
    return 4770;
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
            <span className="font-bold text-lg">AIR PODS ANKER</span>
          </div>
          <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full text-sm font-bold">
            <MapPin className="w-4 h-4" />
            <span>توصيل سريع - غرداية</span>
          </div>
        </div>
      </div>

      {/* Hero - مثل الصورة الأولى */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg mb-4">
              عاش أفضل محزية لطفلك! 🎮
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-6">
              جهاز ألعاب <span className="text-red-600">500 لعبة</span>
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* المنتج */}
            <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
              <div className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-2xl mb-6 inline-block">
                ⚠️ 500 لعبة ممتعة داخل هذا الجهاز
              </div>
              
              <div className="relative mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop" 
                  alt="Gaming Console"
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-right font-bold">للكبار والصغار</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-right font-bold">راح يخليو بالمرحة وبيسا العاشق!</span>
                </div>
              </div>
            </div>

            {/* المقارنة - مثل الصورة الأولى */}
            <div className="space-y-6">
              <div className="bg-black text-white rounded-3xl p-6">
                <h3 className="text-2xl font-bold mb-6 text-center">المنتج</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">يتخصص مستوى الذكاء والتركيز</p>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">ألعاب تنفي التحليل والاستنتاج لذكى طفلك</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">شاشة صغيرة و أشعة ضارة</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">10 مرات أرخص من الهاتف</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">يجعله ينشارك اللعب مع الأهل والأصدقاء</p>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl">
                    <div className="text-green-400 text-xl">●</div>
                    <p className="flex-1">سهل الاستعمال</p>
                  </div>
                </div>
              </div>

              <div className="bg-black text-white rounded-3xl p-6">
                <h3 className="text-2xl font-bold mb-4 text-center">الهاتف</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">شبكة مخترة بالحصر</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">غالي الثمن / تضليحة مكلف</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">يخدمه للعزلة و الوحدة</p>
                  </div>

                  <div className="flex items-start gap-3 bg-red-600/20 p-4 rounded-xl border-2 border-red-600">
                    <div className="text-red-400 text-xl">●</div>
                    <p className="flex-1 text-red-400">معقد لا يصلح للصغار</p>
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
                <p className="text-sm mb-2">Slm alikom</p>
                <p className="text-sm">jai bien recu ma cmnd vraiment yaarikoم saha</p>
              </div>
            </div>

            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm mb-2">▶ Video</p>
                <p className="text-sm">🔥بشكرك الجدية ليوم حديت بيه وتباع وصحاح الله</p>
              </div>
            </div>

            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm mb-2">Slm I3z2</p>
                <p className="text-sm">C bon</p>
                <p className="text-sm">ay hatra la commande qualité top</p>
              </div>
            </div>

            <div className="bg-white text-black rounded-2xl p-6">
              <div className="flex gap-1 mb-3 justify-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                <p className="text-sm">Vous êtes les meilleurs en Algérie</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* عروض الكمية - مثل الصورة 4 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            إذا عندك أكثر من طفل... <span className="text-red-600">خفضنا فيك!</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* عرض 2 قطع */}
            <div className="border-4 border-black rounded-3xl p-8 text-center relative bg-gray-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm">
                DISCOUNT SPECIAL
              </div>
              
              <p className="text-xl font-bold mb-4 mt-4">عند أخذ قطعتين</p>
              
              <div className="flex justify-center gap-4 mb-6">
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="bg-red-600 text-white py-6 px-4 rounded-2xl mb-4">
                <p className="text-sm mb-2">راح تربح:</p>
                <p className="text-4xl font-black">تخفيض 11%</p>
              </div>

              <p className="text-2xl font-bold">
                <span className="line-through text-gray-400">9,540 دج</span>
                <br />
                <span className="text-red-600 text-4xl">8,490 دج</span>
              </p>
            </div>

            {/* عرض 3 قطع */}
            <div className="border-4 border-red-600 rounded-3xl p-8 text-center relative bg-red-50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full font-bold text-sm animate-pulse">
                ⚠️ الأكثر طلباً
              </div>
              
              <p className="text-xl font-bold mb-4 mt-4">عند أخذ 3 قطع</p>
              
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="bg-black text-white py-6 px-4 rounded-2xl mb-4">
                <p className="text-sm mb-2">راح تربح:</p>
                <p className="text-4xl font-black">تخفيض 18%</p>
              </div>

              <p className="text-2xl font-bold">
                <span className="line-through text-gray-400">14,310 دج</span>
                <br />
                <span className="text-red-600 text-5xl">11,730 دج</span>
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
                  <option value={1}>1 قطعة - 4,770 دج</option>
                  <option value={2}>2 قطعة - 8,490 دج (خصم 11%)</option>
                  <option value={3}>3 قطع - 11,730 دج (خصم 18%) ⭐</option>
                  <option value={4}>4 قطع - {(3910 * 4).toLocaleString()} دج (خصم 18%)</option>
                  <option value={5}>5 قطع - {(3910 * 5).toLocaleString()} دج (خصم 18%)</option>
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
