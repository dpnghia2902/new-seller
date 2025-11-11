import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, orderAPI, couponAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAllProducts({ search, category });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    setShowBuyModal(true);
    setOrderError('');
    setOrderSuccess('');
  };

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      // Extract shop ID
      let shopId;
      if (typeof selectedProduct.shop === 'object' && selectedProduct.shop !== null) {
        shopId = selectedProduct.shop._id;
      } else {
        shopId = selectedProduct.shop;
      }

      const response = await couponAPI.validateCoupon({
        code: couponCode,
        shopId: shopId,
        productIds: [selectedProduct._id],
        totalPrice: selectedProduct.price * quantity,
      });

      if (response.data.valid) {
        setAppliedCoupon(response.data.coupon);
        setCouponError('');
        setOrderSuccess(`Coupon applied! You save $${response.data.discount.toFixed(2)}`);
        setTimeout(() => setOrderSuccess(''), 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid coupon code';
      setCouponError(errorMsg);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  const calculateTotal = () => {
    const subtotal = selectedProduct.price * quantity;
    if (!appliedCoupon) return subtotal;

    let discount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else {
      discount = appliedCoupon.discountValue;
    }

    return Math.max(0, subtotal - discount);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setOrderError('');
    setOrderSuccess('');

    try {
      const subtotal = selectedProduct.price * quantity;
      let finalTotal = subtotal;
      let discount = 0;
      
      // Extract shop ID - handle both populated and unpopulated shop field
      let shopId;
      if (typeof selectedProduct.shop === 'object' && selectedProduct.shop !== null) {
        shopId = selectedProduct.shop._id;
      } else {
        shopId = selectedProduct.shop;
      }

      // Calculate discount if coupon is applied
      if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
          discount = (subtotal * appliedCoupon.discountValue) / 100;
          if (appliedCoupon.maxDiscount) {
            discount = Math.min(discount, appliedCoupon.maxDiscount);
          }
        } else {
          discount = appliedCoupon.discountValue;
        }
        finalTotal = Math.max(0, subtotal - discount);
      }

      console.log('Creating order with shopId:', shopId);
      console.log('Selected product:', selectedProduct);
      console.log('Coupon applied:', appliedCoupon);

      const orderData = {
        shopId: shopId,
        items: [
          {
            productId: selectedProduct._id,
            title: selectedProduct.title,
            price: selectedProduct.price,
            quantity: quantity,
          },
        ],
        totalPrice: finalTotal,
        originalPrice: appliedCoupon ? subtotal : null,
        discount: appliedCoupon ? discount : 0,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingAddress: shippingAddress,
        notes: '',
      };

      console.log('Order data:', orderData);
      const response = await orderAPI.createOrder(orderData);
      console.log('Order created:', response.data);

      let successMessage = '✅ Order placed successfully!';
      if (appliedCoupon) {
        successMessage += ` You saved $${discount.toFixed(2)} with coupon ${appliedCoupon.code}!`;
      }
      
      setOrderSuccess(successMessage);
      setTimeout(() => {
        setShowBuyModal(false);
        setOrderSuccess('');
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
        setShippingAddress({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        });
      }, 3000);
    } catch (error) {
      console.error('Order creation error:', error);
      console.error('Error response:', error.response);
      setOrderError(error.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const closeBuyModal = () => {
    setShowBuyModal(false);
    setSelectedProduct(null);
    setOrderError('');
    setOrderSuccess('');
  };

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Books',
    'Toys',
    'Other',
  ];

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to eBay Clone</h1>
        <p>Find great deals on millions of items</p>
      </div>

      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button onClick={fetchProducts} className="search-btn">
            Search
          </button>
        </div>

        <div className="filter-section">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-section">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="no-products">No products found</div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} onBuyClick={handleBuyClick} />
            ))}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {showBuyModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeBuyModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Place Order</h2>
              <button className="modal-close-btn" onClick={closeBuyModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {orderError && <div className="error-message">{orderError}</div>}
              {orderSuccess && <div className="success-message">{orderSuccess}</div>}

              <div className="product-summary">
                <h3>Product Details</h3>
                <div className="summary-item">
                  <span className="summary-label">Product:</span>
                  <span className="summary-value">{selectedProduct.title}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Price:</span>
                  <span className="summary-value">${selectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <label htmlFor="quantity" className="summary-label">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="quantity-input"
                  />
                </div>
                
                {/* Coupon Section */}
                <div className="coupon-section">
                  <h4>Have a Coupon?</h4>
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={appliedCoupon !== null}
                      className="coupon-input"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="btn-remove-coupon"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="btn-apply-coupon"
                      >
                        {validatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponError && <div className="coupon-error">{couponError}</div>}
                  {appliedCoupon && (
                    <div className="coupon-success">
                      ✅ Coupon "{appliedCoupon.code}" applied! 
                      {appliedCoupon.discountType === 'percentage' 
                        ? ` ${appliedCoupon.discountValue}% off`
                        : ` $${appliedCoupon.discountValue} off`}
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                {appliedCoupon && (
                  <div className="summary-item">
                    <span className="summary-label">Subtotal:</span>
                    <span className="summary-value">${(selectedProduct.price * quantity).toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="summary-item discount-row">
                    <span className="summary-label">Discount:</span>
                    <span className="summary-value discount-value">
                      -${(() => {
                        const subtotal = selectedProduct.price * quantity;
                        if (appliedCoupon.discountType === 'percentage') {
                          let disc = (subtotal * appliedCoupon.discountValue) / 100;
                          if (appliedCoupon.maxDiscount) {
                            disc = Math.min(disc, appliedCoupon.maxDiscount);
                          }
                          return disc.toFixed(2);
                        }
                        return appliedCoupon.discountValue.toFixed(2);
                      })()}
                    </span>
                  </div>
                )}
                <div className="summary-item total">
                  <span className="summary-label">{appliedCoupon ? 'Final Total:' : 'Total:'}</span>
                  <span className="summary-value total-price">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder} className="order-form">
                <h3>Shipping Address</h3>

                <div className="form-group">
                  <label htmlFor="street">Street Address *</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    required
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      required
                      placeholder="New York"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      required
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zipCode">Zip Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleAddressChange}
                      required
                      placeholder="10001"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      required
                      placeholder="USA"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={closeBuyModal} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-submit">
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
