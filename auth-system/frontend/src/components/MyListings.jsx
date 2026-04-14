import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { List, ArrowRightLeft, Heart, CheckCircle2, XCircle, MapPin, Clock, ArrowRight } from 'lucide-react';

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
      if (!meetingBlock) return;
      
      const meetingTime = prompt("Setup Meeting - Enter meeting time:");
      if (!meetingTime) return;
      
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}></div>
        <div>Loading your listings...</div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="clay-card-inset" style={{ textAlign: 'center', padding: '4rem' }}>
        <List size={48} color="var(--clay-border-2)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-secondary)' }}>No Listings Found</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>You haven't posted any items yet. Help the community by sharing!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {listings.map(item => (
        <div key={item._id} className="clay-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--clay-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{item.itemName}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`badge ${item.exchangeType === 'swap' ? 'badge-aqua' : 'badge-orange'}`}>
                  {item.exchangeType === 'swap' ? <><ArrowRightLeft size={12} /> Swap</> : <><Heart size={12} /> Donate</>}
                </span>
                <span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'locked' ? 'badge-orange' : 'badge-red'}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            {item.image && (
              <img 
                src={`http://localhost:5000${item.image}`} 
                alt="Item" 
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }}
              />
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Incoming Requests ({item.requests ? item.requests.length : 0})
            </h4>
            
            {item.requests && item.requests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No requests yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {item.requests && item.requests.map(req => (
                  <div key={req._id} className="clay-card-inset" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                      {req.swapImage && (
                        <img 
                          src={`http://localhost:5000${req.swapImage}`} 
                          alt="Offered Swap" 
                          style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <h5 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.05rem' }}>{req.requesterId?.name || 'Unknown User'}</h5>
                          <span style={{ 
                            fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px',
                            background: req.status === 'accepted' ? 'rgba(16,185,129,0.15)' : req.status === 'rejected' || req.status === 'cancelled' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.1)',
                            color: req.status === 'accepted' ? 'var(--success)' : req.status === 'rejected' || req.status === 'cancelled' ? 'var(--danger)' : 'var(--text-muted)'
                          }}>
                            {req.status === 'rejected' ? 'REJECTED' : req.status === 'cancelled' ? 'CANCELLED' : req.status === 'accepted' ? 'ACCEPTED' : 'PENDING'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{req.requesterId?.email || 'No email'}</p>
                        
                        {req.offeredItemDetails && (
                          <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                            <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <ArrowRight size={14} color="var(--accent)" />
                              <strong>Offering:</strong> {req.offeredItemDetails}
                            </p>
                          </div>
                        )}

                        {req.status === 'accepted' && (req.meetingBlock || req.pickupBlock) && (
                          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> Meeting Confirmed</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <MapPin size={14} /><span style={{ whiteSpace: 'nowrap' }}>{req.meetingBlock || req.pickupBlock}</span>
                              <Clock size={14} /><span style={{ whiteSpace: 'nowrap' }}>{req.meetingTime || req.pickupTime}</span>
                              {item.exchangeType === 'swap' && req.genderPreference && (
                                <><p style={{ margin: 0}}>🚻</p><span>{req.genderPreference} preferred</span></>
                              )}
                            </div>
                          </div>
                        )}

                        {(item.status === 'active' || item.status === 'locked') && req.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => handleApprove(item, req._id)}
                            >
                              <CheckCircle2 size={16} /> Accept Offer
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => handleReject(req._id)}
                            >
                              <XCircle size={16} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyListings;
