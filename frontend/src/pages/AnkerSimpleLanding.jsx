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
    quantity: 1,
    deliveryTime: 'morning',
    notes: ''
  });
  const [includeUpsell, setIncludeUpsell] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const affiliateCode = searchParams.get('ref');
  const productId = '410';
  const upsellProductId = '619'; // الشاحن
  const upsellPrice = 500;
  const upsellShipping = 50; // توصيل مخفض للشاحن فقط

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalNotes = includeUpsell 
        ? (formData.notes + " | + عرض خاص: شاحن سامسونج (500 دج) - كود 619")
        : formData.notes;

      await api.post('/orders', {
        productId,
        affiliateCode: affiliateCode || null,
        ...formData,
        notes: finalNotes
      });

      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: (getPrice() * formData.quantity) + (includeUpsell ? (upsellPrice + upsellShipping) : 0),
          currency: 'DZD',
          content_name: 'AIR PODS ANKER R50i NC',
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
    // السعر الأساسي 4770
    if (formData.quantity >= 3) return 3910; // خصم 18% تقريباً 
    if (formData.quantity >= 2) return 4290; // خصم 10% تقريباً
    return 4770;
  };

  const getDiscount = () => {
    if (formData.quantity >= 3) return '18%';
    if (formData.quantity >= 2) return '10%';
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
      {/* Floating Order Button */}
      <button
        onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-6 left-6 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-red-700 transition-all z-50 font-bold text-lg flex items-center gap-2 animate-bounce"
      >
        <span>اطلب الآن</span>
        <span className="text-2xl">🛒</span>
      </button>

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
            <h1 className="text-4xl sm:text-5xl font-black mb-6">
              سماعة أنكر <span className="text-red-600">Anker R50i NC</span>
            </h1>
            <p className="text-2xl font-bold mb-4 text-gray-800">بسعر 4,770 دج فقط! 🔥</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* المنتج */}
            <div className="bg-white border-4 border-black rounded-3xl p-8 text-center">
              <div className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xl mb-6 inline-block">
                ⚠️ إلغاء الضوضاء ANC + بطارية 45 ساعة
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                 {/* صورة المنتج الرئيسية */}
                 <div className="col-span-2 relative">
                    <img 
                      src="/assets/r50inc.jpg" 
                      alt="Anker R50i NC Box"
                      className="w-full h-64 object-contain rounded-2xl shadow-lg bg-white"
                    />
                    <div className="absolute bottom-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-lg">
                      التغليف الرسمي من Anker
                    </div>
                 </div>
                 <div className="relative">
                    <img 
                      src="/assets/main.jpg" 
                      alt="Anker R50i NC Buds and Case"
                      className="w-full h-32 object-cover rounded-2xl shadow-md border-2 border-gray-100"
                    />
                 </div>
                  <div className="relative">
                    <img 
                      src="/assets/Soundcore-R50i-NC-2-in-1.jpg" 
                      alt="Phone Stand Feature"
                      className="w-full h-32 object-cover rounded-2xl shadow-md border-2 border-gray-100"
                    />
                    <div className="absolute top-2 right-2 bg-red-600/90 text-white text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                       حامل هاتف 📱
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-right font-bold">سماعة أصلية تعمل مع تطبيق Soundcore خاص بـ Anker</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                  <span className="text-right font-bold">تحتوي على حامل الهاتف (2 في 1)</span>
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

      {/* شهادات العملاء - صورة الآراء الحقيقية */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-8">
            ماذا قالوا عن منتجنا؟ ⭐
          </h2>
          <p className="text-center text-gray-600 mb-8">آراء حقيقية من عملائنا في غرداية</p>
          
          <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-8 border-4 border-black">
            <img 
              src="/assets/rating.jpeg" 
              alt="آراء العملاء الحقيقية"
              className="w-full h-auto rounded-2xl"
            />
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
            <div 
              onClick={() => {
                setFormData(prev => ({ ...prev, quantity: 2 }));
                document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-4 border-black rounded-3xl p-8 text-center relative bg-gray-50 cursor-pointer hover:scale-105 transition-transform"
            >
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
                <span className="line-through text-gray-400">9,540 دج</span>
                <br />
                <span className="text-red-600 text-4xl">8,580 دج</span>
              </p>
            </div>

            {/* عرض 3 قطع */}
            <div 
              onClick={() => {
                setFormData(prev => ({ ...prev, quantity: 3 }));
                document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-4 border-red-600 rounded-3xl p-8 text-center relative bg-red-50 cursor-pointer hover:scale-105 transition-transform"
            >
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
              <p className="text-gray-600">ضمان بأن المنتج أصلي 100% (يمكنك تجربته عند الاستلام قبل الدفع)</p>
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
      <section id="order-form" className="py-16 bg-black text-white">
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

              {/* وقت التوصيل */}
              <div>
                <label className="flex items-center gap-2 font-bold mb-2">
                  <span className="w-5 h-5 flex items-center justify-center text-red-600">⏰</span>
                  وقت التوصيل المفضل
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryTime: 'morning' })}
                    className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.deliveryTime === 'morning'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    صباحاً ☀️
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryTime: 'evening' })}
                    className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.deliveryTime === 'evening'
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    مساءً 🌙
                  </button>
                </div>
              </div>

              {/* الكمية */}
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
                  <option value={2}>2 قطعة - {(4290 * 2).toLocaleString()} دج (وفّر 10%)</option>
                  <option value={3}>3 قطع - {(3910 * 3).toLocaleString()} دج (وفّر 18%) 🔥</option>
                </select>
              </div>

              {/* العرض الخاص - Upsell */}
              <div className="border-2 border-red-600 rounded-xl p-4 bg-red-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded-br-lg font-bold">
                  عرض خاص محدود 🎁
                </div>
                <label className="flex items-start gap-4 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={includeUpsell}
                    onChange={(e) => setIncludeUpsell(e.target.checked)}
                    className="w-6 h-6 mt-1 text-red-600 rounded focus:ring-red-500 border-gray-300" 
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">أضف كابل شاحن سامسونج الأصلي (Type-C)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-red-600 font-black text-lg">500 دج</span>
                      <span className="text-gray-400 line-through text-sm">2000 دج</span>
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">خصم 75%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">توصيل الشاحن مخفض إلى 50 دج فقط + تجربة قبل الدفع.</p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg p-1 flex items-center justify-center border border-gray-200">
                     <span className="text-2xl">🔌</span>
                  </div>
                </label>
              </div>

              {formData.quantity >= 2 && (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center">
                  <p className="font-black text-green-600 text-xl">
                    🎉 مبروك! وفّرت {((4770 * formData.quantity) - (getPrice() * formData.quantity)).toLocaleString()} دج
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 text-center space-y-2">
                <p className="font-bold text-lg text-gray-600">المجموع النهائي:</p>
                <p className="font-black text-red-600 text-4xl transform scale-110 transition-transform">
                  {((getPrice() * formData.quantity) + (includeUpsell ? (upsellPrice + upsellShipping) : 0)).toLocaleString()} دج
                </p>
                <p className="text-xs text-gray-500 mt-2">السعر يشمل التوصيل لغرداية (+50 دج فقط إذا أضفت الشاحن)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-2xl hover:bg-red-700 transition-all disabled:opacity-50 shadow-xl"
              >
                {loading ? 'جاري الإرسال...' : 'أطلب الآن 🎮'}
              </button>

              <p className="text-center text-sm text-gray-500">
                ضمان أصلي 100% مع تجربة قبل الدفع | دفع عند الاستلام | توصيل سريع لغرداية
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
