import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI, productAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './Dashboard.css';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, monthlyIncome: 0, monthlyOrders: 0 });
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();
  const { user, isUserSeller } = useAuth();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isUserSeller) { navigate('/become-seller'); return; }
    fetchDashboardData();
  }, [user, isUserSeller, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([orderAPI.getMyOrders(), productAPI.getMyProducts()]);
      const allOrders = ordersRes.data.orders;
      const allProducts = productsRes.data.products;
      setOrders(allOrders);
      setProducts(allProducts);
      calculateStats(allOrders);
      generateChartData(allOrders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const deliveredOrders = orders.filter((order) => order.status === 'delivered');
    const totalSales = deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    const monthlyDelivered = monthlyOrders.filter((order) => order.status === 'delivered');
    const monthlyIncome = monthlyDelivered.reduce((sum, order) => sum + order.totalPrice, 0);
    setStats({ totalSales, totalOrders: deliveredOrders.length, monthlyIncome, monthlyOrders: monthlyOrders.length });
  };

  const generateChartData = (orders) => {
    const deliveredOrders = orders.filter((order) => order.status === 'delivered');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthsData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthOrders = deliveredOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
      });
      const revenue = monthOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      monthsData.push({ month: monthNames[month], revenue });
    }
    setChartData(monthsData);
  };

  const getTopSellingProducts = () => {
    const productSales = {};
    orders.filter((order) => order.status === 'delivered').forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product?._id || item.product;
        if (productId) {
          if (!productSales[productId]) { productSales[productId] = { product: item, sold: 0 }; }
          productSales[productId].sold += item.quantity;
        }
      });
    });
    return Object.values(productSales).sort((a, b) => b.sold - a.sold).slice(0, 3);
  };

  const getMaxRevenue = () => {
    if (chartData.length === 0) return 1500;
    const max = Math.max(...chartData.map((d) => d.revenue));
    return Math.ceil(max / 500) * 500 || 1500;
  };

  if (loading) { return <AdminLayout><div className="dashboard-page loading">Loading dashboard...</div></AdminLayout>; }

  const topProducts = getTopSellingProducts();
  const maxRevenue = getMaxRevenue();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <AdminLayout>
      <div className="dashboard-page">
        <div className="dashboard-header"><h1>Seller management</h1></div>
        {error && <div className="error-banner">{error}<button onClick={() => setError('')} className="close-btn"></button></div>}
        <div className="dashboard-content">
          <div className="sales-chart-section">
            <div className="chart-header">
              <div><h3>Overall Sales</h3><div className="sales-amount">${stats.totalSales.toLocaleString()}</div></div>
              <div className="info-icon"></div>
            </div>
            <div className="chart-container">
              <div className="chart-y-axis">{[maxRevenue, maxRevenue * 0.75, maxRevenue * 0.5, maxRevenue * 0.25, 0].map((value, index) => <div key={index} className="y-axis-label">{value.toFixed(0)}</div>)}</div>
              <div className="chart-area">
                <svg viewBox="0 0 600 300" className="line-chart">
                  {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="0" y1={i * 75} x2="600" y2={i * 75} stroke="#e5e7eb" strokeWidth="1" />)}
                  {chartData.length > 0 && <>
                    <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={chartData.map((data, index) => { const x = (index / (chartData.length - 1)) * 600; const y = 300 - (data.revenue / maxRevenue) * 300; return `${x},${y}`; }).join(' ')} />
                    {chartData.map((data, index) => { const x = (index / (chartData.length - 1)) * 600; const y = 300 - (data.revenue / maxRevenue) * 300; return <circle key={index} cx={x} cy={y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />; })}
                  </>}
                </svg>
                <div className="chart-x-axis">{chartData.map((data, index) => <div key={index} className="x-axis-label">{data.month}</div>)}</div>
              </div>
            </div>
          </div>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-label">Total Sales</div>
                <div className="stat-value">{stats.monthlyOrders} sales</div>
                <div className="stat-period">in {currentMonth}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-label">Income</div>
                <div className="stat-value">${stats.monthlyIncome.toLocaleString()}</div>
                <div className="stat-period">in {currentMonth}</div>
              </div>
            </div>
          </div>
          <div className="top-products-section">
            <h2>Top selling Products</h2>
            {topProducts.length === 0 ? <div className="no-data">No sales data available yet</div> :
              <table className="products-table">
                <thead><tr><th>Product name</th><th>Price</th><th>Sold</th><th>Status</th></tr></thead>
                <tbody>
                  {topProducts.map((item, index) => {
                    const product = products.find((p) => p._id === (item.product.product?._id || item.product.product));
                    const isInStock = product ? product.stock > 0 : false;
                    return (
                      <tr key={index}>
                        <td><div className="product-cell">{item.product.product?.images?.[0] && <img src={item.product.product.images[0]} alt={item.product.title} className="product-thumbnail" />}<div className="product-info"><div className="product-name">{item.product.title}</div></div></div></td>
                        <td className="price-cell">${item.product.price.toFixed(2)}</td>
                        <td className="sold-cell">{item.sold}</td>
                        <td><span className={`status-badge ${isInStock ? 'in-stock' : 'out-stock'}`}>{isInStock ? ' In stock' : ' Out of stock'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
