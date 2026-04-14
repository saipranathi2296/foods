import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/SwapMarketplace.css';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const itemsRes = await api.get('/items/my-listings');
      const items = itemsRes.data;

      // Try to load incoming requests separately — don't let it block item display
      let incomingRequests = [];
      try {
        const requestsRes = await api.get('/requests/incoming');
        incomingRequests = requestsRes.data;
      } catch (reqErr) {
        console.warn('Could not load incoming requests:', reqErr.message);
      }

      const itemsWithRequests = items.map(item => {
        const itemRequests = incomingRequests.filter(req =>
          req.itemId && (req.itemId._id || req.itemId).toString() === item._id.toString()
        );
        return { ...item, requests: itemRequests || [] };
      });

      setListings(itemsWithRequests);
    } catch (err) {
      console.error('My Listings fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item, reqId) => {
    try {
      const meetingBlock = prompt("Setup Meeting - Enter meeting location/block details:");
      if (!meetingBlock) return; // Cancelled prompt
      
      const meetingTime = prompt("Setup Meeting - Enter meeting time:");
      if (!meetingTime) return; // Cancelled prompt
      
      let payload = { meetingBlock, meetingTime };
      
      if (item.exchangeType === 'swap') {
        const genderPreference = prompt("Setup Meeting - Enter gender preference (all/male/female):", "all");
        payload.genderPreference = genderPreference;
      }

      await api.put(`/requests/${reqId}/accept`, payload);
      alert('Request accepted successfully!');
      fetchMyListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving request');
    }
  };

  const handleReject = async (reqId) => {
    try {
      await api.put(`/requests/${reqId}/reject`);
      alert('Request rejected.');
      fetchMyListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting request');
    }
  };

  if (loading) return <div>Loading your listings...</div>;

  if (listings.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>You haven't posted any items yet.</p>
      </div>
    );
  }

  return (
    <div className="listings-container">
      {listings.map(item => (
        <div key={item._id} className="listing-card">
          <div className="listing-header">
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.itemName}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Type: {item.exchangeType} | Status: <strong style={{textTransform: 'uppercase'}}>{item.status}</strong>
              </p>
            </div>
            <span className={`exchange-badge badge-${item.exchangeType}`} style={{position: 'static'}}>
              {item.exchangeType}
            </span>
          </div>

          <div className="requests-section">
            <h4>Requests ({item.requests ? item.requests.length : 0})</h4>
            
            {item.requests && item.requests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No requests yet.</p>
            ) : (
              item.requests && item.requests.map(req => (
                <div key={req._id} className="request-card">
                  <div className="requester-info">
                    {req.swapImage && (
                      <img 
                        src={`http://localhost:5000${req.swapImage}`} 
                        alt="Offered Swap" 
                        className="swap-image-preview"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/80' }}
                      />
                    )}
                    <div className="requester-details" style={{ flex: 1 }}>
                      <h5 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>Request From: {req.requesterId?.name || 'Unknown User'} (To: You)</h5>
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>{req.requesterId?.email || 'No email provided'}</p>
                      
                      {req.offeredItemDetails && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '4px' }}>
                          <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text)' }}>
                            <strong>Offering:</strong> {req.offeredItemDetails}
                          </p>
                        </div>
                      )}
                      
                      {req.pickupTime && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '4px' }}>
                          <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text)' }}>
                            <strong>Pickup Request:</strong> {req.pickupBlock} at {req.pickupTime}
                          </p>
                        </div>
                      )}

                      {req.status === 'accepted' && (req.meetingBlock || req.pickupBlock) && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px' }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#10b981' }}>✅ Confirmed Meeting Details:</p>
                          <p style={{ margin: 0, fontSize: '0.875rem' }}>📍 {req.meetingBlock || req.pickupBlock} | ⏰ {req.meetingTime || req.pickupTime}</p>
                          {item.exchangeType === 'swap' && req.genderPreference && (
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>🚻 {req.genderPreference} preferred</p>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>
                          Qty: {req.quantityRequested} | Date: {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        <p style={{ 
                          fontSize: '0.75rem', margin: 0, fontWeight: 600, textTransform: 'uppercase',
                          color: req.status === 'accepted' ? '#10b981' : req.status === 'rejected' || req.status === 'cancelled' ? '#ef4444' : 'var(--text-muted)'
                        }}>
                          {req.status === 'rejected' ? '❌ Rejected' : req.status === 'cancelled' ? '🚫 Cancelled' : req.status === 'accepted' ? '✅ Accepted' : `⏳ ${req.status}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {(item.status === 'active' || item.status === 'locked' || item.status === 'unavailable') && req.status === 'accepted' && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '2px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>✅ Request Accepted — Full Summary</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '6px' }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Item</p>
                          <p style={{ margin: 0, fontWeight: 500 }}>{item.itemName}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type: {item.exchangeType} | Qty: {req.quantityRequested}</p>
                          {item.returnItemDetails && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--primary)' }}>Wanted: {item.returnItemDetails}</p>}
                        </div>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '6px' }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Requester</p>
                          <p style={{ margin: 0, fontWeight: 500 }}>{req.requesterId?.name || 'Unknown'}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.requesterId?.email}</p>
                          {req.offeredItemDetails && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--primary)' }}>Offering: {req.offeredItemDetails}</p>}
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem', background: 'var(--bg-dark)', borderRadius: '6px' }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meeting Details (set by you)</p>
                        <p style={{ margin: 0 }}>📍 {req.meetingBlock} &nbsp; ⏰ {req.meetingTime}</p>
                        {req.genderPreference && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>🚻 {req.genderPreference} preferred</p>}
                      </div>
                    </div>
                  )}
                  {(item.status === 'active' || item.status === 'locked') && req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="submit-btn" 
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--primary)' }}
                        onClick={() => handleApprove(item, req._id)}
                      >
                        Accept
                      </button>
                      <button 
                        className="submit-btn" 
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--secondary)', color: 'white' }}
                        onClick={() => handleReject(req._id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyListings;
