import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">

      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📦</span> eBay Clone
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            Home
          </Link>

          {isAuthenticated ? (
            <div className="nav-user">
              <span className="user-welcome">Welcome, {user?.username}!</span>
              {user?.storeId ? (
                <>
                  <Link to="/dashboard" className="nav-link btn-shop">
                    🏪 Shop
                  </Link>
                </>
              ) : (
                <Link to="/become-seller" className="nav-link btn-seller">
                  Become a Seller
                </Link>
              )}
              <button onClick={handleLogout} className="nav-link btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link btn-register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
