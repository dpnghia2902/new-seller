import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

    fetchOrders();
  }, [user, isUserSeller, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getMyOrders();
      setOrders(res.data.orders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, { status: newStatus });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const filteredOrders =
    filterStatus === 'all' ? orders : orders.filter((order) => order.status === filterStatus);

  if (loading) {
    return <div className="orders loading">Loading orders...</div>;
  }

  const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  return (
    <AdminLayout>
      <div className="orders">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">
              ✕
            </button>
          </div>
        )}

        <div className="orders-header">
          <div className="filter-section">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="orders-count">
            Total: <span>{filteredOrders.length}</span> orders
          </div>
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <p>No orders found.</p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="order-id">{order._id.slice(-8)}</span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{order.buyer?.fullName || 'Unknown'}</div>
                          <div className="customer-email">{order.buyer?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="products-info">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="product-item">
                              {item.product?.title || 'Unknown Product'} x {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="price-info">
                          {order.coupon ? (
                            <>
                              <div className="original-price">${order.originalPrice?.toFixed(2)}</div>
                              <div className="coupon-badge">
                                {order.coupon.code} (-${order.discount?.toFixed(2)})
                              </div>
                              <div className="final-price">${order.totalPrice?.toFixed(2)}</div>
                            </>
                          ) : (
                            <div className="final-price">${order.totalPrice?.toFixed(2) || '0.00'}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className={`status-select status-${order.status}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/order/${order._id}`)}
                          className="btn-view-detail"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Orders;
