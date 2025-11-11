import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onBuyClick }) => {
  const discountedPrice = product.originalPrice
    ? (product.originalPrice * (1 - product.discount / 100)).toFixed(2)
    : product.price;

  const handleBuyClick = (e) => {
    e.preventDefault();
    if (onBuyClick) {
      onBuyClick(product);
    }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-card-link">
        <div className="product-image">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.title} />
          ) : (
            <div className="no-image">No Image</div>
          )}
          {product.discount > 0 && <span className="discount-badge">{product.discount}%</span>}
        </div>

        <div className="product-info">
          <h3 className="product-title">{product.title}</h3>

          <div className="product-shop">
            <span>🏪 {product.shop?.shopName}</span>
          </div>

          <div className="product-price">
            <span className="current-price">${discountedPrice}</span>
            {product.originalPrice && (
              <span className="original-price">${product.originalPrice}</span>
            )}
          </div>

          <div className="product-meta">
            <span className="rating">⭐ {product.rating || 0}</span>
            <span className="sold">Sold: {product.sold}</span>
          </div>

          <div className="product-stock">
            {product.stock > 0 ? (
              <span className="in-stock">In Stock</span>
            ) : (
              <span className="out-stock">Out of Stock</span>
            )}
          </div>
        </div>
      </Link>

      {onBuyClick && (
        <button
          className="btn-buy"
          onClick={handleBuyClick}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
        </button>
      )}
    </div>
  );
};

export default ProductCard;
