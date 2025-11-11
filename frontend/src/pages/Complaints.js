import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { complaintsAPI, shopAPI } from '../api/client';
import './Complaints.css';

function Complaints() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [shopId, setShopId] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    type: '',
    orderCode: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'processed', label: 'Processed' },
  ];

  const typeOptions = [
    { value: '', label: 'All types' },
    { value: 'damaged_product', label: 'Damaged product' },
    { value: 'wrong_item', label: 'Wrong item' },
    { value: 'missing_item', label: 'Missing item' },
    { value: 'late_delivery', label: 'Late delivery' },
    { value: 'other', label: 'Other' },
  ];

  const canFetch = useMemo(() => !!shopId, [shopId]);
  const navigate = useNavigate();

  useEffect(() => {
    // load my shop id for seller scope
    const loadShop = async () => {
      try {
        const res = await shopAPI.getMyShop();
        // API trả về { success, shop: { id: ..., ... } }
        const id = res.data?.shop?.id || res.data?.shop?._id || res.data?._id || null;
        setShopId(id);
        if (!id) {
          setError('Your shop was not found. Please create a shop first.');
          setLoading(false);
        }
      } catch (e) {
        setShopId(null);
        setError('Failed to load shop info');
        setLoading(false);
      }
    };
    loadShop();
  }, []);

  useEffect(() => {
    if (!canFetch) return;
    fetchComplaints({ ...filters, page: filters.page, limit: filters.limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, filters.page, filters.limit]);

  const fetchComplaints = async (paramsOverride = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...filters,
        ...paramsOverride,
        shop: shopId,
      };
      const res = await complaintsAPI.list(params);
      setData(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
    } catch (e) {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = () => {
    if (!canFetch) return;
    fetchComplaints({ page: 1 });
  };

  const handleReset = () => {
    setFilters({
      status: '',
      type: '',
      orderCode: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const mapStatusLabel = (v) => {
    return v === 'new' ? 'New' : 'Processed';
  };

  const mapTypeLabel = (v) => {
    const map = {
      damaged_product: 'Damaged product',
      wrong_item: 'Wrong item',
      missing_item: 'Missing item',
      late_delivery: 'Late delivery',
      other: 'Other',
    };
    return map[v] || v;
  };

  return (
    <AdminLayout>
      <div className="complaints-page">
        <div className="complaints-header">
          <h1>Complaint management</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filters-row">
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleChange}>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Complaint type</label>
            <select name="type" value={filters.type} onChange={handleChange}>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Order code</label>
            <input
              name="orderCode"
              value={filters.orderCode}
              onChange={handleChange}
              placeholder="e.g., ORD-0001"
            />
          </div>

          <div className="form-group">
            <label>From date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>To date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>&nbsp;</label>
            <div>
              <button className="btn-save" onClick={handleSearch} disabled={!canFetch || loading}>
                Search
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading complaints...</div>
        ) : data.length === 0 ? (
          <div className="no-data">No complaints</div>
        ) : (
          <>
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Order code</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Buyer</th>
                  <th>Created at</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/complaints/${c._id}`);
                        }}
                        style={{ color: '#1677ff', textDecoration: 'underline', cursor: 'pointer' }}
                        title="Xem chi tiết khiếu nại"
                      >
                        {c.orderCode}
                      </a>
                    </td>
                    <td>{c.title}</td>
                    <td><span className="type-tag">{mapTypeLabel(c.type)}</span></td>
                    <td>
                      <span className={`status-badge status-${c.status === 'new' ? 'new' : 'processed'}`}>
                        {mapStatusLabel(c.status)}
                      </span>
                    </td>
                    <td>{c.buyer?.fullName || c.buyer?.email || '-'}</td>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (pagination.page || 1) - 1) }))}
                disabled={(pagination.page || 1) <= 1 || loading}
              >
                ◀ Prev
              </button>
              <span className="page-info">
                Page {pagination.page} / {pagination.pages} • Total {pagination.total}
              </span>
              <button
                onClick={() => setFilters((p) => ({ ...p, page: (pagination.page || 1) + 1 }))}
                disabled={(pagination.page || 1) >= (pagination.pages || 1) || loading}
              >
                Next ▶
              </button>
              <select
                value={filters.limit}
                onChange={(e) => setFilters((p) => ({ ...p, limit: parseInt(e.target.value, 10), page: 1 }))}
                disabled={loading}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}/page</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default Complaints;


