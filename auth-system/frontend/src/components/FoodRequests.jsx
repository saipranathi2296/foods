import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Camera, Navigation, MessageCircle, MapPin, CheckCircle2, Clock } from 'lucide-react';

const FoodRequests = () => {
  const [leftovers, setLeftovers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getBadgeCol = (status) => {
    switch(status) {
      case 'Posted': return 'badge-aqua';
      case 'Requested': return 'badge-orange';
      case 'Accepted': return 'badge-purple';
      case 'Collected': return 'badge-green';
      case 'Completed': return 'badge-green';
      default: return 'badge-aqua';
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div className="spinner" style={{ marginBottom: '1rem' }}></div>
      <div>Loading available food...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

      {leftovers.length === 0 ? (
        <div className="clay-card-inset" style={{ textAlign: 'center', padding: '4rem' }}>
          <MessageCircle size={48} color="var(--clay-border-2)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No Food Available</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>There are no active leftover food postings.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {leftovers.map(food => (
            <div key={food._id} className="clay-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              <div style={{ position: 'relative', height: '200px' }}>
                {food.foodImage ? (
                  <img src={`http://localhost:5000${food.foodImage}`} alt="Food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--clay-inset)' }}></div>
                )}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <span className={`badge ${getBadgeCol(food.pickupStatus)}`} style={{ backdropFilter: 'blur(10px)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    {food.pickupStatus}
                  </span>
                </div>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: 'var(--text-primary)' }}>{food.itemName}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      Quantity: {food.quantity}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: food.foodType==='veg' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: food.foodType==='veg' ? 'var(--success)' : 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                      {food.foodType}
                    </span>
                  </div>
                </div>
                
                <div style={{ background: 'var(--clay-inset)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{food.universityName}</div>
                      <button onClick={() => handleGetDirections(food.universityName)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem', fontWeight: 600 }}>
                        <Navigation size={10} /> Get Directions
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} color="var(--accent)" /> Pickup Deadline: {food.comfortablePickupTime}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  {food.pickupStatus === 'Posted' && activeRequestFoodId !== food._id && (
                     <button className="btn btn-primary btn-full" onClick={() => setActiveRequestFoodId(food._id)}>
                       Claim Food
                     </button>
                  )}

                  {activeRequestFoodId === food._id && (
                    <div className="clay-card-inset" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h5 style={{ margin: 0, color: 'var(--accent)' }}>Collection Details</h5>
                      <input type="text" name="ngoName" className="form-input form-input-sm" placeholder="NGO Name" value={requestDetails.ngoName} onChange={handleRequestInput} />
                      <input type="text" name="personName" className="form-input form-input-sm" placeholder="Collector Name" value={requestDetails.personName} onChange={handleRequestInput} />
                      <input type="text" name="phoneNumber" className="form-input form-input-sm" placeholder="Phone Number" value={requestDetails.phoneNumber} onChange={handleRequestInput} />
                      <input type="time" name="pickupTime" className="form-input form-input-sm" value={requestDetails.pickupTime} onChange={handleRequestInput} />
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => submitRequest(food)}>Submit</button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setActiveRequestFoodId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {food.pickupStatus === 'Requested' && (
                    <div style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem' }}>
                      Waiting for Mess Approval
                    </div>
                  )}

                  {food.pickupStatus === 'Accepted' && activeCollectFoodId !== food._id && (
                    <button className="btn btn-primary btn-full" onClick={() => setActiveCollectFoodId(food._id)}>
                      <Camera size={16} /> Collect & Upload Proof
                    </button>
                  )}

                  {activeCollectFoodId === food._id && (
                    <div className="clay-card-inset" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h5 style={{ margin: 0, color: 'var(--accent)' }}>Upload Collection Proof</h5>
                      <input type="file" className="form-input form-input-sm" accept="image/*" onChange={(e) => setCollectionImage(e.target.files[0])} />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => submitCollect(food._id)}>Submit</button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setActiveCollectFoodId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {food.pickupStatus === 'Collected' && activeCompleteFoodId !== food._id && (
                    <button className="btn btn-success btn-full" onClick={() => setActiveCompleteFoodId(food._id)}>
                      <CheckCircle2 size={16} /> Mark Distributed
                    </button>
                  )}

                  {activeCompleteFoodId === food._id && (
                    <div className="clay-card-inset" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h5 style={{ margin: 0, color: 'var(--success)' }}>Upload Distribution Proof</h5>
                      <input type="file" className="form-input form-input-sm" accept="image/*" onChange={(e) => setDeliveryImage(e.target.files[0])} />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => submitComplete(food._id)}>Submit</button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setActiveCompleteFoodId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {food.pickupStatus === 'Completed' && (
                    <div style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem' }}>
                      Distribution Confirmed!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodRequests;
