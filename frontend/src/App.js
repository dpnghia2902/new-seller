import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import FloatingNotifications from './components/FloatingNotifications'; // <-- thêm
import ProtectedRoute from './components/ProtectedRoute';
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
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import Profile from './pages/Profile';
import ShopDetail from './pages/ShopDetail';
import ProductDetail from './pages/ProductDetail';
import Reviews from './pages/Reviews';

function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <div className="App">
                        {/* Bạn không dùng Navbar ở trang quản lý cũng không sao */}
                        <Navbar />

                        {/* Chuông nổi cho các trang quản lý */}
                        <FloatingNotifications />

                        <main className="main-content">
                            <Suspense fallback={<div className="loading">Loading...</div>}>
                                <Routes>
                                    {/* giữ nguyên toàn bộ routes */}
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
                                        path="/complaints/:complaintId"
                                        element={
                                            <ProtectedRoute>
                                                <ComplaintDetail />
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
                                        path="/complaints"
                                        element={
                                            <ProtectedRoute>
                                                <Complaints />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/reviews"
                                        element={
                                            <ProtectedRoute>
                                                <Reviews />
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
