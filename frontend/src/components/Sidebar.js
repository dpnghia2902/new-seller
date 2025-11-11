import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/orders', icon: '📦', label: 'Orders' },
    { path: '/products', icon: '🛍️', label: 'Products' },
    { path: '/inventory', icon: '📋', label: 'Inventory' },
    { path: '/coupons', icon: '🎫', label: 'Coupons' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

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
            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
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
