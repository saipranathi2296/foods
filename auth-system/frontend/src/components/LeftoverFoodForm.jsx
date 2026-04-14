import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Camera, Send, Clock, MapPin, Search } from 'lucide-react';

const LeftoverFoodForm = () => {
  const [formData, setFormData] = useState({
    itemName: '', quantity: '', foodType: 'veg', preparedTime: '', 
    expiryTime: '', universityName: '', date: '', comfortablePickupTime: ''
  });
  const [foodImage, setFoodImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [leftovers, setLeftovers] = useState([]);

  useEffect(() => {
    fetchLeftovers();
  }, []);

  const fetchLeftovers = async () => {
    try {
      const { data } = await api.get('/leftovers');
      setLeftovers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setFoodImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!foodImage) {
      setError('Please upload an image of the food.');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('foodImage', foodImage);

      await api.post('/leftovers', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Leftover food logged successfully!');
      setFormData({
        itemName: '', quantity: '', foodType: 'veg', preparedTime: '', 
        expiryTime: '', universityName: '', date: '', comfortablePickupTime: ''
      });
      setFoodImage(null);
      const fileInput = document.getElementById('foodImageInput');
      if (fileInput) fileInput.value = '';

      fetchLeftovers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging leftover food');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/leftovers/${action}/${id}`);
      fetchLeftovers();
    } catch (err) {
      alert(err.response?.data?.message || `Error attempting to ${action} request`);
    }
  };

  const getBadgeColor = (status) => {
    switch(status) {
      case 'Posted': return 'badge-aqua';
      case 'Requested': return 'badge-orange';
      case 'Accepted': return 'badge-purple';
      case 'Collected': return 'badge-green';
      case 'Completed': return 'badge-green';
      default: return 'badge-aqua';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="clay-card-inset">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--grad-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <Send size={20} color="#ffffff" />
          </div>
          <h3 style={{ margin: 0 }}>Post Leftover Food</h3>
        </div>
        
        {message && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{message}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">University Name</label>
              <input type="text" name="universityName" className="form-input" required value={formData.universityName} onChange={handleChange} placeholder="ABC College" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Food Item Details</label>
              <input type="text" name="itemName" className="form-input" required value={formData.itemName} onChange={handleChange} placeholder="e.g. Rice & Dal" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quantity (Kg/Portions)</label>
              <input type="number" name="quantity" className="form-input" required value={formData.quantity} onChange={handleChange} placeholder="5" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Food Type</label>
              <select name="foodType" className="form-select" value={formData.foodType} onChange={handleChange}>
                <option value="veg">Vegetarian (Veg)</option>
                <option value="nonveg">Non-Vegetarian (Non-Veg)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" name="date" className="form-input" required value={formData.date} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Comfortable Pickup Time (Deadline)</label>
              <input type="time" name="comfortablePickupTime" className="form-input" required value={formData.comfortablePickupTime} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prepared Time</label>
              <input type="datetime-local" name="preparedTime" className="form-input" required value={formData.preparedTime} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expiry Time</label>
              <input type="datetime-local" name="expiryTime" className="form-input" required value={formData.expiryTime} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} /> Photo Proof of Food
              </label>
              <input type="file" id="foodImageInput" accept="image/*" required onChange={handleImageChange} style={{ background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', width: '100%' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '2rem' }}>
            Post Food Availability
          </button>
        </form>
      </div>

      <div className="clay-card-inset">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Leftover Tracking History</h3>
        {leftovers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No leftover logs yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {leftovers.map(l => (
              <div key={l._id} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--clay-border-2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' }, gap: '1.5rem' }}>
                  
                  {l.foodImage && (
                    <img 
                      src={`http://localhost:5000${l.foodImage}`} 
                      alt="Food" 
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.1)' }} 
                    />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>{l.itemName}</h4>
                      <span className={`badge ${getBadgeColor(l.pickupStatus)}`}>{l.pickupStatus}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}><b>Qty:</b> {l.quantity} units</span>
                      <span style={{ fontSize: '0.9rem', color: l.foodType==='veg' ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>
                        <b>Type:</b> {l.foodType}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} /> {l.universityName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} /> Deadline: {l.comfortablePickupTime}
                      </div>
                    </div>
                  </div>
                </div>

                {l.requestDetails && (
                  <div style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--accent)' }}>NGO Request Details</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div><b>NGO:</b> {l.requestDetails.ngoName}</div>
                      <div><b>Collector:</b> {l.requestDetails.personName}</div>
                      <div><b>Phone:</b> {l.requestDetails.phoneNumber}</div>
                      <div><b>Pickup Time:</b> {l.requestDetails.pickupTime}</div>
                    </div>
                    
                    {l.pickupStatus === 'Requested' && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={() => handleAction(l._id, 'accept')} className="btn btn-primary btn-sm">Accept Request</button>
                        <button onClick={() => handleAction(l._id, 'reject')} className="btn btn-danger btn-sm">Reject</button>
                      </div>
                    )}
                  </div>
                )}

                {(l.collectionImage || l.deliveryImage) && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--clay-border)' }}>
                    {l.collectionImage && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>📸 Collection Proof</div>
                        <img src={`http://localhost:5000${l.collectionImage}`} alt="Collected" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      </div>
                    )}
                    {l.deliveryImage && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>📸 Delivery Proof</div>
                        <img src={`http://localhost:5000${l.deliveryImage}`} alt="Delivered" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftoverFoodForm;
