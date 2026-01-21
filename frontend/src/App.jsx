import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import CustomerHome from './pages/CustomerHome';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AffiliateProducts from './pages/AffiliateProducts';
import AffiliateOrders from './pages/AffiliateOrders';
import AffiliateWithdrawals from './pages/AffiliateWithdrawals';
import AffiliateProfile from './pages/AffiliateProfile';
import ImageVerification from './pages/ImageVerification';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import OwnerLogin from './pages/OwnerLogin';
import OwnerDashboard from './pages/OwnerDashboard';
import PixelTest from './pages/PixelTest'; // صفحة فحص البيكسل
import AnkerAirPodsLanding from './pages/AnkerAirPodsLanding'; // صفحة هبوط Anker

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - للعملاء */}
          <Route path="/" element={<CustomerHome />} />
          <Route path="/pixel-test" element={<PixelTest />} /> {/* مسار الفحص الجديد */}
          <Route path="/anker-r50inc" element={<AnkerAirPodsLanding />} /> {/* صفحة Anker المخصصة */}
          <Route path="/landing/:productId" element={<LandingPage />} />
          <Route path="/products" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-images" element={<ImageVerification />} />
          
          {/* Dashboard Routes - للمسوقين */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AffiliateProducts />} />
            <Route path="customer-orders" element={<AffiliateOrders />} />
            <Route path="withdrawals" element={<AffiliateWithdrawals />} />
            <Route path="profile" element={<AffiliateProfile />} />
          </Route>
          
          {/* Owner Routes - لصاحب الموقع */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          
          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
