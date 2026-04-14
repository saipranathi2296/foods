import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../styles/SwapMarketplace.css';

const SwapMarketplace = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', hostelBlock: '' });
  
  // Request Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [swapImage, setSwapImage] = useState(null);
  const [swapImagePreview, setSwapImagePreview] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [quantityRequested, setQuantityRequested] = useState(1);
  const [offeredItemDetails, setOfferedItemDetails] = useState('');
  const [pickupBlock, setPickupBlock] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.hostelBlock) queryParams.append('hostelBlock', filters.hostelBlock);
      
      const { data } = await api.get(`/items?${queryParams.toString()}`);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (item) => {
    setSelectedItem(item);
    setSwapImage(null);
    setSwapImagePreview('');
    setModalOpen(true);
  };

  const closeRequestModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setSwapImage(null);
    setSwapImagePreview('');
    setQuantityRequested(1);
    setOfferedItemDetails('');
    setPickupBlock('');
    setPickupTime('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSwapImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSwapImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitRequest = async () => {
    if (selectedItem.exchangeType === 'swap' && !swapImage) {
      alert('You must provide an image of the item you want to swap.');
      return;
    }
    if (selectedItem.exchangeType === 'swap' && !offeredItemDetails) {
      alert('You must provide details of the item you are offering.');
      return;
    }

    setRequestLoading(true);
    try {
      const data = new FormData();
      data.append('itemId', selectedItem._id);
      data.append('quantityRequested', quantityRequested);
      
      if (selectedItem.exchangeType === 'swap') {
        if (swapImage) data.append('swapImage', swapImage);
        data.append('offeredItemDetails', offeredItemDetails);
      }

      await api.post('/requests', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Item requested successfully!');
      closeRequestModal();
      fetchItems(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Error requesting item');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="marketplace-container">
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">All Categories</option>
            <option value="Notebooks">Notebooks</option>
            <option value="Books">Books</option>
            <option value="Dresses">Dresses</option>
            <option value="Bags">Bags</option>
            <option value="Daily-use items">Daily-use items</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="hostelBlock">Hostel Block</label>
          <select id="hostelBlock" name="hostelBlock" value={filters.hostelBlock} onChange={handleFilterChange}>
            <option value="">All Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading items...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No items found matching your filters.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item._id} className="item-card">
              <div className="item-image-container">
                <span className={`exchange-badge badge-${item.exchangeType}`}>
                  {item.exchangeType}
                </span>
                <img 
                  src={`http://localhost:5000${item.image}`} 
                  alt={item.itemName} 
                  className="item-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image' }}
                />
              </div>
              
              <div className="item-details">
                <h3 className="item-title">{item.itemName}</h3>
                
                {item.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{item.description}</p>
                )}
                
                <div className="item-meta">
                  <span className="meta-tag">{item.category}</span>
                  <span className="meta-tag">Qty: {item.quantity}</span>
                  <span className="meta-tag">Condition: {item.condition}</span>
                  <span className="meta-tag">Block: {item.hostelBlock}</span>
                </div>
                
                {item.exchangeType === 'swap' && item.returnItemDetails && (
                  <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>
                      <strong>Wants in return:</strong> {item.returnItemDetails}
                    </p>
                  </div>
                )}
                
                <div className="item-owner">
                  <span>Posted by: {item.studentId?.name || 'Unknown'}</span>
                  <button 
                    className="request-btn"
                    onClick={() => openRequestModal(item)}
                    disabled={user?._id === item.studentId?._id}
                    title={user?._id === item.studentId?._id ? "You cannot request your own item" : "Request this item"}
                  >
                    Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      {modalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeRequestModal}>&times;</button>
            <h3>Request Item</h3>
            <p>You are requesting: <strong>{selectedItem.itemName}</strong></p>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Quantity Requested (Available: {selectedItem.quantity})</label>
              <input 
                type="number" 
                min="1" 
                max={selectedItem.quantity} 
                value={quantityRequested} 
                onChange={(e) => setQuantityRequested(e.target.value)} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} 
              />
            </div>

            <p style={{ color: 'var(--primary)', fontSize: '0.875rem', marginTop: '1rem', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '0.5rem' }}>
              <strong>Note:</strong> Please choose a comfortable and safe time and location for the swap.
            </p>
            
            {selectedItem.exchangeType === 'swap' ? (
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Since this is a swap, please provide details and a photo of the item you are offering in exchange.
                </p>
                <div className="alert alert-info" style={{ padding: '0.75rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary)' }}>
                    <strong>Requirement:</strong> You must strictly offer what the poster requested:<br/>
                    <em>"{selectedItem.returnItemDetails}"</em>
                  </p>
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Offered Item Details</label>
                  <input 
                    type="text" 
                    value={offeredItemDetails} 
                    onChange={(e) => setOfferedItemDetails(e.target.value)} 
                    placeholder={`e.g. ${selectedItem.returnItemDetails || 'Physics textbook'}`} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} 
                  />
                </div>
                <div className="image-upload-area" onClick={() => document.getElementById('swap-image-upload').click()} style={{ padding: '1.5rem' }}>
                  {!swapImagePreview ? (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: 'var(--primary)' }}>Select Photo</p>
                    </div>
                  ) : (
                    <img src={swapImagePreview} alt="Preview" className="image-preview" style={{ marginTop: 0 }} />
                  )}
                </div>
                <input 
                  type="file" 
                  id="swap-image-upload" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  This item is for donation. The poster will specify the pickup time and location once they accept your request.
                </p>
              </div>
            )}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeRequestModal} disabled={requestLoading}>
                Cancel
              </button>
              <button className="submit-btn" onClick={submitRequest} disabled={requestLoading}>
                {requestLoading ? 'Requesting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapMarketplace;
