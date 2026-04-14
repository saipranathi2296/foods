import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusCircle, Trash2, Save, Calendar, Coffee } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="clay-card-inset">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--grad-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <Calendar size={20} color="#ffffff" />
          </div>
          <h3 style={{ margin: 0 }}>Add Daily Menu</h3>
        </div>
        
        {message && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{message}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" required value={date} min={todayStr} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Meal Type</label>
              <div style={{ position: 'relative' }}>
                <Coffee size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select className="form-select" style={{ paddingLeft: '2.75rem' }} value={mealType} onChange={(e) => setMealType(e.target.value)}>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '1rem' }}>Food Items</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, index) => (
                <div key={index} style={{ background: 'rgba(0,0,0,0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">Item Name</label>
                    <input type="text" className="form-input" required placeholder="Main Item (e.g. Dosa)" value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Replacement 1 (Optional)</label>
                      <input type="text" className="form-input" placeholder="e.g. Idli" value={item.replacementOption1} onChange={(e) => handleItemChange(index, 'replacementOption1', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Replacement 2 (Optional)</label>
                      <input type="text" className="form-input" placeholder="e.g. Bread" value={item.replacementOption2} onChange={(e) => handleItemChange(index, 'replacementOption2', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button type="button" onClick={addItem} className="btn btn-ghost" style={{ marginTop: '1rem' }}>
              <PlusCircle size={18} /> Add Another Item
            </button>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Save size={18} /> Save Menu
          </button>
        </form>
      </div>

      <div className="clay-card-inset">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Menus</h3>
        {menus.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No menus created yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {menus.map(m => (
              <div key={m._id} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--clay-border-2)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{new Date(m.date).toLocaleDateString()}</strong>
                      <span className="badge badge-aqua">{m.mealType}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Saved: {new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleDelete(m._id)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {m.items.map((item, idx) => (
                    <div key={idx} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.itemName}</span>
                      {(item.replacementOption1 || item.replacementOption2) && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                          ➜ Options: {[item.replacementOption1, item.replacementOption2].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMenuForm;
