import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/SwapMarketplace.css';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/requests/outgoing');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reqId) => {
    try {
      await api.put(`/requests/${reqId}/cancel`);
      alert('Request cancelled successfully.');
      fetchMyRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling request');
    }
  };

  if (loading) return <div>Loading your requests...</div>;

  if (requests.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>You haven't made any requests yet.</p>
      </div>
    );
  }

  return (
    <div className="listings-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>My Requests</h3>
        <button
          className="submit-btn"
          style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
          onClick={fetchMyRequests}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
      {requests.map(req => (
        <div key={req._id} className="listing-card">
          <div className="listing-header">
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{req.itemId ? req.itemId.itemName : 'Item Deleted'}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Type: {req.type} | Request Status: <strong style={{textTransform: 'uppercase'}}>{req.status}</strong>
              </p>
            </div>
            <span className={`exchange-badge badge-${req.type}`} style={{position: 'static'}}>
              {req.type}
            </span>
          </div>

          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
            
            {/* Two-panel: Item + Offering | Owner Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '6px' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Item Requested</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{req.itemId?.itemName || 'Item Deleted'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type: {req.type} | Qty: {req.quantityRequested}</p>
                {req.type === 'swap' && req.offeredItemDetails && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--primary)' }}>
                    <strong>Your offer:</strong> {req.offeredItemDetails}
                  </p>
                )}
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '6px' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owner</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{req.ownerId?.name || 'Unknown'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.ownerId?.email}</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: req.status === 'accepted' ? '#10b981' : 'var(--text-muted)' }}>
                  Status: {req.status}
                </p>
              </div>
            </div>

            {/* Meeting details shown only after acceptance */}
            {req.status === 'accepted' ? (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#10b981' }}>✅ Confirmed Meeting Details</p>
                <p style={{ margin: 0 }}>📍 <strong>Location:</strong> {req.meetingBlock}</p>
                <p style={{ margin: '0.25rem 0' }}>⏰ <strong>Time:</strong> {req.meetingTime}</p>
                {req.type === 'swap' && req.genderPreference && (
                  <p style={{ margin: 0 }}>🚻 <strong>Gender Preference:</strong> {req.genderPreference}</p>
                )}
              </div>
            ) : (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#ef4444' }}>
                  {req.status === 'rejected' ? '❌ Request Rejected by Owner' : '🚫 Request Cancelled'}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  The item is now available again in Swap &amp; Share if quantity was restored.
                </p>
              </div>
            )}

            {req.status === 'pending' && (
              <button
                className="submit-btn"
                style={{ padding: '0.4rem 1.2rem', backgroundColor: 'var(--secondary)', color: 'white', fontSize: '0.875rem' }}
                onClick={() => handleCancel(req._id)}
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
