import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowRightLeft, Heart, Search, BellRing, Navigation, Clock, MapPin } from 'lucide-react';

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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}></div>
        <div>Loading your requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="clay-card-inset" style={{ textAlign: 'center', padding: '4rem' }}>
        <BellRing size={48} color="var(--clay-border-2)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-secondary)' }}>No Outgoing Requests</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>You haven't requested any items yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="clay-card-inset" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>My Requests</h3>
        <button className="btn btn-ghost btn-sm" onClick={fetchMyRequests} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {requests.map(req => (
          <div key={req._id} className="clay-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--clay-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{req.itemId ? req.itemId.itemName : 'Item Deleted'}</h3>
                <span className={`badge ${req.type === 'swap' ? 'badge-aqua' : 'badge-orange'}`}>
                  {req.type === 'swap' ? <><ArrowRightLeft size={12} /> Swap</> : <><Heart size={12} /> Donate</>}
                </span>
                <span className={`badge ${req.status === 'accepted' ? 'badge-green' : req.status === 'rejected' || req.status === 'cancelled' ? 'badge-red' : 'badge-orange'}`} style={{ marginLeft: '0.5rem' }}>
                  {req.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Item Owner</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{req.ownerId?.name || 'Unknown'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{req.ownerId?.email}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Qty Requested</p>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{req.quantityRequested}</p>
                  </div>
                </div>
              </div>

              {req.type === 'swap' && req.offeredItemDetails && (
                <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase' }}>Your Offer</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{req.offeredItemDetails}</p>
                </div>
              )}

              {req.status === 'accepted' ? (
                <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--success)' }}>✅ Meeting Confirmed</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '0.5rem 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} /><span style={{ whiteSpace: 'nowrap' }}>{req.meetingBlock}</span>
                    <Clock size={14} /><span style={{ whiteSpace: 'nowrap' }}>{req.meetingTime}</span>
                    {req.type === 'swap' && req.genderPreference && (
                      <><Navigation size={14} /><span>{req.genderPreference} preferred</span></>
                    )}
                  </div>
                </div>
              ) : req.status === 'rejected' || req.status === 'cancelled' ? (
                <div className="alert alert-error">
                  <p style={{ margin: 0, fontWeight: 600 }}>{req.status === 'rejected' ? 'Request Rejected' : 'Request Cancelled'}</p>
                </div>
              ) : null}
            </div>

            {req.status === 'pending' && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: '1.5rem', color: 'var(--danger)' }}
                onClick={() => handleCancel(req._id)}
              >
                Cancel Request
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRequests;
