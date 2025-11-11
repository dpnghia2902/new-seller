import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../api/client';
import './BecomeSeller.css';

const BecomeSeller = () => {
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!shopName) {
        setError('Please enter a shop name');
        return;
      }

      await shopAPI.createShop({ shopName, description, logo, banner, location });
      setSuccess('Shop created successfully!');
      
      setTimeout(() => {
        navigate('/admin/shop');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  if (user?.storeId) {
    return (
      <div className="become-seller-page">
        <div className="seller-container">
          <div className="info-box">
            <h2>You are already a seller!</h2>
            <p>You already have a shop. Go to your shop dashboard.</p>
            <button onClick={() => navigate('/admin/shop')} className="btn-primary">
              Go to Shop Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="become-seller-page">
      <div className="seller-container">
        <h2 className="seller-title">Become a Seller</h2>
        <p className="seller-subtitle">Start selling on eBay Clone today</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="seller-form">
          <div className="form-group">
            <label>Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              placeholder="Enter your shop name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Shop Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your shop..."
              className="form-input"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, NY"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Logo URL (Optional)</label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.jpg"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Banner URL (Optional)</label>
            <input
              type="url"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary submit-btn">
            {loading ? 'Creating...' : 'Create Shop'}
          </button>
        </form>

        <div className="benefits">
          <h3>Benefits of becoming a seller:</h3>
          <ul>
            <li>✓ Reach millions of buyers</li>
            <li>✓ Build your own store</li>
            <li>✓ Manage products easily</li>
            <li>✓ Track sales and earnings</li>
            <li>✓ Get seller protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
