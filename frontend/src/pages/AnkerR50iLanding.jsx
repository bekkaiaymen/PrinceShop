import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Check, Star, Shield, Truck, Clock, ChevronDown, ChevronUp, 
  Volume2, Battery, Bluetooth, Zap, Award, Users, PackageCheck,
  Phone, MapPin, User, ShoppingCart, AlertCircle, Package
} from 'lucide-react';
import api from '../services/api';

function AnkerR50iLanding() {
  const [searchParams] = useSearchParams();
  
  // Form states from PromoGenerator
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    quantity: 1,
    deliveryTime: 'morning',
    notes: ''
  });
  const [includeUpsell, setIncludeUpsell] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Location states from PromoGenerator
  const [locationCoords, setLocationCoords] = useState({ lat: 32.4917, lng: 3.6746 });
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [locationMethod, setLocationMethod] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapLayer, setMapLayer] = useState('roadmap');
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Landing page states
  const [showFAQ, setShowFAQ] = useState({});
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });
  const orderFormRef = useRef(null);

  const affiliateCode = searchParams.get('ref');
  const productId = '6964fbe8e5d3036c5e504a60'; // Anker R50i NC
  const basePrice = 4770;
  const upsellProductId = '6964fbcce5d3036c5e50493a'; // Charger
  const upsellPrice = 470;
  
  const DELIVERY_FEE = 200;
  const OLD_STORE_LOCATION = { lat: 32.490353, lng: 3.646553 };
  const NEW_STORE_LOCATION = { lat: 32.4917, lng: 3.6746 };
  const OLD_NEARBY_RADIUS_KM = 2;
  const NEW_NEARBY_RADIUS_KM = 1;

  const getNearbyDeliveryFee = (productPrice) => {
    if (productPrice < 1000) return 50;
    if (productPrice >= 1000 && productPrice <= 2000) return 100;
    return 150;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getPrice = () => {
    if (formData.quantity >= 3) return 3910;
    if (formData.quantity >= 2) return 4290;
    return basePrice;
  };

  const getDeliveryFee = () => {
    const distanceOld = calculateDistance(OLD_STORE_LOCATION.lat, OLD_STORE_LOCATION.lng, locationCoords.lat, locationCoords.lng);
    const distanceNew = calculateDistance(NEW_STORE_LOCATION.lat, NEW_STORE_LOCATION.lng, locationCoords.lat, locationCoords.lng);
    
    const isNearOld = distanceOld < OLD_NEARBY_RADIUS_KM;
    const isNearNew = distanceNew < NEW_NEARBY_RADIUS_KM;
    
    const productPrice = getPrice() * formData.quantity;
    const baseDeliveryFee = (isNearOld || (isNearNew && formData.deliveryTime === 'morning')) 
      ? getNearbyDeliveryFee(productPrice) 
      : DELIVERY_FEE;
    
    return includeUpsell ? Math.round(baseDeliveryFee * 0.5) : baseDeliveryFee;
  };

  const calculateTotal = () => {
    const productTotal = getPrice() * formData.quantity;
    const upsellTotal = includeUpsell ? upsellPrice : 0;
    const deliveryFee = getDeliveryFee();
    return productTotal + upsellTotal + deliveryFee;
  };

  // Timer effect
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

  // Google Maps initialization - copied from PromoGenerator
  useEffect(() => {
    console.log('🚀 Google Maps useEffect triggered!');
    
    const initMap = () => {
      if (!mapContainerRef.current) {
        console.log('⏳ Waiting for container...');
        return;
      }
      
      if (!window.google || !window.google.maps) {
        console.log('⏳ Waiting for Google Maps API...');
        return;
      }
      
      if (mapInstanceRef.current) {
        console.log('🔄 Removing old map instance');
        mapInstanceRef.current = null;
      }

      try {
        console.log('🗺️ Starting Google Maps initialization...');
        console.log('Container element:', mapContainerRef.current);
        
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: locationCoords.lat, lng: locationCoords.lng },
          zoom: 17,
          mapTypeId: 'roadmap',
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy'
        });

        console.log('✅ Google Map created');

        const marker = new window.google.maps.Marker({
          position: { lat: locationCoords.lat, lng: locationCoords.lng },
          map: map,
          draggable: false,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          }
        });

        console.log('✅ Marker added');

        map.addListener('dragend', () => {
          const center = map.getCenter();
          const lat = center.lat();
          const lng = center.lng();
          setLocationCoords({ lat, lng });
          marker.setPosition({ lat, lng });
          setLocationConfirmed(true);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        
        console.log('✅ Google Maps fully initialized');
      } catch (error) {
        console.error('❌ Map error:', error);
      }
    };

    let attempts = 0;
    const maxAttempts = 150;
    
    const tryInit = () => {
      if (mapInstanceRef.current) return;
      
      attempts++;
      console.log(`🔄 Attempt ${attempts} to initialize Google Maps...`);
      
      if (window.google && window.google.maps && mapContainerRef.current) {
        initMap();
      } else if (attempts < maxAttempts) {
        const timeout = attempts > 50 ? 500 : 200;
        setTimeout(tryInit, timeout);
      } else {
        console.error('❌ Failed to initialize Google Maps after', maxAttempts, 'attempts');
      }
    };
    
    if (!mapInstanceRef.current) {
      tryInit();
    }

    return () => {
      if (mapInstanceRef.current) {
        console.log('🧹 Cleaning up map instance');
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapLayer);
    }
  }, [mapLayer]);

  useEffect(() => {
    if (mapInstanceRef.current && locationMethod === 'current') {
      mapInstanceRef.current.setCenter(locationCoords);
      mapInstanceRef.current.setZoom(17);
      if (markerRef.current) {
        markerRef.current.setPosition(locationCoords);
      }
    }
  }, [locationCoords, locationMethod]);

  useEffect(() => {
    if (locationCoords.lat && locationCoords.lng) {
      const timer = setTimeout(() => {
        getAddressFromCoords(locationCoords.lat, locationCoords.lng);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [locationCoords]);

  const getAddressFromCoords = async (lat, lng) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
        { headers: { 'User-Agent': 'AffiliateMarketingApp/1.0' } }
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setDeliveryAddress(address);
      setLoadingAddress(false);
      return address;
    } catch (error) {
      const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setDeliveryAddress(address);
      setLoadingAddress(false);
      return address;
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationMethod('current');
          setGettingLocation(false);
          setLocationConfirmed(true);
        },
        (error) => {
          alert('تعذر الحصول على موقعك. يرجى تحديد الموقع يدوياً على الخريطة.');
          setGettingLocation(false);
        }
      );
    }
  };

  const toggleMapLayer = () => {
    setMapLayer(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deliveryFee = getDeliveryFee();
      let notes = formData.notes;
      if (includeUpsell) {
        notes += ` | + شاحن سامسونج Type-C (${upsellPrice} دج) - كود ${upsellProductId} | خصم توصيل 50%`;
      }

      const orderData = {
        productId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryLocation: `غرداية - ${confirmedAddress || deliveryAddress}`,
        deliveryCoordinates: {
          lat: locationCoords.lat,
          lng: locationCoords.lng
        },
        quantity: formData.quantity,
        totalPrice: calculateTotal(),
        deliveryTime: formData.deliveryTime,
        deliveryFee: deliveryFee,
        notes: notes,
        status: 'pending',
        affiliateCode: affiliateCode || null
      };

      console.log('Sending order:', orderData);
      await api.post('/orders', orderData);
      
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: calculateTotal(),
          currency: 'DZD',
          content_name: 'Anker R50i NC',
          content_ids: [productId],
          content_type: 'product',
          num_items: formData.quantity
        }, {eventID: 'anker_r50i_' + Date.now()});
      }

      setSuccess(true);
      setFormData({
        customerName: '',
        customerPhone: '',
        quantity: 1,
        deliveryTime: 'morning',
        notes: ''
      });
      setIncludeUpsell(false);
    } catch (error) {
      console.error('Order error:', error);
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToOrder = () => {
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      a: 'التوصيل خلال 24-48 ساعة داخل غرداية. توصيل سريع ومضمون.'
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

  if (success) {
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
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            العودة للصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white px-4 text-center py-20">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-6xl">🎧</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            استمتع بصوت أسطوري
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl mb-8 max-w-3xl leading-relaxed">
            سماعات <span className="text-yellow-400 font-bold">Anker R50i NC</span> الأصلية
            <br />
            بسعر لا يُصدّق!
          </p>
          <div className="bg-red-600 text-white px-8 py-4 rounded-2xl text-2xl sm:text-3xl font-black mb-8 animate-pulse shadow-2xl">
            4,770 دج فقط! 🔥
          </div>
          <button
            onClick={scrollToOrder}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-12 py-5 rounded-2xl font-black text-xl sm:text-2xl hover:scale-110 transition-transform shadow-2xl"
          >
            اطلب الآن! 🚀
          </button>
          
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl">
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400">8h</div>
              <div className="text-sm mt-1">بطارية</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400">ANC</div>
              <div className="text-sm mt-1">عزل صوت</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400">IPX5</div>
              <div className="text-sm mt-1">مقاوم للماء</div>
            </div>
          </div>
        </div>
      </section>

      {/* العد التنازلي */}
      <section className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-2xl font-bold mb-2">⏰ العرض ينتهي خلال:</p>
          <div className="flex items-center justify-center gap-4 text-4xl font-black">
            <div className="bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
              {String(timeLeft.hours).padStart(2, '0')}
              <span className="text-sm block">ساعة</span>
            </div>
            <span>:</span>
            <div className="bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
              {String(timeLeft.minutes).padStart(2, '0')}
              <span className="text-sm block">دقيقة</span>
            </div>
            <span>:</span>
            <div className="bg-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">
              {String(timeLeft.seconds).padStart(2, '0')}
              <span className="text-sm block">ثانية</span>
            </div>
          </div>
        </div>
      </section>

      {/* مقارنة الأسعار */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-8">
            شاهد الفرق بنفسك! 👀
          </h2>
          <p className="text-center text-gray-600 mb-8 text-lg">
            نفس الجودة (بل أفضل!)، لكن بـ <span className="text-red-600 font-bold">10 مرات أرخص</span>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-right">المنتج</th>
                  <th className="px-6 py-4 text-center">السعر</th>
                  <th className="px-6 py-4 text-center">جودة الصوت</th>
                  <th className="px-6 py-4 text-center">البطارية</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b ${item.highlight ? 'bg-green-50 border-4 border-green-500' : ''}`}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {item.brand}
                      {item.highlight && <span className="mr-2 text-green-600">⭐ الأفضل</span>}
                    </td>
                    <td className={`px-6 py-4 text-center font-bold ${item.highlight ? 'text-green-600 text-2xl' : 'text-gray-700'}`}>
                      {item.price}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${item.highlight ? 'bg-green-500' : 'bg-gray-400'}`} 
                            style={{width: item.quality}}
                          ></div>
                        </div>
                        <span className="font-semibold">{item.quality}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center font-semibold ${item.highlight ? 'text-green-600' : 'text-gray-700'}`}>
                      {item.battery}
                    </td>
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

      {/* المزايا */}
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

      {/* شهادات العملاء */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">ماذا يقول عملاؤنا؟</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-4 italic">"كنت متردد بسبب السعر المنخفض، لكن لما استلمتهم صدمت! الصوت ولا أروع، البطارية تدوم معايا اليوم كامل. يستحقوا أكثر من 4,770 دج!"</p>
              <p className="font-bold">- أحمد من غرداية</p>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-4 italic">"أحسن قرار أخذتو! كنت باغي نشري AirPods لكن ماعنديش 48,000 دج. هادو نفس الجودة بـ 10 مرات أقل! شكراً لكم 🙏"</p>
              <p className="font-bold">- فاطمة من غرداية</p>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-4 italic">"الشحن وصل في 24 ساعة بالضبط. المنتج أصلي 100%، جربتهم في القاعة الرياضية وما وقعوش ولو مرة. توب!"</p>
              <p className="font-bold">- يوسف من غرداية</p>
            </div>
          </div>
        </div>
      </section>

      {/* المصداقية */}
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

      {/* الأسئلة الشائعة */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">أسئلة شائعة (لإزالة أي شك)</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-right">{faq.q}</span>
                  {showFAQ[idx] ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
                </button>
                {showFAQ[idx] && (
                  <div className="p-5 bg-white border-t">
                    <p className="text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* نموذج الطلب - مع الخريطة من PromoGenerator */}
      <section ref={orderFormRef} id="order-form" className="py-16 bg-black text-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white text-black rounded-3xl p-8">
            <h2 className="text-3xl font-black text-center mb-2">اطلب الآن 🚀</h2>
            <p className="text-center text-gray-600 mb-8">املأ البيانات وسنتصل بك فوراً</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* الاسم */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              {/* الهاتف */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="0555123456"
                />
              </div>

              {/* وقت التوصيل */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  وقت التوصيل المفضل <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryTime: 'morning' })}
                    className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.deliveryTime === 'morning'
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    صباحاً
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryTime: 'evening' })}
                    className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.deliveryTime === 'evening'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    مساءً
                  </button>
                </div>
              </div>

              {/* الخريطة */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  حدد مكان التوصيل على الخريطة <span className="text-red-500">*</span>
                </label>
                
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                >
                  {gettingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      جاري تحديد الموقع...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      استخدم موقعي الحالي
                    </>
                  )}
                </button>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">📍 كيفية تحديد الموقع:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• حرّك الخريطة حتى تصبح العلامة الحمراء فوق موقعك</li>
                    <li>• استخدم + و - للتكبير والتصغير</li>
                    <li>• أو اضغط "استخدم موقعي الحالي" للتحديد التلقائي</li>
                  </ul>
                </div>
                
                <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100" style={{ height: '400px' }}>
                  <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-xl transform -translate-y-4"></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={toggleMapLayer}
                    className="absolute top-4 right-4 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg font-semibold text-sm hover:bg-gray-100 transition-colors z-10 pointer-events-auto"
                  >
                    {mapLayer === 'roadmap' ? '🛰️ قمر صناعي' : '🗺️ خريطة'}
                  </button>
                </div>

                <div className="mt-3 bg-gray-50 border-2 border-gray-300 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    العنوان المحدد:
                  </p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    {loadingAddress ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm">جاري تحميل العنوان...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{deliveryAddress || 'حرّك الخريطة لتحديد الموقع'}</p>
                    )}
                  </div>
                  
                  {locationConfirmed && (
                    <div className="mt-3 bg-green-50 border-2 border-green-500 rounded-lg p-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">الموقع محدّد وجاهز ✓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* الكمية */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  الكمية
                </label>
                <select
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-bold"
                >
                  <option value={1}>1 قطعة - 4,770 دج</option>
                  <option value={2}>2 قطعة - 8,580 دج (وفّر 10%)</option>
                  <option value={3}>3 قطع - 11,730 دج (وفّر 18%) 🔥</option>
                </select>
              </div>

              {/* العرض الخاص - الشاحن */}
              <div className="border-2 border-orange-600 rounded-xl p-4 bg-gradient-to-r from-orange-50 to-yellow-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-orange-600 text-white text-xs px-2 py-1 rounded-br-lg font-bold">
                  عرض خاص + خصم 50% توصيل 🎁
                </div>
                <label className="flex items-start gap-4 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={includeUpsell}
                    onChange={(e) => setIncludeUpsell(e.target.checked)}
                    className="w-6 h-6 mt-1 text-orange-600 rounded focus:ring-orange-500 border-gray-300" 
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">أضف شاحن سامسونج الأصلي + كابل Type-C</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-orange-600 font-black text-lg">470 دج</span>
                      <span className="text-gray-400 line-through text-sm">940 دج</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">خصم 50%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ⚡ شحن سريع + آمن | 
                      <span className="text-green-600 font-bold"> خصم 50% على رسوم التوصيل!</span>
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg p-1 flex items-center justify-center border border-gray-200">
                     <span className="text-2xl">🔌</span>
                  </div>
                </label>
              </div>

              {/* التوفير */}
              {formData.quantity >= 2 && (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center">
                  <p className="font-black text-green-600 text-xl">
                    🎉 مبروك! وفّرت {((basePrice * formData.quantity) - (getPrice() * formData.quantity)).toLocaleString()} دج
                  </p>
                </div>
              )}

              {/* المجموع */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 text-center space-y-3">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>المنتجات:</span>
                    <span className="font-bold">{(getPrice() * formData.quantity).toLocaleString()} دج</span>
                  </div>
                  {includeUpsell && (
                    <div className="flex justify-between text-orange-600">
                      <span>الشاحن:</span>
                      <span className="font-bold">{upsellPrice} دج</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>التوصيل:</span>
                    <span className="font-bold">{getDeliveryFee()} دج {includeUpsell && <span className="text-green-600 text-xs">(خصم 50%)</span>}</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-300 pt-3">
                  <p className="font-bold text-lg text-gray-600">المجموع النهائي:</p>
                  <p className="font-black text-red-600 text-4xl transform scale-110 transition-transform">
                    {calculateTotal().toLocaleString()} دج
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-2xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                {loading ? 'جاري الإرسال...' : 'أطلب الآن 🚀'}
              </button>

              <p className="text-center text-sm text-gray-500">
                ضمان أصلي 100% مع تجربة قبل الدفع | دفع عند الاستلام | توصيل سريع لغرداية
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* CTA نهائي */}
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
      <footer className="bg-white py-8 border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-bold">© 2026 جميع الحقوق محفوظة - غرداية 🏜️</p>
        </div>
      </footer>
    </div>
  );
}

export default AnkerR50iLanding;
