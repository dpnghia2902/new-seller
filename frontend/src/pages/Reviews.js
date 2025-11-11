import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import './Reviews.css';

const API_URL = 'http://localhost:5000/api';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, responded
    const [respondingTo, setRespondingTo] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [stats, setStats] = useState({ total: 0, avgRating: 0, pending: 0 });
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
        fetchReviews();
    }, [user, isUserSeller, navigate]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reviews/seller/my-reviews`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReviews(response.data.reviews);
            calculateStats(response.data.reviews);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (reviewsData) => {
        const total = reviewsData.length;
        const avgRating = total > 0
            ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;
        const pending = reviewsData.filter(r => !r.sellerResponse?.comment).length;

        setStats({ total, avgRating: avgRating.toFixed(1), pending });
    };

    const handleRespond = async (reviewId) => {
        if (!responseText.trim()) {
            alert('Please enter a response');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/reviews/${reviewId}/respond`,
                { comment: responseText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchReviews();
            setRespondingTo(null);
            setResponseText('');
            alert('Response added successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add response');
        }
    };

    const filteredReviews = reviews.filter((review) => {
        if (filter === 'pending') return !review.sellerResponse?.comment;
        if (filter === 'responded') return !!review.sellerResponse?.comment;
        return true;
    });

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="reviews-page loading">Loading reviews...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="reviews-page">
                <div className="reviews-header">
                    <h1>Customer Reviews</h1>
                </div>

                {error && (
                    <div className="error-banner">
                        {error}
                        <button onClick={() => setError('')} className="close-btn">✕</button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="reviews-stats">
                    <div className="stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.avgRating}</div>
                            <div className="stat-label">Average Rating</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💬</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total Reviews</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-label">Pending Response</div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="reviews-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({reviews.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({stats.pending})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'responded' ? 'active' : ''}`}
                        onClick={() => setFilter('responded')}
                    >
                        Responded ({stats.total - stats.pending})
                    </button>
                </div>

                {/* Reviews List */}
                <div className="reviews-list">
                    {filteredReviews.length === 0 ? (
                        <div className="no-reviews">
                            <span>📭</span>
                            <p>No reviews found</p>
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <div key={review._id} className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="reviewer-avatar">
                                            {review.buyer?.fullName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="reviewer-name">
                                                {review.buyer?.fullName || 'Anonymous'}
                                                {review.isVerifiedPurchase && (
                                                    <span className="verified-badge">✓ Verified Purchase</span>
                                                )}
                                            </div>
                                            <div className="review-date">{formatDate(review.createdAt)}</div>
                                        </div>
                                    </div>
                                    <div className="review-rating">{renderStars(review.rating)}</div>
                                </div>

                                <div className="review-product">
                                    <img
                                        src={review.product?.images?.[0] || '/placeholder.png'}
                                        alt={review.product?.title}
                                        className="product-thumb"
                                    />
                                    <span className="product-name">{review.product?.title}</span>
                                </div>

                                <div className="review-comment">{review.comment}</div>

                                {review.images && review.images.length > 0 && (
                                    <div className="review-images">
                                        {review.images.map((img, idx) => (
                                            <img key={idx} src={img} alt={`Review ${idx + 1}`} />
                                        ))}
                                    </div>
                                )}

                                {review.helpfulVotes > 0 && (
                                    <div className="helpful-count">
                                        👍 {review.helpfulVotes} {review.helpfulVotes === 1 ? 'person' : 'people'} found this helpful
                                    </div>
                                )}

                                {/* Seller Response */}
                                {review.sellerResponse?.comment ? (
                                    <div className="seller-response">
                                        <div className="response-header">
                                            <strong>Your Response</strong>
                                            <span className="response-date">
                        {formatDate(review.sellerResponse.respondedAt)}
                      </span>
                                        </div>
                                        <div className="response-text">{review.sellerResponse.comment}</div>
                                    </div>
                                ) : (
                                    <div className="response-section">
                                        {respondingTo === review._id ? (
                                            <div className="response-form">
                        <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response to the customer..."
                            rows="4"
                        />
                                                <div className="response-actions">
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={() => {
                                                            setRespondingTo(null);
                                                            setResponseText('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="btn-submit"
                                                        onClick={() => handleRespond(review._id)}
                                                    >
                                                        Submit Response
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn-respond"
                                                onClick={() => setRespondingTo(review._id)}
                                            >
                                                💬 Respond to Review
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Reviews;