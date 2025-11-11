import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorLogAPI } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import './ErrorLogs.css';

const ErrorLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    level: '',
    context: '',
    resolved: '',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchErrorLogs();
    fetchStats();
    fetchTimeline();
    // eslint-disable-next-line
  }, [filters]);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      const response = await errorLogAPI.getErrorLogs(filters);
      setLogs(response.data.logs);
      setStats(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await errorLogAPI.getStatsByContext({ days: 7 });
      // Store for display if needed
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await errorLogAPI.getTimeline({ days: 7 });
      setTimeline(response.data.timeline);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleResolve = async (logId) => {
    try {
      await errorLogAPI.resolveErrorLog(logId, { notes: 'Resolved by admin' });
      fetchErrorLogs();
      setSelectedLog(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve error log');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) {
      setError('Please select logs to delete');
      return;
    }
    if (!window.confirm(`Delete ${selectedLogs.length} log(s)?`)) return;

    try {
      await errorLogAPI.deleteErrorLogs(selectedLogs);
      setSelectedLogs([]);
      fetchErrorLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete logs');
    }
  };

  const toggleLogSelection = (logId) => {
    setSelectedLogs((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getLevelBadgeClass = (level) => {
    const classes = {
      error: 'badge-error',
      warn: 'badge-warning',
      info: 'badge-info',
    };
    return classes[level] || 'badge-default';
  };

  if (loading && logs.length === 0) {
    return (
      <AdminLayout>
        <div className="error-logs-page loading">Loading error logs...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="error-logs-page">
        <div className="page-header">
          <h1>Error Logs</h1>
          {selectedLogs.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-delete">
              Delete Selected ({selectedLogs.length})
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="close-btn">
              ✕
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon error-icon">🚨</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalErrors}</div>
                <div className="stat-label">Errors</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning-icon">⚠️</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalWarnings}</div>
                <div className="stat-label">Warnings</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success-icon">✅</div>
              <div className="stat-info">
                <div className="stat-value">{stats.resolved}</div>
                <div className="stat-label">Resolved</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending-icon">⏳</div>
              <div className="stat-info">
                <div className="stat-value">{stats.unresolved}</div>
                <div className="stat-label">Unresolved</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Level:</label>
            <select value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
              <option value="">All</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Context:</label>
            <select value={filters.context} onChange={(e) => handleFilterChange('context', e.target.value)}>
              <option value="">All</option>
              <option value="auth">Auth</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="shop">Shop</option>
              <option value="coupon">Coupon</option>
              <option value="verification">Verification</option>
              <option value="shipping">Shipping</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select value={filters.resolved} onChange={(e) => handleFilterChange('resolved', e.target.value)}>
              <option value="">All</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search message, code, operation..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedLogs.length === logs.length && logs.length > 0}
                    onChange={(e) =>
                      setSelectedLogs(e.target.checked ? logs.map((log) => log._id) : [])
                    }
                  />
                </th>
                <th>Level</th>
                <th>Context</th>
                <th>Message</th>
                <th>Operation</th>
                <th>User</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No error logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className={selectedLogs.includes(log._id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log._id)}
                        onChange={() => toggleLogSelection(log._id)}
                      />
                    </td>
                    <td>
                      <span className={`badge ${getLevelBadgeClass(log.level)}`}>{log.level}</span>
                    </td>
                    <td>
                      <span className="context-badge">{log.context}</span>
                    </td>
                    <td className="message-cell">{log.message}</td>
                    <td className="operation-cell">{log.operation}</td>
                    <td>{log.userId?.username || 'Guest'}</td>
                    <td className="time-cell">{formatDate(log.createdAt)}</td>
                    <td>
                      {log.resolved ? (
                        <span className="status-resolved">✓ Resolved</span>
                      ) : (
                        <span className="status-unresolved">○ Open</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => setSelectedLog(log)} className="btn-view">
                          View
                        </button>
                        {!log.resolved && (
                          <button onClick={() => handleResolve(log._id)} className="btn-resolve">
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="modal-content log-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Error Log Details</h2>
                <button className="modal-close" onClick={() => setSelectedLog(null)}>
                  ✕
                </button>
              </div>

              <div className="log-detail-content">
                <div className="detail-section">
                  <h3>General Information</h3>
                  <div className="detail-row">
                    <span className="label">Level:</span>
                    <span className={`badge ${getLevelBadgeClass(selectedLog.level)}`}>
                      {selectedLog.level}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Context:</span>
                    <span>{selectedLog.context}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Operation:</span>
                    <span>{selectedLog.operation}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Error Code:</span>
                    <span className="code">{selectedLog.errorCode}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span>{formatDate(selectedLog.createdAt)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Message</h3>
                  <div className="message-box">{selectedLog.message}</div>
                </div>

                {selectedLog.stack && (
                  <div className="detail-section">
                    <h3>Stack Trace</h3>
                    <pre className="stack-trace">{selectedLog.stack}</pre>
                  </div>
                )}

                {selectedLog.requestDetails && (
                  <div className="detail-section">
                    <h3>Request Details</h3>
                    <div className="detail-row">
                      <span className="label">Method:</span>
                      <span>{selectedLog.requestDetails.method}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">URL:</span>
                      <span>{selectedLog.requestDetails.url}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">IP:</span>
                      <span>{selectedLog.requestDetails.ip}</span>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  {!selectedLog.resolved && (
                    <button onClick={() => handleResolve(selectedLog._id)} className="btn-resolve">
                      Mark as Resolved
                    </button>
                  )}
                  <button onClick={() => setSelectedLog(null)} className="btn-cancel">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ErrorLogs;
