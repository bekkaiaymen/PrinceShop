import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // إظهار الرسالة بعد 3 ثوان
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // إخفاء لمدة 7 أيام
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // التحقق من الإخفاء السابق
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (!showInstallPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideUp">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <img src="/assets/logo.png" alt="Logo" className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-bold text-lg">ثبّت التطبيق</h3>
              <p className="text-sm text-blue-100">للوصول السريع والسهل</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>عمل بدون إنترنت</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>تحديثات فورية للطلبات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>أداء أسرع</span>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Download className="w-5 h-5" />
          تثبيت التطبيق الآن
        </button>

        <button
          onClick={handleDismiss}
          className="w-full mt-2 text-white/80 hover:text-white py-2 text-sm transition-colors"
        >
          ربما لاحقاً
        </button>
      </div>
    </div>
  );
}
