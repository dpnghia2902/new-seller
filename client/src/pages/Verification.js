import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verificationAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './Verification.css';

const Verification = () => {
  const navigate = useNavigate();
  const { user, isUserSeller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVerification, setExistingVerification] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    businessRegistrationNumber: '',
    taxId: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    identityDocument: {
      type: 'national_id',
      number: '',
      frontImage: '',
      backImage: '',
    },
    bankAccount: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      bankCode: '',
      swiftCode: '',
    },
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isUserSeller) {
      navigate('/become-seller');
      return;
    }
    fetchVerificationStatus();
  }, [user, isUserSeller, navigate]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await verificationAPI.getMyVerification();
      setExistingVerification(response.data.verification);
      
      // Pre-fill form if resubmission is needed
      if (response.data.verification) {
        const v = response.data.verification;
        setFormData({
          businessName: v.businessName || '',
          businessType: v.businessType || 'individual',
          businessRegistrationNumber: v.businessRegistrationNumber || '',
          taxId: v.taxId || '',
          businessAddress: v.businessAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
          ownerName: v.ownerName || '',
          ownerEmail: v.ownerEmail || '',
          ownerPhone: v.ownerPhone || '',
          identityDocument: v.identityDocument || {
            type: 'national_id',
            number: '',
            frontImage: '',
            backImage: '',
          },
          bankAccount: v.bankAccount || {
            accountHolderName: '',
            accountNumber: '',
            bankName: '',
            bankCode: '',
            swiftCode: '',
          },
          notes: '',
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setExistingVerification(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch verification status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.businessName || !formData.ownerName || !formData.ownerEmail || !formData.ownerPhone) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.identityDocument.number || !formData.identityDocument.frontImage) {
      setError('Please provide identity document details and front image URL');
      return;
    }

    try {
      setSubmitting(true);
      await verificationAPI.submitVerification(formData);
      setSuccess('Verification request submitted successfully! We will review your application within 2-3 business days.');
      setTimeout(() => {
        fetchVerificationStatus();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="verification-page loading">Loading...</div>
      </AdminLayout>
    );
  }

  // Show status if already submitted
  if (existingVerification && !['rejected', 'resubmit_required'].includes(existingVerification.status)) {
    return (
      <AdminLayout>
        <div className="verification-page">
          <div className="verification-status-card">
            <div className="status-header">
              <h2>Verification Status</h2>
              <span className={`status-badge status-${existingVerification.status}`}>
                {existingVerification.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="status-info">
              <div className="info-row">
                <span className="label">Business Name:</span>
                <span className="value">{existingVerification.businessName}</span>
              </div>
              <div className="info-row">
                <span className="label">Business Type:</span>
                <span className="value">{existingVerification.businessType}</span>
              </div>
              <div className="info-row">
                <span className="label">Submitted:</span>
                <span className="value">{new Date(existingVerification.createdAt).toLocaleDateString()}</span>
              </div>
              {existingVerification.reviewedAt && (
                <div className="info-row">
                  <span className="label">Reviewed:</span>
                  <span className="value">{new Date(existingVerification.reviewedAt).toLocaleDateString()}</span>
                </div>
              )}
              {existingVerification.status === 'approved' && (
                <div className="info-row">
                  <span className="label">Verification Level:</span>
                  <span className="value badge-level">{existingVerification.verificationLevel}</span>
                </div>
              )}
            </div>

            {existingVerification.status === 'pending' && (
              <div className="status-message pending-message">
                <p>🕐 Your verification request is being reviewed. We'll notify you once it's processed.</p>
              </div>
            )}

            {existingVerification.status === 'under_review' && (
              <div className="status-message review-message">
                <p>🔍 Your documents are currently under review by our team.</p>
              </div>
            )}

            {existingVerification.status === 'approved' && (
              <div className="status-message success-message">
                <p>✅ Congratulations! Your seller account is verified. You can now create and sell products.</p>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show rejection message if rejected
  if (existingVerification && existingVerification.status === 'rejected') {
    return (
      <AdminLayout>
        <div className="verification-page">
          <div className="verification-status-card rejected">
            <div className="status-header">
              <h2>Verification Rejected</h2>
              <span className="status-badge status-rejected">REJECTED</span>
            </div>
            <div className="rejection-reason">
              <h3>Reason:</h3>
              <p>{existingVerification.rejectionReason}</p>
            </div>
            <div className="rejection-note">
              <p>❌ Your verification request has been rejected. Please contact support for more information.</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show form for new submission or resubmission
  return (
    <AdminLayout>
      <div className="verification-page">
        <div className="verification-form-container">
          <div className="form-header">
            <h1>Seller Verification</h1>
            <p>Complete this form to verify your seller account and start selling products.</p>
            {existingVerification?.status === 'resubmit_required' && (
              <div className="resubmit-notice">
                <p>⚠️ Please review and resubmit your verification documents.</p>
                <p className="rejection-reason">Reason: {existingVerification.rejectionReason}</p>
              </div>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="verification-form">
            {/* Business Information */}
            <section className="form-section">
              <h3>Business Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Business Type *</label>
                  <select name="businessType" value={formData.businessType} onChange={handleChange} required>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Business Registration Number</label>
                  <input
                    type="text"
                    name="businessRegistrationNumber"
                    value={formData.businessRegistrationNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Tax ID</label>
                  <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} />
                </div>
              </div>
            </section>

            {/* Business Address */}
            <section className="form-section">
              <h3>Business Address</h3>
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="businessAddress.street"
                  value={formData.businessAddress.street}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="businessAddress.city"
                    value={formData.businessAddress.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>State/Province</label>
                  <input
                    type="text"
                    name="businessAddress.state"
                    value={formData.businessAddress.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="businessAddress.zipCode"
                    value={formData.businessAddress.zipCode}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="businessAddress.country"
                    value={formData.businessAddress.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* Owner Information */}
            <section className="form-section">
              <h3>Owner Information</h3>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required />
                </div>
              </div>
            </section>

            {/* Identity Document */}
            <section className="form-section">
              <h3>Identity Document</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Document Type *</label>
                  <select
                    name="identityDocument.type"
                    value={formData.identityDocument.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Document Number *</label>
                  <input
                    type="text"
                    name="identityDocument.number"
                    value={formData.identityDocument.number}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Front Image URL *</label>
                  <input
                    type="text"
                    name="identityDocument.frontImage"
                    value={formData.identityDocument.frontImage}
                    onChange={handleChange}
                    placeholder="https://example.com/id-front.jpg"
                    required
                  />
                  <small>Upload your ID to an image hosting service and paste the URL here</small>
                </div>
                <div className="form-group">
                  <label>Back Image URL</label>
                  <input
                    type="text"
                    name="identityDocument.backImage"
                    value={formData.identityDocument.backImage}
                    onChange={handleChange}
                    placeholder="https://example.com/id-back.jpg"
                  />
                </div>
              </div>
            </section>

            {/* Bank Account */}
            <section className="form-section">
              <h3>Bank Account Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Account Holder Name</label>
                  <input
                    type="text"
                    name="bankAccount.accountHolderName"
                    value={formData.bankAccount.accountHolderName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="bankAccount.accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    name="bankAccount.bankName"
                    value={formData.bankAccount.bankName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Bank Code</label>
                  <input
                    type="text"
                    name="bankAccount.bankCode"
                    value={formData.bankAccount.bankCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* Additional Notes */}
            <section className="form-section">
              <h3>Additional Notes</h3>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Any additional information you'd like to provide..."
                />
              </div>
            </section>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : existingVerification ? 'Resubmit Verification' : 'Submit Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Verification;
