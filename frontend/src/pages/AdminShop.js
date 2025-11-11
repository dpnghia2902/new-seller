import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopAPI, productAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './AdminShop.css';

const AdminShop = () => {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    discount: '',
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
  }, [user, isUserSeller, navigate]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const shopRes = await shopAPI.getMyShop();
      setShop(shopRes.data.shop);

      const productsRes = await productAPI.getMyProducts();
      setProducts(productsRes.data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      await productAPI.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discount: parseFloat(formData.discount) || 0,
      });

      setFormData({
        title: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        discount: '',
      });
      setShowAddProduct(false);
      fetchShopData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(productId);
        fetchShopData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (loading) {
    return <div className="admin-shop loading">Loading shop data...</div>;
  }

  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Other'];

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Dashboard</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-btn">
            ✕
          </button>
        </div>
      )}

      {shop && (
        <div className="shop-info">
          <div className="shop-card">
            <h2>{shop.shopName}</h2>
            <p className="shop-description">{shop.description || 'No description'}</p>
            <div className="shop-stats">
              <div className="stat">
                <span className="stat-label">Products</span>
                <span className="stat-value">{products.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Rating</span>
                <span className="stat-value">⭐ {shop.rating}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Followers</span>
                <span className="stat-value">{shop.followersCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="products-management">
        <div className="section-header">
          <h2>My Products</h2>
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="btn-add-product"
          >
            {showAddProduct ? '✕ Cancel' : '+ Add Product'}
          </button>
        </div>

        {showAddProduct && (
          <form onSubmit={handleAddProduct} className="add-product-form">
            <div className="form-row">
              <div className="form-group">
                <label>Product Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Product title"
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Stock *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Product description"
                rows="4"
              />
            </div>

            <button type="submit" className="btn-submit">
              Add Product
            </button>
          </form>
        )}

        <div className="products-list">
          {products.length === 0 ? (
            <div className="no-products">
              <p>You haven't added any products yet.</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-add-product"
              >
                + Add Your First Product
              </button>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Discount</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.title}</td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>{product.discount}%</td>
                    <td>⭐ {product.rating}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="btn-view"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminShop;
