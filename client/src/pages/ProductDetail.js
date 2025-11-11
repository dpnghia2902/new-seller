import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI } from '../api/client';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProduct(productId);
      setProduct(response.data.product);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="product-detail loading">Loading product...</div>;
  }

  if (error || !product) {
    return <div className="product-detail error">{error || 'Product not found'}</div>;
  }

  const discountedPrice = product.originalPrice
    ? (product.originalPrice * (1 - product.discount / 100)).toFixed(2)
    : product.price;

  return (
    <div className="product-detail">
      <div className="product-container">
        <div className="product-gallery">
          <div className="main-image">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[selectedImage]} alt={product.title} />
            ) : (
              <div className="no-image">No Image Available</div>
            )}
            {product.discount > 0 && (
              <span className="discount-badge">{product.discount}% OFF</span>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="thumbnails">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.title} ${index + 1}`}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1>{product.title}</h1>

          <div className="product-rating">
            <span className="stars">⭐ {product.rating || 0}/5</span>
            <span className="reviews">({product.reviews?.length || 0} reviews)</span>
          </div>

          <div className="seller-info">
            <Link to={`/shop/${product.shop._id}`} className="seller-link">
              <span>🏪 {product.shop.shopName}</span>
            </Link>
          </div>

          <div className="price-section">
            <div className="price">
              <span className="current-price">${discountedPrice}</span>
              {product.originalPrice && (
                <span className="original-price">${product.originalPrice}</span>
              )}
            </div>
          </div>

          <div className="product-stats">
            <div className="stat">
              <span className="label">Sold</span>
              <span className="value">{product.sold} items</span>
            </div>
            <div className="stat">
              <span className="label">Stock</span>
              <span className="value">{product.stock} available</span>
            </div>
            <div className="stat">
              <span className="label">Category</span>
              <span className="value">{product.category}</span>
            </div>
          </div>

          <div className="quantity-section">
            <label>Quantity:</label>
            <div className="quantity-control">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <input type="number" value={quantity} readOnly />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn-cart"
              disabled={product.stock === 0}
            >
              🛒 Add to Cart
            </button>
            <button className="btn-buy" disabled={product.stock === 0}>
              💳 Buy Now
            </button>
          </div>

          {product.stock === 0 && (
            <div className="out-of-stock-message">
              This product is currently out of stock
            </div>
          )}
        </div>
      </div>

      <div className="product-description">
        <h2>Product Description</h2>
        <p>{product.description}</p>
      </div>

      {product.reviews && product.reviews.length > 0 && (
        <div className="product-reviews">
          <h2>Customer Reviews</h2>
          <div className="reviews-list">
            {product.reviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">
                    {review.user?.username || 'Anonymous'}
                  </span>
                  <span className="review-rating">⭐ {review.rating}/5</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
