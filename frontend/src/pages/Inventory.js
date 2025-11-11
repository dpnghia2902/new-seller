import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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

    fetchProducts();
  }, [user, isUserSeller, navigate]);

  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') {
        filtered = filtered.filter((product) => product.stock > 0 && product.isActive);
      } else if (statusFilter === 'hidden') {
        filtered = filtered.filter((product) => !product.isActive || product.stock === 0);
      }
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getMyProducts();
      setProducts(res.data.products);
      setFilteredProducts(res.data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStock = (product) => {
    setEditingProduct(product);
    setStockValue(product.stock.toString());
    setShowEditModal(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();

    const newStock = parseInt(stockValue);
    if (isNaN(newStock) || newStock < 0) {
      setError('Please enter a valid stock number');
      return;
    }

    try {
      await productAPI.updateProduct(editingProduct._id, {
        stock: newStock,
      });

      setShowEditModal(false);
      setEditingProduct(null);
      setStockValue('');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <AdminLayout>
        <div className="inventory-page loading">Loading inventory...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <h1>Seller management</h1>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">
              ✕
            </button>
          </div>
        )}

        <div className="inventory-section">
          <h2>Inventory</h2>

          <div className="inventory-controls">
            <input
              type="text"
              placeholder="Search orders"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">Status</option>
              <option value="available">Available</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No products found
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => {
                    return (
                      <tr key={product._id}>
                        <td>
                          <div className="product-title-cell">
                            <div className="product-image">
                              <img
                                src={product.images?.[0] || 'https://via.placeholder.com/60'}
                                alt={product.title}
                              />
                            </div>
                            <span>{product.title}</span>
                          </div>
                        </td>
                        <td className="price-cell">${product.price.toFixed(0)}</td>
                        <td className="stock-cell">
                          <span className={product.stock > 0 ? 'stock-available' : 'stock-out'}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="description-cell">{product.description}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEditStock(product)}
                              className="btn-edit"
                              title="Edit Stock"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                «
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                ‹
              </button>

              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                ›
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                »
              </button>
            </div>
          )}
        </div>

        {/* Edit Stock Modal */}
        {showEditModal && editingProduct && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Update Stock</h2>
                <button onClick={() => setShowEditModal(false)} className="modal-close">
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdateStock} className="stock-form">
                <div className="product-info-display">
                  <div className="product-image-large">
                    <img
                      src={editingProduct.images?.[0] || 'https://via.placeholder.com/150'}
                      alt={editingProduct.title}
                    />
                  </div>
                  <div className="product-details">
                    <h3>{editingProduct.title}</h3>
                    <p className="product-category">{editingProduct.category}</p>
                    <p className="product-price">${editingProduct.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="stock-info">
                  <div className="current-stock">
                    <label>Current Stock:</label>
                    <span className="stock-value">{editingProduct.stock} units</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newStock">New Stock Quantity *</label>
                    <input
                      type="number"
                      id="newStock"
                      value={stockValue}
                      onChange={(e) => setStockValue(e.target.value)}
                      required
                      min="0"
                      placeholder="Enter new stock quantity"
                      autoFocus
                    />
                    <p className="helper-text">
                      {stockValue && !isNaN(parseInt(stockValue))
                        ? parseInt(stockValue) > editingProduct.stock
                          ? `+${parseInt(stockValue) - editingProduct.stock} units (Increase)`
                          : parseInt(stockValue) < editingProduct.stock
                          ? `${parseInt(stockValue) - editingProduct.stock} units (Decrease)`
                          : 'No change'
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Update Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Inventory;
