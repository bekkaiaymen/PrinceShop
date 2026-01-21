import React, { useState, useEffect } from 'react';
import { MapPin, Zap, CheckCircle, TrendingUp, DollarSign, Bell, Star, Navigation, ShoppingBag } from 'lucide-react';

const PromoGenerator = () => {
  const [slide, setSlide] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // التحكم في توقيت المشاهد
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev < 5 ? prev + 1 : 0));
    }, 5000); // 5 ثواني لكل مشهد
    return () => clearInterval(timer);
  }, []);

  // محاكاة الإشعارات في المشهد الأول
  useEffect(() => {
    if (slide === 0) {
      setNotifications([]);
      let count = 0;
      const notifTimer = setInterval(() => {
        if (count < 4) {
          setNotifications(prev => [...prev, { id: Date.now(), name: ['أحمد', 'محمد', 'سارة', 'كريم'][count], time: 'الآن' }]);
          count++;
        }
      }, 800);
      return () => clearInterval(notifTimer);
    }
  }, [slide]);

  const scenes = [
    // المشهد 1: الخُطّاف (Hook) - إشعارات وأرباح
    {
      id: 0,
      bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black',
      content: (
        <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent animate-pulse"></div>
          
          <div className="z-10 text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
              منتج <span className="text-green-400">الترند</span>
            </h1>
            <p className="text-xl text-gray-300 font-bold">Anker R50i NC 🎧</p>
          </div>

          <div className="w-full max-w-xs space-y-3 z-10 px-4">
            {notifications.map((n, i) => (
              <div key={n.id} className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-xl transform transition-all duration-500 animate-slide-up flex items-center gap-3 border-l-4 border-green-500">
                <div className="bg-green-100 p-2 rounded-full">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-500 flex justify-between">
                    <span>{n.time}</span>
                    <span className="font-bold text-gray-800">طلب جديد! 🔔</span>
                  </p>
                  <p className="font-bold text-sm text-gray-900">عمولة دسمة من {n.name} 💰</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // المشهد 2: المنتج (Visuals)
    {
      id: 1,
      bg: 'bg-white',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-[url('/assets/grid-pattern.png')]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <img src="/assets/r50inc.jpg" alt="Anker" className="relative w-64 h-64 object-contain rounded-xl z-10 transform transition-transform hover:scale-105 duration-700" />
            
            {/* بطاقات الميزات تطفو */}
            <div className="absolute -right-4 top-10 bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce z-20">
              Noise Cancelling 🔇
            </div>
            <div className="absolute -left-4 bottom-10 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce delay-700 z-20">
              10H Playtime 🔋
            </div>
          </div>
          
          <div className="mt-8 flex gap-1 justify-center">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">الأكثر مبيعاً حالياً! 🔥</h2>
        </div>
      )
    },
    // المشهد 3: حل مشكلة العنوان (Map)
    {
      id: 2,
      bg: 'bg-gray-100',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center relative overflow-hidden">
           {/* محاكاة الخريطة */}
           <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=32.490353,3.646553&zoom=15&size=600x1000&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&style=feature:all|saturation:-100')] bg-cover opacity-60"></div>
           
           <div className="z-10 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/50 w-3/4 transform transition-all animate-fade-in-up">
             <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm border-b pb-2">
               <Navigation className="w-4 h-4" />
               <span>تحديد الموقع...</span>
             </div>
             
             <div className="flex flex-col items-center gap-4">
               <div className="relative">
                 <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-ping"></div>
                 <MapPin className="w-12 h-12 text-red-600 drop-shadow-md animate-bounce" />
               </div>
               
               <div className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                 <CheckCircle className="w-3 h-3" />
                 تم تأكيد العنوان بدقة GPS
               </div>
               
               <p className="text-gray-800 font-bold text-sm mt-2">
                 وداعاً للطلبات الراجعة! ❌📦
               </p>
             </div>
           </div>
        </div>
      )
    },
    // المشهد 4: الـ Upsell الذكي
    {
      id: 3,
      bg: 'bg-gradient-to-br from-gray-900 to-blue-900',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white space-y-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Smart Upsell 🧠
          </h2>
          
          <div className="w-full bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
             <div className="flex justify-between items-center text-sm mb-2 text-gray-300">
               <span>قيمة الطلب:</span>
               <span>4770 دج</span>
             </div>
             
             {/* خط الحركة */}
             <div className="h-1 bg-gray-600 rounded-full mb-4 overflow-hidden">
               <div className="h-full bg-green-500 w-full animate-[width_2s_ease-out]"></div>
             </div>

             <div className="bg-green-600/20 border border-green-500/50 p-3 rounded-xl flex items-center justify-between mb-4 animate-pulse">
               <div className="flex items-center gap-2">
                 <div className="bg-green-500 p-1 rounded">
                   <Zap className="w-4 h-4 text-white" />
                 </div>
                 <span className="text-sm font-bold text-green-400">+ شاحن سامسونج</span>
               </div>
               <span className="font-bold text-green-300">+470 دج</span>
             </div>

             <div className="text-4xl font-black text-white flex justify-center items-center gap-2 animate-bounce">
               5240 دج
             </div>
             <p className="text-xs text-gray-400 mt-2">سلة أكبر = عمولة أكبر لك!</p>
          </div>
        </div>
      )
    },
    // المشهد 5: CTA النهائي
    {
      id: 4,
      bg: 'bg-black',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white relative">
          <div className="absolute inset-0 bg-[url('/assets/r50inc.jpg')] bg-cover opacity-20 bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
          
          <div className="z-10 flex flex-col items-center">
            <ShoppingBag className="w-20 h-20 text-blue-500 mb-6 animate-pulse" />
            
            <h2 className="text-4xl font-black mb-2">PRINCE SHOP</h2>
            <p className="text-xl text-gray-300 mb-8">ابدأ نجاحك اليوم</p>
            
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold shadow-lg shadow-blue-600/50 transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                سجل كـ مسوق الآن <ArrowRight className="w-4 h-4" />
              </button>
              <button className="bg-white text-black w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                 اطلب المنتج لنفسك <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-8 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-full">
              www.princeshop.pages.dev
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden ring-4 ring-gray-900/50">
        <div className={`w-full h-full transition-colors duration-700 ${scenes[slide].bg}`}>
           {scenes[slide].content}
        </div>
        
        {/* Progress Bar styled like Instagram Stories */}
        <div className="absolute top-4 left-0 w-full px-2 flex gap-1 z-50">
          {scenes.map((s, idx) => (
             <div key={s.id} className="h-1 flex-1 bg-gray-500/50 rounded-full overflow-hidden">
               <div 
                 className={`h-full bg-white transition-all duration-300 ${
                   idx === slide ? 'w-full animate-[width_5s_linear]' : idx < slide ? 'w-full' : 'w-0'
                 }`}
               ></div>
             </div>
          ))}
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4">
         <div className="text-gray-400 text-xs text-center mb-2">Controls</div>
         <button onClick={() => setSlide(0)} className="bg-white/10 p-4 rounded-full hover:bg-white/20 text-white transition-colors" title="Replay">
           ↻
         </button>
         <button onClick={() => setSlide(prev => (prev < 4 ? prev + 1 : 0))} className="bg-blue-600 p-4 rounded-full hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-600/50" title="Next Scene">
           →
         </button>
      </div>
    </div>
  );
};

// Helper Icon Component
const ArrowRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

export default PromoGenerator;
