import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Search, Filter, BoxSelect, ArrowRightLeft, Heart, Camera, X } from 'lucide-react';

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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Item requested successfully!');
      closeRequestModal();
      fetchItems(); 
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Filter Bar */}
      <div className="clay-card-inset" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
          <Filter size={20} />
          <span style={{ fontWeight: 600 }}>Filters</span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '200px', flex: 1 }}>
            <select name="category" className="form-select" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="Notebooks">Notebooks</option>
              <option value="Books">Books</option>
              <option value="Dresses">Dresses</option>
              <option value="Bags">Bags</option>
              <option value="Daily-use items">Daily-use items</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '200px', flex: 1 }}>
            <select name="hostelBlock" className="form-select" value={filters.hostelBlock} onChange={handleFilterChange}>
              <option value="">All Blocks</option>
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Block C">Block C</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }}></div>
          <div>Loading marketplace...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card-inset" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BoxSelect size={48} color="var(--clay-border-2)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No Items Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {items.map(item => (
            <div key={item._id} className="clay-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
              
              <div style={{ position: 'relative', height: '220px', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
                  <span className={`badge ${item.exchangeType === 'swap' ? 'badge-aqua' : 'badge-orange'}`} style={{ backdropFilter: 'blur(10px)' }}>
                    {item.exchangeType === 'swap' ? <><ArrowRightLeft size={12} /> Swap</> : <><Heart size={12} /> Donate</>}
                  </span>
                </div>
                <img 
                  src={`http://localhost:5000${item.image}`} 
                  alt={item.itemName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x220?text=No+Image' }}
                />
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{item.itemName}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>{item.category}</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>{item.condition}</span>
                  </div>
                  {item.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                  )}
                </div>
                
                {item.exchangeType === 'swap' && item.returnItemDetails && (
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.2rem' }}>Looking For</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.returnItemDetails}</div>
                  </div>
                )}
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--clay-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.studentId?.name || 'Unknown'}</div>
                    {item.hostelBlock}
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
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

      {/* Request Modal built with clay UI */}
      {modalOpen && selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="clay-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--clay-surface)', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Request Item</h3>
              <button onClick={closeRequestModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={`http://localhost:5000${selectedItem.image}`} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="item" />
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>You are requesting</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{selectedItem.itemName}</div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Quantity Requested (Max: {selectedItem.quantity})</label>
              <input 
                type="number" 
                className="form-input"
                min="1" 
                max={selectedItem.quantity} 
                value={quantityRequested} 
                onChange={(e) => setQuantityRequested(e.target.value)} 
              />
            </div>
            
            {selectedItem.exchangeType === 'swap' ? (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ArrowRightLeft size={18} /> Offer an Exchange</h4>
                
                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0 }}>The owner specifically requested: <strong>"{selectedItem.returnItemDetails}"</strong></p>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Details of your offered item</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={offeredItemDetails} 
                    onChange={(e) => setOfferedItemDetails(e.target.value)} 
                    placeholder={`e.g. ${selectedItem.returnItemDetails || 'Clean Notebook'}`} 
                  />
                </div>
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={16} /> Photo of your item
                  </label>
                  
                  <div style={{ border: '2px dashed var(--clay-border-2)', borderRadius: 'var(--radius-md)', padding: swapImagePreview ? '0.5rem' : '2rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }} onClick={() => document.getElementById('swap-image-upload').click()}>
                    {!swapImagePreview ? (
                      <div style={{ color: 'var(--accent)' }}>Click to upload photo</div>
                    ) : (
                      <img src={swapImagePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                    )}
                  </div>
                  <input type="file" id="swap-image-upload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
              </div>
            ) : (
              <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
                <p style={{ margin: 0 }}>This item is donated freely. The owner will review your request and specify pickup details if accepted.</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-ghost" onClick={closeRequestModal} style={{ flex: 1 }} disabled={requestLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={submitRequest} style={{ flex: 1 }} disabled={requestLoading}>
                {requestLoading ? <span className="spinner"></span> : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapMarketplace;
