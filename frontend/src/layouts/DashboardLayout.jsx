import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Wallet, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const navigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { name: 'المنتجات', href: '/dashboard/products', icon: Package },
    { name: 'طلباتي', href: '/dashboard/orders', icon: ShoppingBag },
    { name: 'السحوبات', href: '/dashboard/withdrawals', icon: Wallet },
    { name: 'الملف الشخصي', href: '/dashboard/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="text-right">
            <p className="font-semibold text-sm sm:text-base">{user.name}</p>
            <p className="text-xs text-gray-500">{user.affiliateCode}</p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full bg-white border-l w-64 sm:w-72 z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            منصة المسوقين
          </h2>
          <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-gray-900 text-sm sm:text-base">{user.name}</p>
            <p className="text-xs sm:text-sm text-blue-600 font-mono">{user.affiliateCode}</p>
          </div>
        </div>

        <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors touch-manipulation
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 right-0 left-0 p-3 sm:p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:mr-64 sm:lg:mr-72 p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
