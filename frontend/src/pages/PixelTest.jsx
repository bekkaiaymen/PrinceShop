import React, { useState, useEffect } from 'react';

function PixelTest() {
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    // Log to browser console as well so user can copy-paste to AI
    console.log(`PIXEL_TEST: ${msg}`);
  };

  useEffect(() => {
    // Check if FBQ exists on mount
    setTimeout(() => {
      if (window.fbq) {
        addLog('✅ البيكسل (fbq) محمل بنجاح.');
      } else {
        addLog('❌ البيكسل (fbq) غير موجود! (تأكد من إيقاف AdBlock)');
      }
    }, 1000);
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
    } else {
      addLog('❌ خطأ: البيكسل غير موجود.');
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