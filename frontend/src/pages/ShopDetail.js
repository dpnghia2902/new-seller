import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shopAPI, productAPI } from '../api/client';
import ProductCard from '../components/ProductCard';
import './ShopDetail.css';

const ShopDetail = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShopData();
  }, [shopId]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const shopRes = await shopAPI.getShop(shopId);
      setShop(shopRes.data.shop);
      setProducts(shopRes.data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="shop-detail loading">Loading shop...</div>;
  }

  if (error) {
    return <div className="shop-detail error">{error}</div>;
  }

  if (!shop) {
    return <div className="shop-detail error">Shop not found</div>;
  }

  return (
    <div className="shop-detail">
      <div className="shop-header">
        <div className="shop-banner">
          {shop.banner ? <img src={shop.banner} alt={shop.shopName} /> : null}
        </div>

        <div className="shop-info-section">
          <div className="shop-info-content">
            <div className="shop-logo">
              {shop.logo ? (
                <img src={shop.logo} alt={shop.shopName} />
              ) : (
                <div className="logo-placeholder">🏪</div>
              )}
            </div>

            <div className="shop-details">
              <h1>{shop.shopName}</h1>
              <p className="shop-owner">By {shop.owner?.username}</p>

              {shop.description && <p className="shop-description">{shop.description}</p>}

              <div className="shop-stats">
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">⭐ {shop.rating}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Followers</span>
                  <span className="stat-value">{shop.followersCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Products</span>
                  <span className="stat-value">{shop.productCount}</span>
                </div>
              </div>

              <div className="shop-actions">
                <button className="btn-follow">Follow Shop</button>
                <button className="btn-contact">Contact Seller</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shop-products">
        <h2>Shop Products</h2>

        {products.length === 0 ? (
          <div className="no-products">
            <p>This shop has no products yet.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetail;
