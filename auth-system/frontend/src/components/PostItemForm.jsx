import React, { useState } from 'react';
import api from '../services/api';
import { Camera, Send, ShoppingBag, Type, Tag, Users, HelpCircle, Package, ArrowRightLeft } from 'lucide-react';

const PostItemForm = ({ onPostSuccess }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    returnItemDetails: '',
    category: 'Notebooks',
    condition: '',
    quantity: 1,
    exchangeType: 'swap',
    hostelBlock: '',
    genderVisibility: 'all'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please upload an image.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    data.append('image', imageFile);

    try {
      await api.post('/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Item posted successfully!');
      
      setFormData({
        itemName: '', description: '', returnItemDetails: '', category: 'Notebooks', condition: '', quantity: 1,
        exchangeType: 'swap', hostelBlock: '', genderVisibility: 'all'
      });
      setImageFile(null);
      setImagePreview('');
      
      if (onPostSuccess) onPostSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error posting item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="clay-card-inset">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--grad-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <ShoppingBag size={20} color="#081b22" />
          </div>
          <h3 style={{ margin: 0 }}>Post an Item for Swap or Donate</h3>
        </div>
        
        {message && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{message}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Type size={14} /> Item Name</label>
              <input type="text" name="itemName" className="form-input" required value={formData.itemName} onChange={handleChange} placeholder="e.g. Engineering Math Book" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><HelpCircle size={14} /> Description</label>
              <input type="text" name="description" className="form-input" required value={formData.description} onChange={handleChange} placeholder="Explain details about the item..." />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ArrowRightLeft size={14} /> Exchange Type</label>
              <select name="exchangeType" className="form-select" value={formData.exchangeType} onChange={handleChange}>
                <option value="swap">Swap</option>
                <option value="donate">Donate</option>
              </select>
            </div>

            {formData.exchangeType === 'swap' && (
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent)' }}>
                  <ArrowRightLeft size={14} /> What I want in return (Mandatory)
                </label>
                <input type="text" name="returnItemDetails" className="form-input" style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }} required value={formData.returnItemDetails} onChange={handleChange} placeholder="e.g. Calculator, physics book..." />
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                <option value="Notebooks">Notebooks</option>
                <option value="Books">Books</option>
                <option value="Dresses">Dresses</option>
                <option value="Bags">Bags</option>
                <option value="Daily-use items">Daily-use items</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={14} /> Condition</label>
              <input type="text" name="condition" className="form-input" required value={formData.condition} onChange={handleChange} placeholder="e.g. Good, Like New" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Package size={14} /> Quantity</label>
              <input type="number" name="quantity" className="form-input" required min="1" value={formData.quantity} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hostel Block</label>
              <input type="text" name="hostelBlock" className="form-input" required value={formData.hostelBlock} onChange={handleChange} placeholder="e.g. Block A" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={14} /> Visibility</label>
              <select name="genderVisibility" className="form-select" value={formData.genderVisibility} onChange={handleChange}>
                <option value="all">Visible to Everyone</option>
                <option value="male">Visible to Boys Hostel Only</option>
                <option value="female">Visible to Girls Hostel Only</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={16} /> Item Image
            </label>
            <div 
              onClick={() => document.getElementById('image-upload').click()}
              style={{
                border: '2px dashed var(--clay-border-2)',
                borderRadius: 'var(--radius-lg)',
                padding: imagePreview ? '1rem' : '3rem 1rem',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--clay-border-2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; }}
            >
              {!imagePreview ? (
                <>
                  <Camera size={40} color="var(--text-muted)" />
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Click to upload an image (JPG, PNG)</p>
                </>
              ) : (
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', objectFit: 'cover' }} />
              )}
            </div>
            <input 
              type="file" 
              id="image-upload" 
              accept="image/*" 
              onChange={handleImageChange} 
              style={{ display: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ marginTop: '2rem' }}>
            {isSubmitting ? <><span className="spinner"></span></> : <><Send size={18} /> Post Item</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostItemForm;
