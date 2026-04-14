import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, CheckCircle2, ChevronRight, Check, X, AlertCircle } from 'lucide-react';

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const makeChannelName = (studentId) => `mess_feedback_sync_${studentId}`;

const DailyMenu = () => {
  const { user } = useContext(AuthContext);

  const [submittedMeals, setSubmittedMeals] = useState({});
  const [menus, setMenus]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [responses, setResponses] = useState({});
  const [replacements, setReplacements] = useState({});
  const [mealErrors, setMealErrors]   = useState({});
  const [submitting, setSubmitting]   = useState({});

  const channelRef = useRef(null);

  const itemKey = (mealType, itemName) => `${mealType}||${itemName}`;

  useEffect(() => {
    if (!user?._id) return;
    if (typeof BroadcastChannel === 'undefined') return;

    const ch = new BroadcastChannel(makeChannelName(user._id));
    ch.onmessage = (e) => {
      if (e.data?.type === 'MEAL_SUBMITTED' && e.data.mealType && e.data.items) {
        setSubmittedMeals(prev => ({
          ...prev,
          [e.data.mealType]: new Set(e.data.items)
        }));
      }
    };
    channelRef.current = ch;
    return () => ch.close();
  }, [user?._id]);

  useEffect(() => {
    const init = async () => {
      const todayStr = getTodayStr();
      await fetchTodayMenus(todayStr);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (menus.length === 0) return;
    const todayStr = getTodayStr();
    menus.forEach(menu => {
      fetchMealStatus(todayStr, menu.mealType);
    });
  }, [menus]);

  const fetchTodayMenus = async (todayStr) => {
    try {
      const { data } = await api.get(`/menu?date=${todayStr}`);
      const today = new Date().toDateString();
      const todayMenus = Array.isArray(data)
        ? data.filter(m => new Date(m.date).toDateString() === today)
        : [];
      setMenus(todayMenus);
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    }
  };

  const fetchMealStatus = async (dateStr, mealType) => {
    try {
      const { data } = await api.get(`/feedback/status?date=${dateStr}&mealType=${mealType}`);
      if (data.submitted) {
        setSubmittedMeals(prev => ({
          ...prev,
          [mealType]: new Set(data.items)
        }));
      }
    } catch (err) {
      console.error(`Failed to check status for ${mealType}:`, err);
    }
  };

  const handleResponseSelect = (mealType, itemName, value) => {
    const key = itemKey(mealType, itemName);
    setResponses(prev => ({ ...prev, [key]: value }));
    setMealErrors(prev => ({ ...prev, [mealType]: '' }));
  };

  const handleReplacementSelect = (mealType, itemName, value) => {
    const key = itemKey(mealType, itemName);
    setReplacements(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitMeal = useCallback(async (menu) => {
    const mealType = menu.mealType;

    if (submittedMeals[mealType]) {
      setMealErrors(prev => ({ ...prev, [mealType]: 'You have already submitted feedback for this meal.' }));
      return;
    }

    if (new Date(menu.date).toDateString() !== new Date().toDateString()) {
      setMealErrors(prev => ({ ...prev, [mealType]: "Feedback can only be submitted for today's menu." }));
      return;
    }

    const missingItems = [];
    for (const item of menu.items) {
      const key = itemKey(mealType, item.itemName);
      if (!responses[key]) {
        missingItems.push(item.itemName);
      }
    }
    if (missingItems.length > 0) {
      setMealErrors(prev => ({ ...prev, [mealType]: `Please select feedback for: ${missingItems.join(', ')}` }));
      return;
    }

    const items = menu.items.map(item => {
      const key = itemKey(mealType, item.itemName);
      return {
        itemName:          item.itemName,
        response:          responses[key],
        replacementOption: replacements[key] || ''
      };
    });

    setSubmitting(prev => ({ ...prev, [mealType]: true }));
    setMealErrors(prev => ({ ...prev, [mealType]: '' }));

    try {
      await api.post('/feedback', { date: menu.date, mealType: mealType, items });

      const submittedItemNames = new Set(menu.items.map(i => i.itemName));
      setSubmittedMeals(prev => ({ ...prev, [mealType]: submittedItemNames }));

      try {
        channelRef.current?.postMessage({ type: 'MEAL_SUBMITTED', mealType: mealType, items: [...submittedItemNames] });
      } catch { /* channel closed */ }

    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting feedback. Please try again.';
      if (msg.toLowerCase().includes('already')) {
        await fetchMealStatus(getTodayStr(), mealType);
      } else {
        setMealErrors(prev => ({ ...prev, [mealType]: msg }));
      }
    } finally {
      setSubmitting(prev => ({ ...prev, [mealType]: false }));
    }
  }, [responses, replacements, submittedMeals]);

  const RESPONSE_OPTIONS = [
    { value: 'Completely Ate', label: <><Check size={16}/> Completely Eaten</>, color: 'var(--success)' },
    { value: 'Partially Ate',  label: <><AlertCircle size={16}/> Partially Eaten</>, color: 'var(--warning)' },
    { value: 'Did Not Eat',    label: <><X size={16}/> Not Eaten</>, color: 'var(--danger)' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }}></div>
        <div>Loading today's menu…</div>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="clay-card-inset" style={{ textAlign: 'center', padding: '4rem' }}>
        <Calendar size={48} color="var(--clay-border-2)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-secondary)' }}>No Menu Posted</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>The mess hasn't posted a menu for today yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="clay-card-inset" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
          <Calendar size={20} color="var(--accent)" /> Today
        </h3>
        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {menus.map((menu) => {
          const mealType    = menu.mealType;
          const isDone      = !!submittedMeals[mealType];
          const isSubmitting = !!submitting[mealType];
          const errMsg      = mealErrors[mealType];

          return (
            <div key={menu._id} className="clay-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid var(--clay-border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.4rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{mealType}</h4>
                {isDone && <span className="badge badge-green"><CheckCircle2 size={14} /> Submitted</span>}
              </div>

              {isDone ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle2 size={48} color="var(--success)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                  <h4 style={{ color: 'var(--success)', margin: '0 0 0.5rem 0' }}>Thank You!</h4>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>We've recorded your feedback for {mealType}.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                  {menu.items.map((item, idx) => {
                    const key             = itemKey(mealType, item.itemName);
                    const selectedResponse = responses[key] || '';
                    const showReplacement  =
                      (selectedResponse === 'Partially Ate' || selectedResponse === 'Did Not Eat') &&
                      (item.replacementOption1 || item.replacementOption2);

                    return (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.itemName}</h4>
                          {(item.replacementOption1 || item.replacementOption2) && (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                              Has options
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                          {RESPONSE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleResponseSelect(mealType, item.itemName, opt.value)}
                              style={{
                                display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px',
                                border: '1px solid',
                                borderColor: selectedResponse === opt.value ? opt.color : 'rgba(255,255,255,0.05)',
                                background: selectedResponse === opt.value ? `color-mix(in srgb, ${opt.color} 15%, transparent)` : 'transparent',
                                color: selectedResponse === opt.value ? '#fff' : 'var(--text-secondary)',
                                fontWeight: selectedResponse === opt.value ? 600 : 400,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                width: '100%',
                                gap: '0.5rem'
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {showReplacement && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ChevronRight size={14} /> Did you eat something else?
                            </label>
                            <select
                              className="form-select"
                              value={replacements[key] || ''}
                              onChange={(e) => handleReplacementSelect(mealType, item.itemName, e.target.value)}
                            >
                              <option value="">No replacement</option>
                              {item.replacementOption1 && <option value={item.replacementOption1}>{item.replacementOption1}</option>}
                              {item.replacementOption2 && <option value={item.replacementOption2}>{item.replacementOption2}</option>}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {errMsg && <div className="alert alert-error">{errMsg}</div>}

                  <button
                    className="btn btn-primary btn-full"
                    style={{ marginTop: 'auto' }}
                    disabled={isSubmitting}
                    onClick={() => handleSubmitMeal(menu)}
                  >
                    {isSubmitting ? <><span className="spinner"></span></> : 'Submit Feedback'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyMenu;
