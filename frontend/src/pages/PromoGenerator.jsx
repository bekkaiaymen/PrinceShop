import React, { useState, useEffect } from 'react';
import { MapPin, Zap, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

const PromoGenerator = () => {
  const [slide, setSlide] = useState(0);

  // التحكم في توقيت المشاهد
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev < 5 ? prev + 1 : 0)); // يعيد الفيديو عند الانتهاء
    }, 4000); // 4 ثواني لكل مشهد
    return () => clearInterval(timer);
  }, []);

  const scenes = [
    // المشهد 1: المقدمة
    {
      id: 0,
      bg: 'bg-gradient-to-br from-blue-900 to-black',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in-up">
          <div className="relative mb-8">
             <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse"></div>
             <img src="/assets/r50inc.jpg" alt="Product" className="w-64 h-64 object-contain relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 leading-tight">
            منتج <span className="text-yellow-400">رابح</span><br/>للمسوقين! 🚀
          </h1>
          <p className="text-gray-300 text-lg">Anker R50i NC</p>
        </div>
      )
    },
    // المشهد 2: مشكلة التوصيل
    {
      id: 1,
      bg: 'bg-white',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            تعبت من مشاكل<br/><span className="text-red-600">العناوين الخاطئة؟</span> 😫
          </h2>
          <div className="w-full max-w-sm bg-gray-100 rounded-xl p-4 shadow-xl mb-4 opacity-50 blur-[1px]">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <TrendingUp className="w-20 h-20 text-red-500 mb-4 animate-bounce" />
          <p className="text-xl font-bold text-red-600">نسبة توصيل ضعيفة...</p>
        </div>
      )
    },
    // المشهد 3: الحل (الخريطة)
    {
      id: 2,
      bg: 'bg-white',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=32.490353,3.646553&zoom=15&size=600x1000&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8')] bg-cover opacity-20"></div>
           
           <h2 className="text-4xl font-black text-blue-700 mb-8 relative z-10">
             الحل عندنا! 🎯
           </h2>
           
           <div className="bg-white p-2 rounded-2xl shadow-2xl relative z-10 transform rotate-1 scale-110 border-4 border-blue-500">
             <img src="/assets/map-screenshot.png" className="w-64 h-auto rounded-lg" alt="Map UI" onError={(e) => e.target.style.display='none'} />
             <div className="absolute -top-6 -right-6 bg-red-600 text-white p-3 rounded-full shadow-lg animate-bounce">
               <MapPin className="w-8 h-8" />
             </div>
             <div className="p-4">
                <p className="font-bold text-gray-800">تحديد الموقع بدقة GPS</p>
                <div className="text-xs text-green-600 font-bold mt-1">✓ تأكيد فوري للعنوان</div>
             </div>
           </div>
        </div>
      )
    },
    // المشهد 4: الأرباح (Upsell)
    {
      id: 3,
      bg: 'bg-gradient-to-t from-purple-900 to-indigo-900',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white">
          <h2 className="text-3xl font-bold mb-8">
            زيد أرباحك بذكاء! 🧠
          </h2>
          
          <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-xs transform transition-all duration-500 hover:scale-105">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <span className="font-bold">سماعة Anker</span>
              <span className="font-bold">4770 دج</span>
            </div>
            <div className="flex justify-between items-center mb-4 bg-green-50 p-2 rounded-lg border border-green-200 animate-pulse">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-sm text-green-800">+ شاحن Samsung</span>
              </div>
              <span className="font-bold text-green-700">+470 دج</span>
            </div>
            <div className="mt-4 pt-2 border-t flex justify-between items-center text-xl font-black text-purple-600">
              <span>المجموع:</span>
              <span>5240 دج</span>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-yellow-400 font-bold text-2xl">
            <DollarSign className="w-8 h-8" />
            <span>عمولة أكبر في جيبك!</span>
          </div>
        </div>
      )
    },
    // المشهد 5: الخاتمة
    {
      id: 4,
      bg: 'bg-black',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-white">
          <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            PRINCE SHOP
          </h2>
          <p className="text-2xl font-light mb-8 text-gray-300">منصة التسويق بالعمولة #1</p>
          
          <div className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl animate-bounce shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            سجل الآن وابدأ الربح
          </div>
          
          <p className="mt-12 text-sm text-gray-500">الرابط في البايو 🔗</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Phone Mockup Frame */}
      <div className="relative w-full max-w-[400px] aspect-[9/16] bg-black rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden ring-4 ring-gray-900/50">
        {/* Dynamic Scene Content */}
        <div className={`w-full h-full transition-colors duration-500 ${scenes[slide].bg}`}>
           {scenes[slide].content}
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-1/3 flex gap-1">
          {scenes.map((s, idx) => (
             <div 
               key={s.id} 
               className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === slide ? 'bg-white' : 'bg-white/20'}`}
             ></div>
          ))}
        </div>
        
        {/* Top Notch for realism */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
      </div>
      
      <div className="absolute bottom-4 text-white text-center">
        <p className="mb-2">🎥 <strong>طريقة الاستخدام:</strong> شغل تسجيل الشاشة وسجل هذا العرض</p>
        <button onClick={() => setSlide(0)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          إعادة العرض من البداية ↻
        </button>
      </div>
    </div>
  );
};

export default PromoGenerator;
