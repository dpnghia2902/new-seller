import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BecomeSeller from './pages/BecomeSeller';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Coupons from './pages/Coupons';
import Profile from './pages/Profile';
import ShopDetail from './pages/ShopDetail';
import ProductDetail from './pages/ProductDetail';
import Verification from './pages/Verification';
import ErrorLogs from './pages/ErrorLogs';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <Navbar />
            <ConnectionStatus />
            <main className="main-content">
              <Suspense fallback={<div className="loading">Loading...</div>}>
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/shop/:shopId" element={<ShopDetail />} />
                <Route
                  path="/become-seller"
                  element={
                    <ProtectedRoute>
                      <BecomeSeller />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coupons"
                  element={
                    <ProtectedRoute>
                      <Coupons />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verification"
                  element={
                    <ProtectedRoute>
                      <Verification />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/error-logs"
                  element={
                    <ProtectedRoute>
                      <ErrorLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </main>
        </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
