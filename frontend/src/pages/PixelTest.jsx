import React, { useState, useEffect } from 'react';

function PixelTest() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('loading'); // loading, success, error

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    console.log(`%c[PixelTest] ${msg}`, 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');
  };

  // Function to inject pixel manually if missing
  const forceInjectPixel = () => {
    if (document.getElementById('fb-pixel-script')) return;
    
    addLog('⚠️ جاري محاولة حقن كود البيكسل يدوياً...');
    
    const script = document.createElement('script');
    script.id = 'fb-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src='https://connect.facebook.net/en_US/fbevents.js';
      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script');
      fbq('init', '874112828663649', {external_id: 'TEST34924'});
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    addLog('💉 تم حقن الكود. انتظر قليلاً...');
  };

  useEffect(() => {
    addLog('🔄 بدء فحص النظام...');
    
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      
      if (window.fbq) {
        addLog('✅ تم اكتشاف البيكسل (window.fbq) بنجاح!');
        setStatus('success');
        clearInterval(interval);
      } else {
        addLog(`⏳ محاولة العثور على البيكسل (${attempts}/10)...`);
        
        // If not found after 3 attempts, force inject
        if (attempts === 3) {
          forceInjectPixel();
        }
        
        if (attempts >= 10) {
          addLog('❌ فشل العثور على البيكسل نهائياً. (AdBlock نشط جداً)');
          setStatus('error');
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendViewContent = () => {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'Test Product',
        content_ids: ['TEST_101'],
        content_type: 'product',
        value: 500,
        currency: 'DZD'
      });
      addLog('🚀 تم إرسال حدث: ViewContent');
      alert('تم الإرسال! تحقق من فيسبوك الآن.');
    } else {
      addLog('❌ خطأ: البيكسل غير موجود.');
      alert('البيكسل غير موجود! انتظر التحميل أو أوقف مانع الإعلانات.');
    }
  };

  const sendPurchase = () => {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: 1000,
        currency: 'DZD',
        content_name: 'Test Purchase',
        content_ids: ['TEST_101'],
        content_type: 'product',
        num_items: 1
      });
      addLog('💰 تم إرسال حدث: Purchase (1000 دج)');
    } else {
      addLog('❌ خطأ: البيكسل غير موجود.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center font-sans" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">🛠️ فحص بيكسل فيسبوك (React)</h1>
        
        {status === 'loading' && (
          <div className="bg-yellow-100 border-2 border-yellow-500 text-yellow-900 p-4 rounded-xl mb-6 text-lg font-bold animate-pulse">
            ⏳ جاري فحص البيكسل...
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-100 border-2 border-green-600 text-green-900 p-4 rounded-xl mb-6 text-lg font-bold">
            ✅ البيكسل يعمل بنجاح!
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-100 border-2 border-red-600 text-red-900 p-4 rounded-xl mb-6 text-lg font-bold">
            ❌ فشل تحميل البيكسل (AdBlock؟)
          </div>
        )}
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 text-sm">
          استخدم هذه الصفحة للتأكد من أن البيكسل يرسل البيانات بشكل صحيح لفيسبوك.
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <button 
            onClick={sendViewContent}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            👁️ إرسال ViewContent
          </button>
          
          <button 
            onClick={sendPurchase}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95"
          >
            💰 إرسال Purchase (1000 دج)
          </button>
        </div>

        <div className="text-right">
          <h3 className="text-sm font-bold text-gray-500 mb-2">سجل العمليات:</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-xl h-48 overflow-y-auto text-xs font-mono border-2 border-gray-800 text-left" dir="ltr">
            {logs.length === 0 && <span className="text-gray-600">Waiting...</span>}
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
           Pixel ID: 874112828663649
        </div>
      </div>
    </div>
  );
}

export default PixelTest;