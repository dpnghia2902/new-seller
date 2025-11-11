import React, { useState, useEffect } from 'react';
import { couponAPI, productAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './Coupons.css';

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: '0',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    applicableProducts: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await couponAPI.getMyCoupons();
      setCoupons(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setError('Failed to load coupons');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getMyProducts();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductSelection = (productId) => {
    setFormData(prev => {
      const isSelected = prev.applicableProducts.includes(productId);
      return {
        ...prev,
        applicableProducts: isSelected
          ? prev.applicableProducts.filter(id => id !== productId)
          : [...prev.applicableProducts, productId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate dates
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('End date must be after start date');
        return;
      }

      // Prepare data
      const couponData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchase: parseFloat(formData.minPurchase) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
      };

      if (editingCoupon) {
        await couponAPI.updateCoupon(editingCoupon._id, couponData);
        setSuccess('Coupon updated successfully!');
      } else {
        await couponAPI.createCoupon(couponData);
        setSuccess('Coupon created successfully!');
      }

      fetchCoupons();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving coupon:', error);
      setError(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minPurchase: coupon.minPurchase.toString(),
      maxDiscount: coupon.maxDiscount?.toString() || '',
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
      usageLimit: coupon.usageLimit?.toString() || '',
      applicableProducts: coupon.applicableProducts.map(p => p._id || p)
    });
    setShowModal(true);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      await couponAPI.deleteCoupon(couponId);
      setSuccess('Coupon deleted successfully!');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError('Failed to delete coupon');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '0',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      applicableProducts: []
    });
    setError('');
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      await couponAPI.updateCoupon(coupon._id, { isActive: !coupon.isActive });
      setSuccess(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      setError('Failed to update coupon status');
    }
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    return `$${coupon.discountValue}`;
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return 'inactive';
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 'limit-reached';
    return 'active';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading coupons...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="coupons-page">
        <div className="coupons-header">
          <h1>Coupon Management</h1>
          <button className="btn-create" onClick={() => setShowModal(true)}>
            + Create Coupon
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="coupons-grid">
          {coupons.length === 0 ? (
            <div className="no-coupons">
              <p>No coupons yet. Create your first coupon!</p>
            </div>
          ) : (
            coupons.map(coupon => {
              const status = getCouponStatus(coupon);
              return (
                <div key={coupon._id} className={`coupon-card ${status}`}>
                  <div className="coupon-header">
                    <div className="coupon-code">{coupon.code}</div>
                    <span className={`status-badge status-${status}`}>
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="coupon-discount-container">
                    <div className="coupon-discount">
                      {getDiscountDisplay(coupon)}
                      <span className="discount-type">
                        {coupon.discountType === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                    <div className="discount-label">
                      {coupon.discountType === 'percentage' ? 'OFF' : 'DISCOUNT'}
                    </div>
                  </div>

                  <div className="coupon-description">{coupon.description}</div>

                  <div className="coupon-details">
                    {coupon.minPurchase > 0 && (
                      <div className="detail-item">
                        Min. Purchase: <strong>${coupon.minPurchase}</strong>
                      </div>
                    )}
                    {coupon.maxDiscount && (
                      <div className="detail-item">
                        Max. Discount: <strong>${coupon.maxDiscount}</strong>
                      </div>
                    )}
                    <div className="detail-item">
                      Valid: <strong>{new Date(coupon.startDate).toLocaleDateString()}</strong> to{' '}
                      <strong>{new Date(coupon.endDate).toLocaleDateString()}</strong>
                    </div>
                    {coupon.usageLimit && (
                      <div className="detail-item">
                        Usage: <strong>{coupon.usedCount}/{coupon.usageLimit}</strong>
                      </div>
                    )}
                    <div className="detail-item">
                      Applicable Products:{' '}
                      <strong>
                        {coupon.applicableProducts.length === 0
                          ? 'All Products'
                          : `${coupon.applicableProducts.length} Products`}
                      </strong>
                    </div>
                  </div>

                  <div className="coupon-actions">
                    <button
                      className={`btn-toggle ${coupon.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleCouponStatus(coupon)}
                    >
                      {coupon.isActive ? '✓ Active' : '✗ Inactive'}
                    </button>
                    <button className="btn-edit" onClick={() => handleEdit(coupon)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(coupon._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                <button className="btn-close" onClick={handleCloseModal}>×</button>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Coupon Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g., SUMMER2024"
                      required
                      pattern="[A-Za-z0-9]+"
                      title="Only letters and numbers allowed"
                    />
                  </div>

                  <div className="form-group">
                    <label>Discount Type *</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your coupon offer"
                    rows="2"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Value *</label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      placeholder={formData.discountType === 'percentage' ? '0-100' : '0'}
                      min="0"
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Minimum Purchase ($)</label>
                    <input
                      type="number"
                      name="minPurchase"
                      value={formData.minPurchase}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {formData.discountType === 'percentage' && (
                  <div className="form-group">
                    <label>Maximum Discount ($)</label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleInputChange}
                      placeholder="Optional - leave empty for no limit"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="Optional - leave empty for unlimited"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Applicable Products</label>
                  <p className="help-text">
                    Leave empty to apply to all products, or select specific products
                  </p>
                  <div className="products-selection">
                    {products && products.length > 0 ? (
                      products.map(product => (
                        <label key={product._id} className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.applicableProducts.includes(product._id)}
                            onChange={() => handleProductSelection(product._id)}
                          />
                          <img
                            src={product.images?.[0] || 'https://via.placeholder.com/40'}
                            alt={product.title}
                          />
                          <span>{product.title}</span>
                        </label>
                      ))
                    ) : (
                      <p className="no-products-message">No products available. Create products first.</p>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Coupons;
