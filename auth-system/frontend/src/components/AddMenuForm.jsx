import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Today's date in YYYY-MM-DD (local time) — used as the min date for the input
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AddMenuForm = () => {
  const [date, setDate]         = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [items, setItems]       = useState([{ itemName: '', replacementOption1: '', replacementOption2: '' }]);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');
  const [menus, setMenus]       = useState([]);

  const todayStr = getTodayStr();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const { data } = await api.get('/menu');
      setMenus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { itemName: '', replacementOption1: '', replacementOption2: '' }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Client-side past-date guard (belt-and-suspenders alongside the backend check)
    if (date < todayStr) {
      setError('Cannot create a menu for a past date. Please select today or a future date.');
      return;
    }

    try {
      await api.post('/menu', { date, mealType, items });
      setMessage('Menu created successfully!');
      setDate('');
      setMealType('breakfast');
      setItems([{ itemName: '', replacementOption1: '', replacementOption2: '' }]);
      fetchMenus();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating menu');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/menu/${id}`);
      fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <div className="card">
        <h3>Add Daily Menu</h3>
        {message && <div style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                required
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                ⚠️ Only today or future dates are allowed.
              </p>
            </div>
            <div className="form-group">
              <label>Meal Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
          </div>

          <div className="menu-items-section">
            <label style={{display: 'block', marginBottom: '1rem', fontWeight: 600}}>Food Items</label>
            {items.map((item, index) => (
              <div key={index} className="menu-item-card">
                {items.length > 1 && (
                  <button type="button" className="remove-item-btn" onClick={() => removeItem(index)}>
                    Remove
                  </button>
                )}
                <div className="form-group">
                  <label>Item Name</label>
                  <input 
                    type="text" required placeholder="Main Item"
                    value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Replacement 1</label>
                    <input 
                      type="text" placeholder="Option 1"
                      value={item.replacementOption1} onChange={(e) => handleItemChange(index, 'replacementOption1', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Replacement 2</label>
                    <input 
                      type="text" placeholder="Option 2"
                      value={item.replacementOption2} onChange={(e) => handleItemChange(index, 'replacementOption2', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" className="add-item-btn" onClick={addItem}>
              + Add Another Item
            </button>
          </div>

          <button type="submit" className="submit-btn">Save Menu</button>
        </form>
      </div>

      <div className="menu-list">
        <h3>Recent Menus</h3>
        {menus.map(m => (
          <div key={m._id} className="card menu-list-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '1.1rem' }}>{new Date(m.date).toLocaleDateString()}</strong> - <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{m.mealType}</span>
              </div>
              <button 
                onClick={() => handleDelete(m._id)}
                style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Delete
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
              Saved at: {new Date(m.createdAt).toLocaleString()}
            </div>
            <div style={{ marginTop: '0.5rem', background: 'var(--background)', padding: '0.75rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Items & Replacements</div>
              {m.items.map((item, idx) => (
                <div key={idx} style={{ padding: '0.35rem 0', borderBottom: idx !== m.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.itemName}</span>
                  {(item.replacementOption1 || item.replacementOption2) && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                      (Options: {[item.replacementOption1, item.replacementOption2].filter(Boolean).join(', ')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddMenuForm;
