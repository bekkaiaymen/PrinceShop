import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ShoppingCart, MapPin, Phone, User, Package, MessageSquare, DollarSign, CheckCircle, Clock } from 'lucide-react';

function LandingPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const affiliateCode = searchParams.get('ref');
  
  console.log('LandingPage - Product ID:', productId);
  console.log('LandingPage - Affiliate Code:', affiliateCode);
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    quantity: 1,
    notes: '',
    deliveryTime: 'morning' // 'morning' أو 'evening'
  });
  
  // موقع التوصيل
  const [locationCoords, setLocationCoords] = useState({ lat: 32.4917, lng: 3.6746 }); // غرداية افتراضياً
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [locationMethod, setLocationMethod] = useState(''); // 'current' أو 'manual'
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapMoving, setMapMoving] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(''); // العنوان المؤكد
  const [loadingAddress, setLoadingAddress] = useState(false); // حالة تحميل العنوان
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // للتحريك البصري
  const [mapCenter, setMapCenter] = useState({ lat: 32.4917, lng: 3.6746 }); // للخريطة الفعلية
  const [mapLayer, setMapLayer] = useState('roadmap'); // 'roadmap' or 'satellite'
  const [isMapLoading, setIsMapLoading] = useState(false); // تعطيل loading مؤقتاً
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const lastUpdateTime = useRef(0);
  
  const DELIVERY_FEE = 200; // سعر التوصيل للبعيدين
  const OLD_STORE_LOCATION = { lat: 32.4917, lng: 3.6746 }; // الموقع القديم
  const NEW_STORE_LOCATION = { lat: 32.490353, lng: 3.646553 }; // الموقع الجديد (FMPF+F6X)
  const OLD_NEARBY_RADIUS_KM = 2; // نصف قطر الموقع القديم (2 كيلومتر) - تخفيض صباحاً ومساءً
  const NEW_NEARBY_RADIUS_KM = 1; // نصف قطر الموقع الجديد (1 كيلومتر) - تخفيض صباحاً فقط

  // حساب سعر التوصيل للقريبين حسب سعر السلعة
  const getNearbyDeliveryFee = (productPrice) => {
    if (productPrice < 1000) return 50;
    if (productPrice >= 1000 && productPrice <= 2000) return 100;
    return 150; // أكثر من 2000
  };

  // حساب المسافة بين نقطتين (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // المسافة بالكيلومتر
  };

  // حساب سعر التوصيل بناءً على المسافة
  const getDeliveryFee = () => {
    const distance = calculateDistance(
      STORE_LOCATION.lat,
      STORE_LOCATION.lng,
      locationCoords.lat,
      locationCoords.lng
    );
    return distance < NEARBY_RADIUS_KM ? REDUCED_DELIVERY_FEE : DELIVERY_FEE;
  };

  // إنشاء الخريطة التفاعلية مع Google Maps
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
        
        // إنشاء الخريطة
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

        // Marker في المنتصف
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

        // تحديث الإحداثيات عند تحريك الخريطة
        map.addListener('dragend', () => {
          const center = map.getCenter();
          const lat = center.lat();
          const lng = center.lng();
          setLocationCoords({ lat, lng });
          setMapCenter({ lat, lng });
          marker.setPosition({ lat, lng });
          setLocationMethod('manual');
          setLocationConfirmed(false);
          setConfirmedAddress('');
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setIsMapLoading(false);
        
        console.log('✅ Google Maps fully initialized');
      } catch (error) {
        console.error('❌ Map error:', error);
        setIsMapLoading(false);
      }
    };
    
    // محاولة التهيئة عدة مرات
    let attempts = 0;
    const maxAttempts = 50;
    
    const tryInit = () => {
      attempts++;
      console.log(`🔄 Attempt ${attempts} to initialize Google Maps...`);
      
      if (window.google && window.google.maps && mapContainerRef.current) {
        initMap();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInit, 100);
      } else {
        console.error('❌ Failed to initialize Google Maps after', maxAttempts, 'attempts');
        setIsMapLoading(false);
      }
    };
    
    tryInit();

    return () => {
      if (mapInstanceRef.current) {
        console.log('🧹 Cleaning up map');
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // تبديل بين الشوارع والأقمار الصناعية
  const toggleMapLayer = () => {
    const newLayer = mapLayer === 'roadmap' ? 'satellite' : 'roadmap';
    setMapLayer(newLayer);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(newLayer);
    }
  };

  // تحديث موقع الخريطة عند استخدام GPS
  useEffect(() => {
    if (mapInstanceRef.current && locationMethod === 'current') {
      mapInstanceRef.current.setCenter({ lat: locationCoords.lat, lng: locationCoords.lng });
      mapInstanceRef.current.setZoom(17);
      if (markerRef.current) {
        markerRef.current.setPosition({ lat: locationCoords.lat, lng: locationCoords.lng });
      }
    }
  }, [locationCoords, locationMethod]);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  // تحديث العنوان عند تغيير الموقع مع debounce
  useEffect(() => {
    if (locationCoords.lat && locationCoords.lng) {
      console.log('🗺️ تغيرت الإحداثيات:', locationCoords);
      const timer = setTimeout(() => {
        console.log('📡 جاري جلب العنوان للإحداثيات:', locationCoords);
        getAddressFromCoords(locationCoords.lat, locationCoords.lng);
      }, 500); // انتظار نصف ثانية بعد آخر تغيير
      
      return () => clearTimeout(timer);
    }
  }, [locationCoords]);

  const getAddressFromCoords = async (lat, lng) => {
    console.log('🔍 بدء جلب العنوان من API...');
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'AffiliateMarketingApp/1.0'
          }
        }
      );
      const data = await response.json();
      console.log('✅ تم استلام البيانات من API:', data);
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      console.log('📮 العنوان الجديد:', address);
      setDeliveryAddress(address);
      setLoadingAddress(false);
      return address; // إرجاع العنوان
    } catch (error) {
      console.error('❌ خطأ في جلب العنوان:', error);
      const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setDeliveryAddress(address);
      setLoadingAddress(false);
      return address; // إرجاع العنوان حتى في حالة الخطأ
    }
  };

  // دالة لتأكيد الموقع
  const confirmLocation = async () => {
    console.log('🎯 تأكيد الموقع...');
    console.log('📍 الإحداثيات الحالية:', locationCoords);
    console.log('📮 العنوان الحالي:', deliveryAddress);
    
    setMapMoving(false);
    
    // جلب العنوان من الإحداثيات الحالية والانتظار حتى يكتمل
    let finalAddress = deliveryAddress;
    if (locationCoords.lat && locationCoords.lng) {
      console.log('🔄 إعادة جلب العنوان للتأكد...');
      finalAddress = await getAddressFromCoords(locationCoords.lat, locationCoords.lng);
      console.log('✅ العنوان النهائي المؤكد:', finalAddress);
    }
    
    // حفظ العنوان المؤكد بعد التحديث
    setConfirmedAddress(finalAddress);
    setLocationConfirmed(true);
    
    // إظهار رسالة تأكيد مع العنوان
    setTimeout(() => {
      alert(
        '✅ تم تأكيد الموقع بنجاح!\n\n' +
        '📍 الإحداثيات:\n' + locationCoords.lat.toFixed(6) + ', ' + locationCoords.lng.toFixed(6) +
        '\n\n📮 العنوان:\n' + finalAddress
      );
    }, 100);
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('Fetching product with ID:', productId);
      const { data } = await api.get(`/products/${productId}`);
      console.log('Product data received:', data);
      
      // البيانات قد تأتي في data.product أو data مباشرة
      const productData = data.product || data;
      setProduct(productData);
      
      // جلب المنتجات المشابهة (نفس الفئة)
      if (productData && productData.category) {
        console.log('Fetching similar products for category:', productData.category);
        const { data: allProducts } = await api.get('/products');
        const similar = allProducts.products
          .filter(p => 
            p._id !== productId && 
            p.category === productData.category
          )
          .slice(0, 4); // أول 4 منتجات مشابهة
        console.log('Similar products found:', similar.length);
        setSimilarProducts(similar);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // الحصول على الموقع الحالي للمستخدم
  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع. الرجاء إدخال العنوان يدوياً.');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocationCoords(coords);
        setMapCenter(coords);
        setLocationMethod('current');
        
        // الحصول على العنوان من الإحداثيات
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&accept-language=ar`
          );
          const data = await response.json();
          setDeliveryAddress(data.display_name || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        } catch (error) {
          setDeliveryAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('تعذر الحصول على موقعك. الرجاء التأكد من السماح بالوصول إلى الموقع.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const productPrice = product.customerPrice || product.suggested_price || 0;
    const productTotal = productPrice * formData.quantity;
    
    // حساب المسافة من الموقعين
    const distanceOld = calculateDistance(
      OLD_STORE_LOCATION.lat,
      OLD_STORE_LOCATION.lng,
      locationCoords.lat,
      locationCoords.lng
    );
    
    const distanceNew = calculateDistance(
      NEW_STORE_LOCATION.lat,
      NEW_STORE_LOCATION.lng,
      locationCoords.lat,
      locationCoords.lng
    );
    
    let deliveryFee = DELIVERY_FEE; // السعر الافتراضي
    
    const isNearOld = distanceOld < OLD_NEARBY_RADIUS_KM;
    const isNearNew = distanceNew < NEW_NEARBY_RADIUS_KM;
    
    // الأولوية للموقع القديم (تخفيض صباحاً ومساءً)
    if (isNearOld) {
      deliveryFee = getNearbyDeliveryFee(productTotal);
    }
    // إذا لم يكن قريباً من القديم، نتحقق من الجديد (تخفيض صباحاً فقط)
    else if (isNearNew && formData.deliveryTime === 'morning') {
      deliveryFee = getNearbyDeliveryFee(productTotal);
    }
    
    return productTotal + deliveryFee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !deliveryAddress) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSubmitting(true);
      
      // حساب سعر التوصيل حسب الموقعين (الأولوية للموقع القديم)
      const productTotal = (product.suggested_price || product.customerPrice) * formData.quantity;
      
      const distanceOld = calculateDistance(
        OLD_STORE_LOCATION.lat,
        OLD_STORE_LOCATION.lng,
        locationCoords.lat,
        locationCoords.lng
      );
      
      const distanceNew = calculateDistance(
        NEW_STORE_LOCATION.lat,
        NEW_STORE_LOCATION.lng,
        locationCoords.lat,
        locationCoords.lng
      );
      
      let deliveryFee = DELIVERY_FEE;
      
      const isNearOld = distanceOld < OLD_NEARBY_RADIUS_KM;
      const isNearNew = distanceNew < NEW_NEARBY_RADIUS_KM;
      
      // الأولوية للموقع القديم
      if (isNearOld) {
        deliveryFee = getNearbyDeliveryFee(productTotal);
      }
      // إذا لم يكن قريباً من القديم، نتحقق من الجديد
      else if (isNearNew && formData.deliveryTime === 'morning') {
        deliveryFee = getNearbyDeliveryFee(productTotal);
      }
      
      const orderData = {
        productId: product._id,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryLocation: `غرداية - ${deliveryAddress}`,
        deliveryCoordinates: {
          lat: locationCoords.lat,
          lng: locationCoords.lng,
          method: locationMethod || 'manual'
        },
        quantity: formData.quantity,
        notes: formData.notes,
        affiliateCode: affiliateCode,
        deliveryFee: deliveryFee,
        deliveryTime: formData.deliveryTime
      };

      await api.post('/orders', orderData);
      
      setSuccess(true);
      
      // إعادة تعيين النموذج بعد 3 ثواني
      setTimeout(() => {
        setFormData({ customerName: '', customerPhone: '', quantity: 1, notes: '', deliveryTime: 'morning' });
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(error.response?.data?.error || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">المنتج غير موجود</h2>
          <p className="text-gray-600">عذراً، لم نتمكن من العثور على هذا المنتج</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md mx-4 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">تم إرسال طلبك بنجاح!</h2>
          <p className="text-gray-600 text-lg mb-6">
            شكراً لك! سنتواصل معك قريباً لتأكيد الطلب
          </p>
          <div className="animate-pulse text-blue-600 font-medium">
            جاري تحويلك...
          </div>
        </div>
      </div>
    );
  }

  const productPrice = product.customerPrice || product.suggested_price || 0;
  const productTotal = productPrice * formData.quantity;
  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40 border-b-2 border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                عرض خاص
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">اطلب الآن واحصل على التوصيل السريع</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* قسم المنتج */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            <div className="mb-6">
              <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden mb-6">
                <img
                  src={product.imageUrl || product.image || 'https://via.placeholder.com/400x400/e5e7eb/6b7280?text=' + encodeURIComponent(product.name || 'منتج')}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400/e5e7eb/6b7280?text=' + encodeURIComponent(product.name?.substring(0, 20) || 'منتج'); }}
                />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                {product.name}
              </h2>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Package className="w-4 h-4" />
                <span>كود المنتج: {product.sku}</span>
              </div>

              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">السعر:</span>
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                    {(product.customerPrice || product.suggested_price || 0).toLocaleString()} دج
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* نموذج الطلب */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              أكمل طلبك الآن
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* الاسم الكامل */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0555123456"
                />
              </div>

              {/* وقت التوصيل */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
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
                    {formData.deliveryTime === 'morning' && (
                      <span className="text-xs bg-white/30 px-2 py-1 rounded-full">خصم التوصيل ✨</span>
                    )}
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

              {/* رسالة توضيحية للتخفيض */}
              {(() => {
                const distanceOld = calculateDistance(
                  OLD_STORE_LOCATION.lat,
                  OLD_STORE_LOCATION.lng,
                  locationCoords.lat,
                  locationCoords.lng
                );
                
                const distanceNew = calculateDistance(
                  NEW_STORE_LOCATION.lat,
                  NEW_STORE_LOCATION.lng,
                  locationCoords.lat,
                  locationCoords.lng
                );
                
                const isNearOld = distanceOld < OLD_NEARBY_RADIUS_KM;
                const isNearNew = distanceNew < NEW_NEARBY_RADIUS_KM;
                
                // رسالة للموقع الجديد إذا كان قريباً واختار مساءً
                if (isNearNew && formData.deliveryTime === 'evening' && !isNearOld) {
                  const productPrice = product?.customerPrice || product?.suggested_price || 0;
                  const productTotal = productPrice * formData.quantity;
                  const morningFee = getNearbyDeliveryFee(productTotal);
                  const savedAmount = DELIVERY_FEE - morningFee;
                  
                  return (
                    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-orange-300 rounded-xl p-5 flex items-start gap-3 animate-pulse shadow-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2 text-lg">
                          🌅 وفّر {savedAmount} دج على التوصيل!
                        </h4>
                        <p className="text-sm text-orange-800 leading-relaxed mb-2">
                          أنت على بعد <span className="font-bold">{(distanceNew * 1000).toFixed(0)} متر</span> فقط من موقعنا الجديد!
                        </p>
                        <p className="text-sm text-orange-800 leading-relaxed">
                          اختر <span className="font-bold bg-orange-200 px-2 py-0.5 rounded">التوصيل صباحاً</span> وادفع <span className="font-bold text-green-700">{morningFee} دج</span> بدلاً من <span className="line-through">{DELIVERY_FEE} دج</span> للتوصيل 💰✨
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* الولاية */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  الولاية
                </label>
                <input
                  type="text"
                  value="غرداية"
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-medium"
                />
              </div>

              {/* مكان التوصيل - خريطة تفاعلية مع marker ثابت */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  حدد مكان التوصيل على الخريطة <span className="text-red-500">*</span>
                </label>
                
                {/* زر استخدام الموقع الحالي */}
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
                
                {/* تعليمات الاستخدام */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">📍 كيفية تحديد الموقع:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• حرّك الخريطة بإصبعك حتى تصبح العلامة الحمراء فوق موقعك</li>
                    <li>• استخدم + و - للتكبير والتصغير</li>
                    <li>• أو اضغط على "استخدم موقعي الحالي" للتحديد التلقائي</li>
                  </ul>
                </div>
                
                {/* الخريطة التفاعلية */}
                <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100" style={{ height: '400px' }}>
                  {/* Google Maps Container */}
                  <div 
                    ref={mapContainerRef}
                    style={{ width: '100%', height: '100%' }}
                  />
                  
                  {/* علامة حمراء في المنتصف */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="40" height="50" viewBox="0 0 24 30" className="drop-shadow-lg">
                      <path d="M12 0C7.589 0 4 3.589 4 8c0 5.5 8 14 8 14s8-8.5 8-14c0-4.411-3.589-8-8-8zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" fill="#EF4444"/>
                      <circle cx="12" cy="8" r="2" fill="white"/>
                    </svg>
                  </div>
                  
                  {/* زر تبديل بين الشوارع والأقمار الصناعية */}
                  <button
                    type="button"
                    onClick={toggleMapLayer}
                    className="absolute top-4 left-4 z-[1000] bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-lg transition-all flex items-center gap-2"
                  >
                    {mapLayer === 'roadmap' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        قمر صناعي
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        شوارع
                      </>
                    )}
                  </button>
                  
                  {/* زر تأكيد الموقع */}
                  <div className="absolute bottom-4 left-4 z-[1000]">
                    <button
                      type="button"
                      onClick={confirmLocation}
                      className={`${
                        locationConfirmed 
                          ? 'bg-gradient-to-r from-green-600 to-green-700' 
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                      } text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2`}
                    >
                      {locationConfirmed ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          تم التأكيد
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          تأكيد الموقع
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* عرض الإحداثيات والعنوان */}
                <div className="mt-3 space-y-2">
                  {/* الإحداثيات */}
                  <div className={`${
                    locationConfirmed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                  } border-2 rounded-xl p-3 transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-medium text-sm ${locationConfirmed ? 'text-green-800' : 'text-gray-700'}`}>
                        📍 الإحداثيات:
                      </p>
                      <div className="flex gap-2">
                        {locationConfirmed && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            مؤكد
                          </span>
                        )}
                        {locationMethod === 'current' && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                            GPS
                          </span>
                        )}
                        {!locationConfirmed && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full animate-pulse">
                            غير مؤكد
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-xs font-mono font-bold">
                      {locationCoords.lat.toFixed(6)}, {locationCoords.lng.toFixed(6)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      آخر تحديث: {new Date().toLocaleTimeString('ar-DZ')}
                    </p>
                  </div>
                  
                  {/* العنوان */}
                  {(deliveryAddress || loadingAddress) && (
                    <div className={`${
                      locationConfirmed && confirmedAddress
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200'
                    } border-2 rounded-xl p-3 transition-all`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium text-sm ${
                          locationConfirmed && confirmedAddress
                            ? 'text-green-800'
                            : 'text-blue-800'
                        }`}>📮 العنوان:</p>
                        <div className="flex gap-2">
                          {loadingAddress && (
                            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              جاري التحديث...
                            </span>
                          )}
                          {locationConfirmed && confirmedAddress && !loadingAddress && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              مؤكد
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed">
                        {loadingAddress ? 'جاري تحديد العنوان...' : (deliveryAddress || 'غير محدد')}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* حقل تعديل العنوان يدوياً */}
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    أضف تفاصيل إضافية للعنوان (اختياري)
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                    placeholder="مثال: الطابق الثاني، شقة رقم 5، بجانب البقالة..."
                  />
                </div>
              </div>

              {/* الكمية */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  الكمية
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* ملاحظات إضافية */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  ملاحظات إضافية
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="أي ملاحظات خاصة بطلبك..."
                />
              </div>

              {/* ملخص الأسعار */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border-2 border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">سعر المنتج × {formData.quantity}:</span>
                    <span className="font-bold text-gray-800">{productTotal.toLocaleString()} دج</span>
                  </div>
                  
                  {/* سعر التوصيل مع الخصم */}
                  {(() => {
                    const distanceOld = calculateDistance(
                      OLD_STORE_LOCATION.lat,
                      OLD_STORE_LOCATION.lng,
                      locationCoords.lat,
                      locationCoords.lng
                    );
                    
                    const distanceNew = calculateDistance(
                      NEW_STORE_LOCATION.lat,
                      NEW_STORE_LOCATION.lng,
                      locationCoords.lat,
                      locationCoords.lng
                    );
                    
                    const isNearOld = distanceOld < OLD_NEARBY_RADIUS_KM;
                    const isNearNew = distanceNew < NEW_NEARBY_RADIUS_KM;
                    const isMorning = formData.deliveryTime === 'morning';
                    
                    let deliveryFee = DELIVERY_FEE;
                    let hasDiscount = false;
                    
                    // الأولوية للموقع القديم
                    if (isNearOld) {
                      deliveryFee = getNearbyDeliveryFee(productTotal);
                      hasDiscount = true;
                    }
                    // إذا لم يكن قريباً من القديم، نتحقق من الجديد
                    else if (isNearNew && isMorning) {
                      deliveryFee = getNearbyDeliveryFee(productTotal);
                      hasDiscount = true;
                    }
                    
                    const savedAmount = DELIVERY_FEE - deliveryFee;
                    const discountPercent = Math.round((savedAmount / DELIVERY_FEE) * 100);
                    
                    return (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">سعر التوصيل:</span>
                          {hasDiscount && savedAmount > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                              خصم {discountPercent}%
                            </span>
                          )}
                          {isNearNew && !isMorning && !isNearOld && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                              خصم متاح صباحاً فقط
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDiscount && savedAmount > 0 && (
                            <span className="text-sm text-gray-400 line-through">{DELIVERY_FEE} دج</span>
                          )}
                          <span className={`font-bold ${hasDiscount ? 'text-green-600' : 'text-gray-800'}`}>
                            {deliveryFee} دج
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="border-t-2 border-blue-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">المجموع الإجمالي:</span>
                      <span className="text-2xl font-bold text-blue-600">{totalPrice.toLocaleString()} دج</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* زر التأكيد */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    تأكيد الطلب الآن
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 معلوماتك محمية ومؤمنة بالكامل
              </p>
            </form>
          </div>
        </div>

        {/* المنتجات المشابهة */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                منتجات مشابهة قد تعجبك
              </h3>
              <p className="text-gray-600">اكتشف المزيد من المنتجات الرائعة</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.map((similarProduct) => (
                <a
                  key={similarProduct._id}
                  href={`/landing/${similarProduct._id}${affiliateCode ? `?ref=${affiliateCode}` : ''}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 hover:border-blue-200"
                >
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <img
                      src={similarProduct.imageUrl || similarProduct.image || 'https://via.placeholder.com/200x200/e5e7eb/6b7280?text=' + encodeURIComponent(similarProduct.name?.substring(0, 15) || 'منتج')}
                      alt={similarProduct.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200/e5e7eb/6b7280?text=' + encodeURIComponent(similarProduct.name?.substring(0, 15) || 'منتج'); }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-bold text-gray-800 mb-2 line-clamp-2 text-sm sm:text-base">
                      {similarProduct.name}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg sm:text-xl font-bold text-blue-600">
                        {(similarProduct.customerPrice || similarProduct.suggested_price || 0).toLocaleString()} دج
                      </div>
                      <div className="text-xs text-blue-600 font-medium group-hover:text-blue-700">
                        اطلب الآن ←
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
