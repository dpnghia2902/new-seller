import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI, reviewAPI } from '../api/client';
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

  //Popup State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

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

// Fetch reviews
const fetchReviews = async (productId) => {
  try {
    setReviewLoading(true);
    setReviewError('');
    setReviews([]);

    const res = await reviewAPI.getProductReviews(productId, { page: 1, limit: 10, sort: 'recent' });
    const fetchedReviews = res.data.reviews || [];
    console.log('Fetched reviews:', fetchedReviews); // kiểm tra API trả về

    const product = products.find((p) => p._id === productId);
    if (!product) {
      setReviewError('Product not found');
      return;
    }

    setReviewProduct(product);
    setReviews(fetchedReviews);
    setShowReviewModal(true);
  } catch (err) {
    console.error(err);
    setReviewError(err.response?.data?.message || 'Failed to load reviews');
  } finally {
    setReviewLoading(false);
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

                            <button
                              onClick={() => fetchReviews(product._id)}
                              className="btn-edit"
                              title="View Reviews"
                            >
                              Reviews
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

        {/* show Review Modal */}
        {showReviewModal && reviewProduct && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="modal-header review-modal">
                <p >Reviews for {reviewProduct.title}</p>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="modal-close review-modal"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body: Product info */}
              <div className="modal-body product-info-display">
                <div className="product-image-large">
                  <img
                    src={reviewProduct.images?.[0] || 'https://via.placeholder.com/150'}
                    alt={reviewProduct.title}
                  />
                </div>
                <div className="product-details">
                  <h3>{reviewProduct.title}</h3>
                  <p className="product-category">{reviewProduct.category}</p>
                  <p className="product-price">${reviewProduct.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Reviews */}
              <div className="review-list-container">
                {reviewLoading ? (
                  <p>Loading reviews...</p>
                ) : reviewError ? (
                  <p className="error-message">{reviewError}</p>
                ) : reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet.</p>
                ) : (
                  <div className="review-list">
                    {reviews.map((review) => (
                      <div key={review._id} className="review-item">
                        <div className="review-buyer">
                          <strong>{review.buyer?.username || review.buyer?.fullName || 'Anonymous'}</strong>
                          <span>Rating: {review.rating} ⭐</span>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Inventory;
