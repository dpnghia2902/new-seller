import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI, shippingAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './OrderDetail.css';

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showShippingLabel, setShowShippingLabel] = useState(false);
  const [shippingLabel, setShippingLabel] = useState(null);
  const [loadingLabel, setLoadingLabel] = useState(false);

  const { orderId } = useParams();
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

    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getOrder(orderId);
      setOrder(res.data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await orderAPI.updateOrderStatus(orderId, { status: newStatus });
      fetchOrderDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrintShippingLabel = async () => {
    try {
      setLoadingLabel(true);
      const response = await shippingAPI.getShippingLabel(orderId);
      setShippingLabel(response.data.label);
      setShowShippingLabel(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shipping label');
    } finally {
      setLoadingLabel(false);
    }
  };

  const handlePrintLabel = () => {
    const token = localStorage.getItem('token');
    const printUrl = shippingAPI.printShippingLabel(orderId);
    window.open(`${printUrl}?token=${token}`, '_blank');
  };

  const getEstimatedDeliveryDate = (order) => {
    if (!order) return null;

    const orderDate = new Date(order.createdAt);
    let daysToAdd = 0;

    switch (order.status) {
      case 'pending':
        daysToAdd = 7;
        break;
      case 'confirmed':
        daysToAdd = 5;
        break;
      case 'shipped':
        daysToAdd = 3;
        break;
      case 'delivered':
        return new Date(order.updatedAt);
      case 'cancelled':
        return null;
      default:
        daysToAdd = 7;
    }

    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    return estimatedDate;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      shipped: '#007bff',
      delivered: '#28a745',
      cancelled: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="order-detail-page loading">Loading order details...</div>
      </AdminLayout>
    );
  }

  if (error && !order) {
    return (
      <AdminLayout>
        <div className="order-detail-page">
          <div className="error-message">
            {error}
            <button onClick={() => navigate('/orders')} className="btn-back">
              Back to Orders
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const estimatedDate = getEstimatedDeliveryDate(order);

  return (
    <AdminLayout>
      <div className="order-detail-page">
        <div className="page-header">
          <button onClick={() => navigate('/orders')} className="btn-back">
            ← Back to Orders
          </button>
          <h1>Order Details</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowInvoice(true)} className="btn-invoice">
              📄 View Invoice
            </button>
            <button 
              onClick={handlePrintShippingLabel} 
              className="btn-invoice"
              disabled={loadingLabel}
            >
              {loadingLabel ? '⏳ Loading...' : '📦 Shipping Label'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError('')} className="close-btn">
              ✕
            </button>
          </div>
        )}

        <div className="order-content">
          {/* Order Info Card */}
          <div className="info-card">
            <div className="card-header">
              <h2>Order Information</h2>
              <span className="order-id">#{order._id.slice(-8)}</span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Order Date:</span>
                <span className="value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="status-select"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                  disabled={updatingStatus}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="info-row">
                <span className="label">
                  {order.status === 'delivered' ? 'Delivered Date:' : 'Est. Delivery:'}
                </span>
                <span className="value">
                  {order.status === 'cancelled' ? 'Cancelled' : formatDate(estimatedDate)}
                </span>
              </div>
              {order.coupon && (
                <>
                  <div className="info-row">
                    <span className="label">Original Price:</span>
                    <span className="value original-price">${order.originalPrice?.toFixed(2)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Coupon Applied:</span>
                    <span className="value coupon-info">
                      <span className="coupon-code">{order.coupon.code}</span>
                      <span className="coupon-discount">
                        {order.coupon.discountType === 'percentage' 
                          ? `${order.coupon.discountValue}% OFF` 
                          : `$${order.coupon.discountValue} OFF`}
                      </span>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Discount Amount:</span>
                    <span className="value discount-amount">-${order.discount?.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="info-row">
                <span className="label">Total Price:</span>
                <span className="value price">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="info-card">
            <div className="card-header">
              <h2>Customer Information</h2>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{order.buyer?.fullName || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{order.buyer?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{order.buyer?.phone || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="label">Username:</span>
                <span className="value">@{order.buyer?.username || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="info-card">
            <div className="card-header">
              <h2>Shipping Address</h2>
            </div>
            <div className="card-body">
              {order.shippingAddress ? (
                <>
                  <div className="address-line">{order.shippingAddress.street}</div>
                  <div className="address-line">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </div>
                  <div className="address-line">{order.shippingAddress.country}</div>
                </>
              ) : (
                <p className="no-data">No shipping address provided</p>
              )}
            </div>
          </div>

          {/* Order Items Card */}
          <div className="info-card items-card">
            <div className="card-header">
              <h2>Order Items</h2>
              <span className="items-count">{order.items?.length || 0} item(s)</span>
            </div>
            <div className="card-body">
              <div className="items-list">
                {order.items?.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <div className="item-title">{item.title || item.product?.title}</div>
                      <div className="item-meta">
                        Quantity: {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="item-total">${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="items-total">
                <span className="total-label">Total:</span>
                <span className="total-value">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {order.notes && (
            <div className="info-card">
              <div className="card-header">
                <h2>Order Notes</h2>
              </div>
              <div className="card-body">
                <p className="notes-text">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Modal */}
        {showInvoice && (
          <div className="invoice-modal-overlay" onClick={() => setShowInvoice(false)}>
            <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="invoice-header">
                <h2>INVOICE</h2>
                <button className="btn-close-invoice" onClick={() => setShowInvoice(false)}>
                  ✕
                </button>
              </div>

              <div className="invoice-content">
                <div className="invoice-section">
                  <div className="invoice-row">
                    <div className="invoice-col">
                      <h3>From:</h3>
                      <p><strong>{order.shop?.shopName}</strong></p>
                      <p>Seller Shop</p>
                    </div>
                    <div className="invoice-col">
                      <h3>To:</h3>
                      <p><strong>{order.buyer?.fullName}</strong></p>
                      <p>{order.buyer?.email}</p>
                      <p>{order.buyer?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="invoice-section">
                  <h3>Invoice Details</h3>
                  <div className="invoice-detail-row">
                    <span>Invoice No:</span>
                    <span><strong>#{order._id.slice(-8).toUpperCase()}</strong></span>
                  </div>
                  <div className="invoice-detail-row">
                    <span>Order Date:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="invoice-detail-row">
                    <span>Status:</span>
                    <span className={`invoice-status status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="invoice-section">
                  <h3>Shipping Address</h3>
                  <p>{order.shippingAddress?.street}</p>
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                    {order.shippingAddress?.zipCode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                </div>

                <div className="invoice-section">
                  <h3>Order Items</h3>
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.title || item.product?.title}</td>
                          <td>{item.quantity}</td>
                          <td>${item.price.toFixed(2)}</td>
                          <td>${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="invoice-section invoice-summary">
                  {order.coupon && (
                    <>
                      <div className="invoice-detail-row">
                        <span>Subtotal:</span>
                        <span>${order.originalPrice?.toFixed(2)}</span>
                      </div>
                      <div className="invoice-detail-row coupon-row">
                        <span>
                          Discount ({order.coupon.code}):
                        </span>
                        <span className="discount-text">-${order.discount?.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="invoice-detail-row invoice-total">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong>${order.totalPrice.toFixed(2)}</strong></span>
                  </div>
                </div>

                <div className="invoice-footer">
                  <p>Thank you for your order!</p>
                  <button className="btn-print" onClick={() => window.print()}>
                    🖨️ Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Label Modal */}
        {showShippingLabel && shippingLabel && (
          <div className="invoice-modal-overlay" onClick={() => setShowShippingLabel(false)}>
            <div className="invoice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h2>📦 Shipping Label</h2>
                <button onClick={() => setShowShippingLabel(false)} className="close-modal-btn">
                  ✕
                </button>
              </div>
              <div className="shipping-label-content" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>Tracking Number</h3>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', margin: '10px 0' }}>
                    {shippingLabel.trackingNumber}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ padding: '15px', border: '2px solid #007bff', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#007bff' }}>📤 From (Seller)</h4>
                    <p style={{ margin: '5px 0' }}><strong>{shippingLabel?.shop?.name || 'N/A'}</strong></p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>{shippingLabel?.shop?.address || 'N/A'}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>{shippingLabel?.shop?.phone || 'N/A'}</p>
                  </div>

                  <div style={{ padding: '15px', border: '2px solid #28a745', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#28a745' }}>📥 To (Buyer)</h4>
                    <p style={{ margin: '5px 0' }}><strong>{shippingLabel?.buyer?.name || 'N/A'}</strong></p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      {shippingLabel?.buyer?.street || 'N/A'}, {shippingLabel?.buyer?.city || 'N/A'}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      {shippingLabel?.buyer?.state || 'N/A'} {shippingLabel?.buyer?.zipCode || 'N/A'}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>{shippingLabel?.buyer?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4>📦 Items</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Product</th>
                        <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>Quantity</th>
                        <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippingLabel?.items?.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{item.name}</td>
                          <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #dee2e6' }}>{item.quantity}</td>
                          <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dee2e6' }}>${item.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '2px dashed #ccc' }}>
                  <button 
                    onClick={handlePrintLabel} 
                    className="btn-print"
                    style={{
                      padding: '12px 30px',
                      fontSize: '16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Print Label
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrderDetail;
