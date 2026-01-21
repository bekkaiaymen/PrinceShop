import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Shield, Truck, Phone, MapPin, User, Package, Star, Clock, Zap, AlertCircle } from 'lucide-react';
import api from '../services/api';

function AnkerSimpleLanding() {
  const [searchParams] = useSearchParams();
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
  
  // موقع التوصيل
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

  const affiliateCode = searchParams.get('ref');
  const productId = '410';
  const basePrice = 4770;
  const upsellProductId = '619';
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
    
    // خصم 50% على التوصيل إذا اختار الشاحن
    return includeUpsell ? Math.round(baseDeliveryFee * 0.5) : baseDeliveryFee;
  };

  const calculateTotal = () => {
    const productTotal = getPrice() * formData.quantity;
    const upsellTotal = includeUpsell ? upsellPrice : 0;
    const deliveryFee = getDeliveryFee();
    return productTotal + upsellTotal + deliveryFee;
  };

  // Google Maps
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
      
      // إزالة الخريطة القديمة إن وجدت
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
          setLocationConfirmed(false);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        
        console.log('✅ Google Maps fully initialized');
      } catch (error) {
        console.error('❌ Map error:', error);
      }
    };

    let attempts = 0;
    const maxAttempts = 50;
    
    const tryInit = () => {
      if (mapInstanceRef.current) return;
      
      attempts++;
      console.log(`🔄 Attempt ${attempts} to initialize Google Maps...`);
      
      if (window.google && window.google.maps && mapContainerRef.current) {
        initMap();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInit, 100);
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

  const confirmLocation = async () => {
    let finalAddress = deliveryAddress;
    if (locationCoords.lat && locationCoords.lng) {
      finalAddress = await getAddressFromCoords(locationCoords.lat, locationCoords.lng);
    }
    setConfirmedAddress(finalAddress);
    setLocationConfirmed(true);
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
          setLocationConfirmed(false);
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
    
    if (!locationConfirmed) {
      alert('الرجاء تأكيد موقع التوصيل على الخريطة');
      return;
    }
    
    setLoading(true);

    try {
      const deliveryFee = getDeliveryFee();
      let notes = formData.notes;
      if (includeUpsell) {
        notes += ` | + شاحن سامسونج Type-C (${upsellPrice} دج) - كود ${upsellProductId} | خصم توصيل 50%`;
      }

      await api.post('/orders', {
        productId,
        affiliateCode: affiliateCode || null,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        quantity: formData.quantity,
        notes,
        deliveryTime: formData.deliveryTime,
        deliveryFee,
        deliveryCoords: locationCoords,
        deliveryAddress: confirmedAddress
      });

      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: calculateTotal(),
          currency: 'DZD',
          content_name: 'Anker R50i NC',
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

      {/* نصيحة الشاحن */}
      <section className="py-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-b-4 border-orange-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-300">
            <div className="flex-shrink-0">
              <Zap className="w-12 h-12 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                نصيحة مهمة قبل الطلب!
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                سماعات Anker R50i NC تحتاج إلى <span className="font-bold text-orange-600">شاحن Type-C أصلي</span> للحفاظ على أداء البطارية وضمان الشحن السريع. احصل على <span className="font-bold">شاحن سامسونج + كابل Type-C الأصلي</span> بسعر مخفض <span className="line-through text-gray-400">940 دج</span> <span className="text-red-600 font-black text-xl">470 دج فقط</span> + <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">خصم 50% على التوصيل</span>!
              </p>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                <p className="text-sm text-orange-800">
                  ⚡ الشاحن العادي قد يضر بالبطارية على المدى الطويل. استثمر في شاحن أصلي لحماية سماعاتك!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* شهادات العملاء */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-8">
            ماذا قالوا عنا؟ ⭐
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

      {/* نموذج الطلب */}
      <section id="order-form" className="py-16 bg-black text-white">
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
                  
                  {!locationConfirmed && deliveryAddress && (
                    <button
                      type="button"
                      onClick={confirmLocation}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md"
                    >
                      ✓ تأكيد الموقع
                    </button>
                  )}
                  
                  {locationConfirmed && (
                    <div className="mt-3 bg-green-50 border-2 border-green-500 rounded-lg p-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">تم تأكيد الموقع ✓</span>
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
                disabled={loading || !locationConfirmed}
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
