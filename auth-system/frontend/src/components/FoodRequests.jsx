import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/FoodRequests.css';

const FoodRequests = () => {
  const [leftovers, setLeftovers] = useState([]);
  const [loading, setLoading] = useState(true);

  // States handling the forms
  const [activeRequestFoodId, setActiveRequestFoodId] = useState(null);
  const [requestDetails, setRequestDetails] = useState({ ngoName: '', personName: '', phoneNumber: '', pickupTime: '' });
  
  const [activeCollectFoodId, setActiveCollectFoodId] = useState(null);
  const [collectionImage, setCollectionImage] = useState(null);

  const [activeCompleteFoodId, setActiveCompleteFoodId] = useState(null);
  const [deliveryImage, setDeliveryImage] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchLeftovers();
  }, []);

  const fetchLeftovers = async () => {
    try {
      const { data } = await api.get('/leftovers');
      setLeftovers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInput = (e) => {
    setRequestDetails({ ...requestDetails, [e.target.name]: e.target.value });
  };

  const submitRequest = async (food) => {
    setErrorMsg('');
    if (!requestDetails.ngoName || !requestDetails.personName || !requestDetails.phoneNumber || !requestDetails.pickupTime) {
      setErrorMsg('Please fill all request details.');
      return;
    }
    if (requestDetails.pickupTime > food.comfortablePickupTime) {
      setErrorMsg(`Pickup time cannot be later than ${food.comfortablePickupTime}`);
      return;
    }

    try {
      await api.post(`/leftovers/request/${food._id}`, requestDetails);
      setActiveRequestFoodId(null);
      setRequestDetails({ ngoName: '', personName: '', phoneNumber: '', pickupTime: '' });
      fetchLeftovers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error requesting food');
    }
  };

  const submitCollect = async (foodId) => {
    setErrorMsg('');
    if (!collectionImage) {
      setErrorMsg('Please upload proof of collection image.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('collectionImage', collectionImage);

      await api.put(`/leftovers/collect/${foodId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActiveCollectFoodId(null);
      setCollectionImage(null);
      fetchLeftovers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error collecting food');
    }
  };

  const submitComplete = async (foodId) => {
    setErrorMsg('');
    if (!deliveryImage) {
      setErrorMsg('Please upload final proof of delivery/distribution.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('deliveryImage', deliveryImage);

      await api.put(`/leftovers/complete/${foodId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActiveCompleteFoodId(null);
      setDeliveryImage(null);
      fetchLeftovers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error completing delivery');
    }
  };

  const handleGetDirections = (universityName) => {
    if (!universityName) {
      alert('Location not available for this listing');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(universityName)}`;
          window.open(url, '_blank');
        },
        (error) => {
          console.warn("Geolocation Error, asking for manual input:", error);
          const originInput = prompt("Could not fetch GPS location. Please manually enter your starting location:");
          const originParam = originInput ? `&origin=${encodeURIComponent(originInput)}` : '';
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(universityName)}${originParam}`;
          window.open(url, '_blank');
        }
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(universityName)}`;
      window.open(url, '_blank');
    }
  };

  const getBadgeClass = (status) => {
    switch(status) {
      case 'Requested': return 'status-requested';
      case 'Accepted': return 'status-accepted';
      case 'Collected': return 'status-collected';
      case 'Completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  if (loading) return <div>Loading available food...</div>;

  return (
    <div className="food-requests-container">
      {errorMsg && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {leftovers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No leftover food available at the moment.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {leftovers.map(food => (
            <div key={food._id} className="food-card" style={{ display: 'flex', flexDirection: 'column' }}>
              
              {food.foodImage && (
                <img 
                  src={`http://localhost:5000${food.foodImage}`} 
                  alt="Food" 
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px 8px 0 0', margin: '-1.5rem -1.5rem 1rem -1.5rem', width: 'calc(100% + 3rem)' }} 
                />
              )}

              <div className="food-header">
                <h3 className="food-title">{food.itemName}</h3>
                <span className={`food-type-badge type-${food.foodType}`}>
                  {food.foodType}
                </span>
              </div>
              
              <div className="food-details">
                <div className="detail-row">
                  <span>🥡 Quantity: {food.quantity} units</span>
                </div>
                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>🏛️ University: {food.universityName}</span>
                  <button 
                    onClick={() => handleGetDirections(food.universityName)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)',
                      border: 'none', borderRadius: '4px', padding: '0.35rem 0.6rem',
                      fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    🚗 Get Directions
                  </button>
                </div>
                <div className="detail-row">
                  <span>⏰ Pickup Deadline: <strong>{food.comfortablePickupTime}</strong></span>
                </div>
                <div className="detail-row">
                  <span>📅 Date: {new Date(food.date || food.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* ACTION AREA */}
              <div className="food-actions" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                {food.pickupStatus === 'Posted' && activeRequestFoodId !== food._id && (
                   <button 
                     className="action-btn"
                     style={{ background: 'var(--primary)', width: '100%' }}
                     onClick={() => setActiveRequestFoodId(food._id)}
                   >
                     Request Food
                   </button>
                )}

                {/* Request Form */}
                {activeRequestFoodId === food._id && (
                  <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h5 style={{ margin: 0 }}>Request Details</h5>
                    <input type="text" name="ngoName" placeholder="NGO Name" value={requestDetails.ngoName} onChange={handleRequestInput} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    <input type="text" name="personName" placeholder="Collector Name" value={requestDetails.personName} onChange={handleRequestInput} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    <input type="text" name="phoneNumber" placeholder="Phone Number" value={requestDetails.phoneNumber} onChange={handleRequestInput} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    <input type="time" name="pickupTime" value={requestDetails.pickupTime} onChange={handleRequestInput} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => submitRequest(food)} style={{ flex: 1, padding: '0.5rem', background: '#10B981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Submit Request</button>
                      <button onClick={() => setActiveRequestFoodId(null)} style={{ flex: 1, padding: '0.5rem', background: '#64748b', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {food.pickupStatus === 'Requested' && (
                  <div className={`status-badge status-requested`}>
                    Requested (Waiting for Mess Approval)
                  </div>
                )}

                {food.pickupStatus === 'Accepted' && activeCollectFoodId !== food._id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="status-badge status-accepted" style={{ marginBottom: '0.5rem' }}>Request Accepted!</div>
                    <button 
                      className="action-btn"
                      style={{ background: '#10B981', width: '100%' }}
                      onClick={() => setActiveCollectFoodId(food._id)}
                    >
                      Collect Food & Upload Proof
                    </button>
                  </div>
                )}

                {/* Collect Form */}
                {activeCollectFoodId === food._id && (
                  <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h5 style={{ margin: 0 }}>📸 Upload Collection Proof</h5>
                    <input type="file" accept="image/*" onChange={(e) => setCollectionImage(e.target.files[0])} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => submitCollect(food._id)} style={{ flex: 1, padding: '0.5rem', background: '#10B981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Mark Collected</button>
                      <button onClick={() => setActiveCollectFoodId(null)} style={{ flex: 1, padding: '0.5rem', background: '#64748b', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {food.pickupStatus === 'Collected' && activeCompleteFoodId !== food._id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="status-badge status-collected" style={{ marginBottom: '0.5rem' }}>Food Collected Successfully</div>
                    <button 
                      className="action-btn"
                      style={{ background: '#059669', width: '100%' }}
                      onClick={() => setActiveCompleteFoodId(food._id)}
                    >
                      Complete Delivery (Upload Proof)
                    </button>
                  </div>
                )}

                {/* Complete Form */}
                {activeCompleteFoodId === food._id && (
                  <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h5 style={{ margin: 0 }}>📸 Upload Final Delivery Proof</h5>
                    <input type="file" accept="image/*" onChange={(e) => setDeliveryImage(e.target.files[0])} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => submitComplete(food._id)} style={{ flex: 1, padding: '0.5rem', background: '#059669', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Complete Delivery</button>
                      <button onClick={() => setActiveCompleteFoodId(null)} style={{ flex: 1, padding: '0.5rem', background: '#64748b', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {food.pickupStatus === 'Completed' && (
                  <div className="status-badge status-completed" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#059669', border: '1px solid currentColor' }}>
                    🎉 Process Completed
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodRequests;
