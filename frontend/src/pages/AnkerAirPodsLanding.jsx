import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Check, Star, Shield, Truck, Clock, ChevronDown, ChevronUp, 
  Volume2, Battery, Bluetooth, Zap, Award, Users, PackageCheck,
  Phone, MapPin, User, ShoppingCart, AlertCircle
} from 'lucide-react';
import api from '../services/api';

function AnkerAirPodsLanding() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    city: '',
    address: '',
    quantity: 1
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState({});
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });
  const orderFormRef = useRef(null);

  const affiliateCode = searchParams.get('ref');
  const productId = '6964fbe8e5d3036c5e504a60'; // Anker R50i NC

  // عداد تنازلي للعرض المحدود
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToOrder = () => {
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        productId,
        affiliateCode: affiliateCode || null,
        ...formData
      };

      await api.post('/orders', orderData);
      
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: 4770 * formData.quantity,
          currency: 'USD',
          content_name: 'AIR PODS ANKER R50INC',
          content_ids: ['410'],
          content_type: 'product',
          num_items: formData.quantity
        }, {eventID: 'anker_' + Date.now()});
      }

      setOrderSuccess(true);
      setFormData({
        customerName: '',
        phone: '',
        city: '',
        address: '',
        quantity: 1
      });
    } catch (error) {
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index) => {
    setShowFAQ(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    {
      q: 'هل المنتج أصلي 100%؟',
      a: 'نعم، المنتج أصلي من شركة Anker العالمية مع ضمان رسمي. نوفر فاتورة شراء مع كل طلب.'
    },
    {
      q: 'كم مدة التوصيل؟',
      a: 'التوصيل خلال 24-48 ساعة داخل الجزائر العاصمة ووهران وقسنطينة. 2-4 أيام للولايات الأخرى.'
    },
    {
      q: 'هل يوجد ضمان؟',
      a: 'ضمان رسمي لمدة سنة كاملة ضد عيوب الصناعة. يمكنك استبدال المنتج خلال 7 أيام إذا وجدت أي مشكلة.'
    },
    {
      q: 'كيف أدفع؟',
      a: 'الدفع عند الاستلام. تستلم المنتج وتتأكد منه أولاً، ثم تدفع للمُوصّل.'
    },
    {
      q: 'لماذا السعر منخفض مقارنة بالمحلات؟',
      a: 'نحن نستورد مباشرة من المصنع بدون وسطاء. لا نملك محلات فيزيائية مما يوفر المصاريف. نمرر التوفير لك!'
    }
  ];

  const comparisons = [
    { brand: 'Apple AirPods Pro', price: '48,000 دج', quality: '90%', battery: '4.5 ساعات' },
    { brand: 'Samsung Galaxy Buds', price: '25,000 دج', quality: '85%', battery: '5 ساعات' },
    { brand: 'Anker R50iNC', price: '4,770 دج', quality: '95%', battery: '8 ساعات', highlight: true },
    { brand: 'سماعات صينية عادية', price: '2,500 دج', quality: '40%', battery: '2 ساعات' }
  ];

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">تم استلام طلبك! 🎉</h2>
          <p className="text-gray-600 mb-6">
            سنتصل بك خلال دقائق للتأكيد. استعد لتجربة صوت خرافية!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header Sticky */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span className="font-bold text-sm sm:text-base">عرض محدود!</span>
          </div>
          <div className="flex gap-2 sm:gap-4 text-sm sm:text-base">
            <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg">
              <span className="font-mono font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
            </div>
            <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg">
              <span className="font-mono font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
            </div>
            <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg">
              <span className="font-mono font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold mb-4 text-sm animate-pulse">
                🔥 توفير 43,230 دج مقارنة بـ Apple!
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold mb-6 leading-tight">
                AIR PODS ANKER R50iNC
                <span className="block text-yellow-400 mt-2">الجودة الأصلية بسعر لا يُصدق!</span>
              </h1>
              <p className="text-lg sm:text-xl mb-8 text-gray-200">
                نفس تقنية العلامات العالمية، لكن بسعر يناسب الجزائريين. صوت نقي، بطارية طويلة، راحة مطلقة.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">ضمان سنة</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">توصيل مجاني</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <PackageCheck className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">دفع عند الاستلام</span>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-5xl sm:text-6xl font-black text-yellow-400">4,770 دج</span>
                <span className="text-2xl text-gray-400 line-through">48,000 دج</span>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">-90%</span>
              </div>

              <button
                onClick={scrollToOrder}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl hover:scale-105 transition-transform shadow-2xl w-full sm:w-auto"
              >
                اطلب الآن 🎧
              </button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=600&h=600&fit=crop" 
                  alt="Anker AirPods"
                  className="w-full h-auto rounded-2xl shadow-xl"
                />
                <div className="absolute -top-4 -right-4 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg rotate-12">
                  مخزون محدود!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold text-gray-900">12,450+</div>
              <div className="text-gray-600 text-sm">عميل راضٍ</div>
            </div>
            <div>
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-3xl font-bold text-gray-900">4.9/5</div>
              <div className="text-gray-600 text-sm">تقييم العملاء</div>
            </div>
            <div>
              <Truck className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold text-gray-900">24-48 ساعة</div>
              <div className="text-gray-600 text-sm">مدة التوصيل</div>
            </div>
            <div>
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold text-gray-900">سنة كاملة</div>
              <div className="text-gray-600 text-sm">ضمان رسمي</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">لماذا Anker R50iNC أفضل خيار؟</h2>
          <p className="text-center text-gray-600 mb-12">مقارنة صادقة وشفافة مع المنافسين</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-right font-bold">المنتج</th>
                  <th className="p-4 text-center font-bold">السعر</th>
                  <th className="p-4 text-center font-bold">جودة الصوت</th>
                  <th className="p-4 text-center font-bold">عمر البطارية</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, idx) => (
                  <tr 
                    key={idx}
                    className={`border-b ${item.highlight ? 'bg-green-50 border-green-500 border-2' : 'hover:bg-gray-50'}`}
                  >
                    <td className="p-4 font-semibold">
                      {item.highlight && <span className="text-green-600 mr-2">👑</span>}
                      {item.brand}
                    </td>
                    <td className={`p-4 text-center font-bold ${item.highlight ? 'text-green-600 text-xl' : ''}`}>
                      {item.price}
                    </td>
                    <td className="p-4 text-center">{item.quality}</td>
                    <td className="p-4 text-center">{item.battery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 text-center">
            <p className="text-lg font-bold text-gray-900">
              💡 <span className="text-yellow-700">نفس الجودة، توفير 43,000 دج!</span> هل تفضل دفع 48,000 دج للعلامة التجارية فقط؟
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">لماذا يحب الجزائريون Anker R50iNC؟</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
              <Volume2 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">صوت نقي كأنك في حفل حي</h3>
              <p className="text-gray-600">تقنية Active Noise Cancellation تعزل كل الضوضاء. استمع لموسيقاك بوضوح مطلق.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
              <Battery className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">بطارية تدوم 8 ساعات</h3>
              <p className="text-gray-600">استمع طوال اليوم بدون قلق. شحنة واحدة تكفيك من الصباح للمساء!</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
              <Bluetooth className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">اتصال فوري Bluetooth 5.3</h3>
              <p className="text-gray-600">افتح العلبة وتتصل تلقائياً. لا تقطيع، لا تأخير، لا مشاكل!</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
              <Zap className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">شحن سريع في 10 دقائق</h3>
              <p className="text-gray-600">نسيت الشحن؟ 10 دقائق تعطيك ساعتين استماع كاملتين!</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
              <Shield className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">مقاومة للماء IPX5</h3>
              <p className="text-gray-600">استخدمها أثناء الرياضة أو تحت المطر. محمية ضد العرق والماء!</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
              <Award className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">ضمان Anker العالمي</h3>
              <p className="text-gray-600">شركة عالمية موثوقة. ضمان سنة كاملة + خدمة عملاء ممتازة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">ماذا يقول عملاؤنا؟</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-4 italic">"كنت متردد بسبب السعر المنخفض، لكن لما استلمتهم صدمت! الصوت ولا أروع، البطارية تدوم معايا اليوم كامل. يستحقوا أكثر من 4,770 دج!"</p>
              <p className="font-bold">- أحمد من الجزائر العاصمة</p>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-4 italic">"أحسن قرار أخذتو! كنت باغي نشري AirPods لكن ماعنديش 48,000 دج. هادو نفس الجودة بـ 10 مرات أقل! شكراً لكم 🙏"</p>
              <p className="font-bold">- فاطمة من وهران</p>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-4 italic">"الشحن وصل في 48 ساعة بالضبط. المنتج أصلي 100%، جربتهم في القاعة الرياضية وما وقعوش ولو مرة. توب!"</p>
              <p className="font-bold">- يوسف من قسنطينة</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">أسئلة شائعة (لإزالة أي شك)</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-6 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-right flex-1">{faq.q}</span>
                  {showFAQ[idx] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showFAQ[idx] && (
                  <div className="p-6 bg-white">
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Form */}
      <section ref={orderFormRef} className="py-16 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">اطلب الآن واستفد من العرض!</h2>
              <p className="text-gray-600">املأ النموذج وسنتصل بك خلال دقائق للتأكيد</p>
              
              <div className="mt-6 flex items-center justify-center gap-2 bg-red-50 border-2 border-red-500 rounded-xl p-4">
                <Clock className="w-6 h-6 text-red-600" />
                <span className="font-bold text-red-600">
                  باقي {timeLeft.hours} ساعة و {timeLeft.minutes} دقيقة على انتهاء العرض!
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <User className="w-5 h-5" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Phone className="w-5 h-5" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="0550123456"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <MapPin className="w-5 h-5" />
                  الولاية
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: الجزائر العاصمة"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <MapPin className="w-5 h-5" />
                  العنوان الكامل
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  rows="3"
                  placeholder="الشارع، رقم المنزل، معلومات إضافية..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <ShoppingCart className="w-5 h-5" />
                  الكمية
                </label>
                <select
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'قطعة' : 'قطع'} - {(4770 * n).toLocaleString()} دج
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <PackageCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-green-900 mb-1">الدفع عند الاستلام</p>
                    <p className="text-sm text-green-700">
                      لا تدفع الآن! سنتصل بك للتأكيد، ثم تستلم المنتج وتدفع للمُوصّل.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الإرسال...' : `أطلب الآن مقابل ${(4770 * formData.quantity).toLocaleString()} دج 🚀`}
              </button>

              <p className="text-center text-sm text-gray-500">
                بالطلب، أنت توافق على سياسة الخصوصية وشروط الخدمة
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            لا تفوت هذه الفرصة الذهبية!
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            آلاف الجزائريين استفادوا من العرض. انضم إليهم الآن قبل نفاذ الكمية!
          </p>
          <button
            onClick={scrollToOrder}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-2xl"
          >
            اطلب الآن بـ 4,770 دج فقط! 🎉
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}

export default AnkerAirPodsLanding;
