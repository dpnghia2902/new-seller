import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './Profile.css';

const Profile = () => {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    logo: '',
    banner: '',
    location: '',
  });

  const navigate = useNavigate();
  const { user, isUserSeller } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isUserSeller) {
      navigate('/become-seller');
      return;
    }

    fetchShopData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserSeller]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const res = await shopAPI.getMyShop();
      setShop(res.data.shop);
      setFormData({
        shopName: res.data.shop.shopName || '',
        description: res.data.shop.description || '',
        logo: res.data.shop.logo || '',
        banner: res.data.shop.banner || '',
        location: res.data.shop.location || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shop information');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await shopAPI.updateShop(formData);
      setIsEditing(false);
      fetchShopData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update shop information');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getCategoryStats = () => {
    // This would ideally come from backend
    // For now, we'll show placeholder data
    return [
      { name: 'Clothing', icon: '👕', items: 342 },
      { name: 'Shoes', icon: '👟', items: 156 },
      { name: 'Accessories', icon: '💍', items: 89 },
      { name: 'Bags', icon: '👜', items: 67 },
    ];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="profile-page loading">Loading profile...</div>
      </AdminLayout>
    );
  }

  if (error && !shop) {
    return (
      <AdminLayout>
        <div className="profile-page">
          <div className="error-message">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  const categories = getCategoryStats();
  const totalProducts = categories.reduce((sum, cat) => sum + cat.items, 0);

  return (
    <AdminLayout>
      <div className="profile-page">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError('')} className="close-btn">
              ✕
            </button>
          </div>
        )}

        <div className="profile-content">
          {/* Shop Header Card */}
          <div className="shop-header-card">
            <div className="shop-banner">
              {formData.banner ? (
                <img src={formData.banner} alt="Shop Banner" />
              ) : (
                <div className="banner-placeholder">
                  <span>{shop?.shopName || 'Shop Banner'}</span>
                </div>
              )}
            </div>

            <div className="shop-info-section">
              <div className="shop-logo">
                {formData.logo ? (
                  <img src={formData.logo} alt={shop?.shopName} />
                ) : (
                  <div className="logo-placeholder">
                    <span>{shop?.shopName?.charAt(0) || 'S'}</span>
                  </div>
                )}
              </div>

              <div className="shop-details">
                <h1 className="shop-name">{shop?.shopName}</h1>
                <div className="shop-rating">
                  <span className="stars">⭐⭐⭐⭐⭐</span>
                  <span className="rating-value">(4.9)</span>
                </div>
                <p className="shop-tagline">Premium Fashion Store</p>

                <div className="shop-meta">
                  <div className="meta-item">
                    <span className="icon">📍</span>
                    <span>{shop?.location || 'Location not set'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="icon">📅</span>
                    <span>Member since {formatDate(shop?.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="icon">📦</span>
                    <span>{totalProducts} Products</span>
                  </div>
                  <div className="meta-item">
                    <span className="icon">👥</span>
                    <span>{shop?.followers || 0} Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Store Section */}
          <div className="about-section">
            <div className="section-header">
              <h2>About Our Store</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn-edit">
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="edit-form">
                <div className="form-group">
                  <label htmlFor="shopName">Shop Name</label>
                  <input
                    type="text"
                    id="shopName"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Tell customers about your store..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., New York, NY"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="logo">Logo URL</label>
                  <input
                    type="url"
                    id="logo"
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.jpg"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="banner">Banner URL</label>
                  <input
                    type="url"
                    id="banner"
                    name="banner"
                    value={formData.banner}
                    onChange={handleChange}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    💾 Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        shopName: shop?.shopName || '',
                        description: shop?.description || '',
                        logo: shop?.logo || '',
                        banner: shop?.banner || '',
                        location: shop?.location || '',
                      });
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="about-content">
                <p>
                  {shop?.description ||
                    'No description available. Click Edit Profile to add information about your store.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
