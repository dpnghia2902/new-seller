import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { complaintsAPI } from '../api/client';
import './ComplaintDetail.css';

function ComplaintDetail() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [c, setC] = useState(null);

  const [actionForm, setActionForm] = useState({
    action: 'refund',
    refundAmount: '',
    refundPercentage: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await complaintsAPI.get(complaintId);
        setC(res.data);
      } catch (e) {
        setError('Failed to load complaint');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [complaintId]);

  const submitAction = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        action: actionForm.action,
        note: actionForm.note || undefined,
      };
      if (actionForm.action === 'refund') {
        if (actionForm.refundAmount) payload.refundAmount = parseFloat(actionForm.refundAmount);
      }
      if (actionForm.action === 'reject' && evidenceFiles.length > 0) {
        const uploadRes = await complaintsAPI.uploadEvidence(complaintId, evidenceFiles);
        const urls = uploadRes.data?.urls || [];
        if (urls.length) payload.sellerEvidenceUrls = urls;
      }
      const res = await complaintsAPI.action(complaintId, payload);
      setC(res.data);
      setSuccess('Decision updated successfully!');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update decision');
    } finally {
      setSaving(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setActionForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <AdminLayout>
      <div className="complaint-detail">
        <div className="detail-header" style={{ marginBottom: 12 }}>
          <button className="btn-cancel" onClick={() => navigate('/complaints')}>
            ← Back to complaints
          </button>
        </div>
        {loading ? (
          <div className="loading">Loading complaint detail...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !c ? (
          <div className="alert">Complaint not found</div>
        ) : (
          <>
            <div className="section">
              <h2>Basic information</h2>
              <div className="grid-2">
                <div className="kv"><div className="k">Complaint ID</div><div className="v">{c._id}</div></div>
                <div className="kv"><div className="k">Created at</div><div className="v">{new Date(c.createdAt).toLocaleString()}</div></div>
                <div className="kv"><div className="k">Order code</div><div className="v">{c.orderCode}</div></div>
                <div className="kv"><div className="k">Status</div><div className="v">{c.status}</div></div>
                <div className="kv"><div className="k">Product</div><div className="v">{c.product?.title || '-'}</div></div>
                <div className="kv"><div className="k">Buyer</div><div className="v">{c.buyer?.fullName || c.buyer?.email}</div></div>
                <div className="kv"><div className="k">Order total</div><div className="v">${c.order?.totalPrice?.toFixed?.(2) || '-'}</div></div>
                <div className="kv"><div className="k">Order status</div><div className="v">{c.order?.status || '-'}</div></div>
              </div>
              {c.order?.items?.length ? (
                <div style={{ marginTop: 12 }}>
                  <div className="k" style={{ marginBottom: 6 }}>Items in order</div>
                  <div className="order-items">
                    {c.order.items.map((it, idx) => {
                      const total = (it.price || 0) * (it.quantity || 0);
                      return (
                        <div key={idx} className="order-item">
                          <div className="order-item-left">
                            <div className="order-item-title">{it.title}</div>
                            <div className="order-item-qty">Quantity: {it.quantity} × ${Number(it.price).toFixed(2)}</div>
                          </div>
                          <div className="order-item-total">${total.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="section">
              <h2>Complaint content</h2>
              <div className="kv"><div className="k">Reason</div><div className="v">{c.title}</div></div>
              <div className="kv"><div className="k">Description</div><div className="v">{c.description || '-'}</div></div>
              <div className="kv"><div className="k">Buyer evidences</div>
                <div className="v evidences">
                  {(c.evidenceImages || []).map((src, i) => (
                    <img key={i} src={src} alt={`evidence-${i}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="section actions">
              <h2>Seller actions</h2>
              {c.sellerEvidence?.length ? (
                <div className="kv">
                  <div className="k">Seller evidences</div>
                  <div className="v evidences">
                    {c.sellerEvidence.map((src, i) =>
                      src.endsWith('.mp4') || src.includes('.mp4') ? (
                        <video key={i} src={src} controls width="240" />
                      ) : (
                        <img key={i} src={src} alt={`seller-evidence-${i}`} />
                      )
                    )}
                  </div>
                </div>
              ) : null}
              {success && <div className="alert alert-success">{success}</div>}
              {c.status !== 'new' ? (
                <div className="kv">
                  <div className="k">Decision</div>
                  <div className="v">
                    {c.resolution?.action || 'Processed'}
                    {c.resolution?.refundAmount ? ` • Refund $${c.resolution.refundAmount}` : ''}
                    {c.resolution?.refundPercentage ? ` • Refund ${c.resolution.refundPercentage}%` : ''}
                    {c.resolution?.note ? ` • Note: ${c.resolution.note}` : ''}
                    <div className="hint">At: {c.resolution?.decidedAt ? new Date(c.resolution.decidedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitAction}>
                  <div className="form-group">
                    <label>Action</label>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className={`action-button ${actionForm.action === 'refund' ? 'active' : ''}`}
                        onClick={() => setActionForm((p) => ({ ...p, action: 'refund' }))}
                      >
                        Propose refund
                      </button>
                      <button
                        type="button"
                        className={`action-button ${actionForm.action === 'replace' ? 'active' : ''}`}
                        onClick={() => setActionForm((p) => ({ ...p, action: 'replace' }))}
                      >
                        Propose replacement
                      </button>
                      <button
                        type="button"
                        className={`action-button ${actionForm.action === 'reject' ? 'active' : ''}`}
                        onClick={() => setActionForm((p) => ({ ...p, action: 'reject' }))}
                      >
                        Reject complaint
                      </button>
                    </div>
                  </div>

                  {actionForm.action === 'refund' && (
                    <div className="form-group">
                      <label>Refund amount ($)</label>
                      <input type="number" name="refundAmount" value={actionForm.refundAmount} onChange={onChange} min="0" step="0.01" />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Note</label>
                    <textarea name="note" rows="2" value={actionForm.note} onChange={onChange} placeholder="Reason, details..." />
                  </div>

                  {actionForm.action === 'reject' && (
                    <div className="form-group">
                      <label>Upload evidences (image/video)</label>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => setEvidenceFiles(e.target.files)}
                      />
                      <div className="hint">You can select multiple files. Files are uploaded before confirming decision.</div>
                    </div>
                  )}

                  <div className="submit-row">
                    <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Confirm decision'}</button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default ComplaintDetail;


