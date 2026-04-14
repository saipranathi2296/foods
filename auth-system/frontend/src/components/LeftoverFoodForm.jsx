import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LeftoverFoodForm = () => {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    foodType: 'veg',
    preparedTime: '',
    expiryTime: '',
    universityName: '',
    date: '',
    comfortablePickupTime: ''
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
      // Reset file input visually
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
      case 'Posted': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' };
      case 'Requested': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' };
      case 'Accepted': return { bg: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' };
      case 'Collected': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
      case 'Completed': return { bg: 'rgba(5, 150, 105, 0.2)', color: '#059669' };
      default: return { bg: 'var(--surface)', color: 'var(--text-main)' };
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '900px' }}>
      <div className="card">
        <h3>Post Leftover Food</h3>
        {message && <div style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>University Name</label>
              <input type="text" name="universityName" required value={formData.universityName} onChange={handleChange} placeholder="ABC College" />
            </div>
            <div className="form-group">
              <label>Food Item Details</label>
              <input type="text" name="itemName" required value={formData.itemName} onChange={handleChange} placeholder="e.g. Rice & Dal" />
            </div>
            <div className="form-group">
              <label>Quantity (Kg/Portions)</label>
              <input type="number" name="quantity" required value={formData.quantity} onChange={handleChange} placeholder="5" />
            </div>
            <div className="form-group">
              <label>Food Type</label>
              <select name="foodType" value={formData.foodType} onChange={handleChange}>
                <option value="veg">Vegetarian (Veg)</option>
                <option value="nonveg">Non-Vegetarian (Non-Veg)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" required value={formData.date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Comfortable Pickup Time (Deadline)</label>
              <input type="time" name="comfortablePickupTime" required value={formData.comfortablePickupTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Prepared Time</label>
              <input type="datetime-local" name="preparedTime" required value={formData.preparedTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Expiry Time</label>
              <input type="datetime-local" name="expiryTime" required value={formData.expiryTime} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>📸 Image of Food</label>
              <input type="file" id="foodImageInput" accept="image/*" required onChange={handleImageChange} />
            </div>
          </div>

          <button type="submit" className="submit-btn" style={{ marginTop: '1.5rem' }}>Post Food</button>
        </form>
      </div>

      <div className="menu-list">
        <h3>Your Leftover Posts Track Record</h3>
        {leftovers.map(l => {
          const badge = getBadgeColor(l.pickupStatus);
          return (
            <div key={l._id} className="card menu-list-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {l.foodImage && (
                    <img 
                      src={`http://localhost:5000${l.foodImage}`} 
                      alt="Food" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} 
                    />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{l.itemName}</h4>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {l.quantity} units • <span style={{ textTransform: 'capitalize', color: l.foodType==='veg' ? 'var(--secondary)' : 'var(--danger)' }}>{l.foodType}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      University: {l.universityName} <br/>
                      Deadline: {l.comfortablePickupTime}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                  {l.pickupStatus.toUpperCase()}
                </div>
              </div>

              {/* Request Details & Actions */}
              {l.requestDetails && (
                <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>NGO Request Details</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div><strong>NGO:</strong> {l.requestDetails.ngoName}</div>
                    <div><strong>Collector:</strong> {l.requestDetails.personName}</div>
                    <div><strong>Phone:</strong> {l.requestDetails.phoneNumber}</div>
                    <div><strong>Pickup Time:</strong> {l.requestDetails.pickupTime}</div>
                  </div>
                  
                  {l.pickupStatus === 'Requested' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button 
                        onClick={() => handleAction(l._id, 'accept')}
                        style={{ padding: '0.4rem 0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        Accept Request
                      </button>
                      <button 
                        onClick={() => handleAction(l._id, 'reject')}
                        style={{ padding: '0.4rem 0.75rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Proof Images Gallery */}
              {(l.collectionImage || l.deliveryImage) && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {l.collectionImage && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>📸 Collection Proof</div>
                      <img src={`http://localhost:5000${l.collectionImage}`} alt="Collected" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                  {l.deliveryImage && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>📸 Delivery Proof</div>
                      <img src={`http://localhost:5000${l.deliveryImage}`} alt="Delivered" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeftoverFoodForm;
