import React, { useState } from 'react';
import api from '../services/api';
import '../styles/MenuForm.css'; // Reusing form grid styles
import '../styles/SwapMarketplace.css'; // For upload area

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
      // Create preview URL
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Item posted successfully!');
      
      // Reset form
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
    <div className="form-container">
      <div className="card">
        <h3>Post an Item for Swap or Donate</h3>
        {message && <div style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Item Name</label>
              <input type="text" name="itemName" required value={formData.itemName} onChange={handleChange} placeholder="e.g. Engineering Mathematics Textbook" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" name="description" required value={formData.description} onChange={handleChange} placeholder="Explain details about the item..." />
            </div>

            {formData.exchangeType === 'swap' && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>What I want in return (Mandatory)</label>
                <input type="text" name="returnItemDetails" required value={formData.returnItemDetails} onChange={handleChange} placeholder="e.g. Calculator, physics book, or 50 rupees..." />
              </div>
            )}
            
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="Notebooks">Notebooks</option>
                <option value="Books">Books</option>
                <option value="Dresses">Dresses</option>
                <option value="Bags">Bags</option>
                <option value="Daily-use items">Daily-use items</option>
              </select>
            </div>

            <div className="form-group">
              <label>Condition</label>
              <input type="text" name="condition" required value={formData.condition} onChange={handleChange} placeholder="e.g. Good, Like New" />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input type="number" name="quantity" required min="1" value={formData.quantity} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Exchange Type</label>
              <select name="exchangeType" value={formData.exchangeType} onChange={handleChange}>
                <option value="swap">Swap</option>
                <option value="donate">Donate</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hostel Block</label>
              <input type="text" name="hostelBlock" required value={formData.hostelBlock} onChange={handleChange} placeholder="e.g. Block A" />
            </div>

            <div className="form-group">
              <label>Visibility</label>
              <select name="genderVisibility" value={formData.genderVisibility} onChange={handleChange}>
                <option value="all">Visible to Everyone</option>
                <option value="male">Visible to Boys Hostel Only</option>
                <option value="female">Visible to Girls Hostel Only</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Item Image</label>
            <div className="image-upload-area" onClick={() => document.getElementById('image-upload').click()}>
              {!imagePreview ? (
                <div>
                  <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--text-muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Click to upload an image (JPG, PNG)</p>
                </div>
              ) : (
                <img src={imagePreview} alt="Preview" className="image-preview" />
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

          <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ marginTop: '1.5rem', width: '100%' }}>
            {isSubmitting ? 'Posting...' : 'Post Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostItemForm;
