import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/orders', icon: '📦', label: 'Orders' },
    { path: '/products', icon: '🛍️', label: 'Products' },
    { path: '/inventory', icon: '📋', label: 'Inventory' },
    { path: '/coupons', icon: '🎫', label: 'Coupons' },
    { path: '/verification', icon: '✓', label: 'Verification' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  // Add admin-only menu items
  if (user?.role === 'admin') {
    menuItems.splice(menuItems.length - 1, 0, {
      path: '/error-logs',
      icon: '🐛',
      label: 'Error Logs',
      adminOnly: true,
    });
  }

  const isActive = (path) => location.pathname === path;

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>FSShop</h2>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${isActive(item.path) ? 'active' : ''} ${item.adminOnly ? 'admin-only' : ''}`}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={handleBackToHome} title="Back to Home">
          ⇄
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
