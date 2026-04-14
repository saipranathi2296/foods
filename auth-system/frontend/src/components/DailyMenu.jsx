import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../styles/FeedbackForm.css';

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Channel name scoped to student ID — prevents cross-student bleed between tabs
const makeChannelName = (studentId) => `mess_feedback_sync_${studentId}`;

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   SOURCE OF TRUTH = MongoDB (via /api/feedback/status per meal).
   Feedback is submitted in one shot per meal (all items together).
   No localStorage used for feedback state.
───────────────────────────────────────────────────────────────────────────── */
const DailyMenu = () => {
  const { user } = useContext(AuthContext);

  // Which mealTypes have been fully submitted by THIS student (from DB)
  // key = mealType (e.g. "lunch"), value = Set of submitted itemNames
  const [submittedMeals, setSubmittedMeals] = useState({});

  const [menus, setMenus]       = useState([]);
  const [loading, setLoading]   = useState(true);

  // Per-item response selections: { "lunch||Idli": "Completely Ate", ... }
  const [responses, setResponses] = useState({});

  // Per-item replacement selections: { "lunch||Idli": "Roti", ... }
  const [replacements, setReplacements] = useState({});

  // Per-meal submit errors / success
  const [mealErrors, setMealErrors]   = useState({});
  const [submitting, setSubmitting]   = useState({});

  const channelRef = useRef(null);

  const itemKey = (mealType, itemName) => `${mealType}||${itemName}`;

  /* ── Cross-tab sync — scoped to THIS student ──────────────────────────── */
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

  /* ── On mount: fetch menus + load submission status from DB ────────────── */
  useEffect(() => {
    const init = async () => {
      const todayStr = getTodayStr();
      await fetchTodayMenus(todayStr);
      setLoading(false);
    };
    init();
  }, []);

  /* ── After menus load, check DB status for each meal ───────────────────── */
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

  /**
   * Ask the BACKEND if THIS student has already submitted feedback
   * for a specific mealType on today's date.
   * Updates submittedMeals[mealType] with the set of submitted item names.
   */
  const fetchMealStatus = async (dateStr, mealType) => {
    try {
      const { data } = await api.get(
        `/feedback/status?date=${dateStr}&mealType=${mealType}`
      );
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

  /* ── Response selection handler ───────────────────────────────────────── */
  const handleResponseSelect = (mealType, itemName, value) => {
    const key = itemKey(mealType, itemName);
    setResponses(prev => ({ ...prev, [key]: value }));
    // Clear any error for this meal when user makes a selection
    setMealErrors(prev => ({ ...prev, [mealType]: '' }));
  };

  /* ── Replacement selection handler ────────────────────────────────────── */
  const handleReplacementSelect = (mealType, itemName, value) => {
    const key = itemKey(mealType, itemName);
    setReplacements(prev => ({ ...prev, [key]: value }));
  };

  /* ── Submit all items for a meal ──────────────────────────────────────── */
  const handleSubmitMeal = useCallback(async (menu) => {
    const mealType = menu.mealType;

    // ── Guard: already submitted
    if (submittedMeals[mealType]) {
      setMealErrors(prev => ({
        ...prev,
        [mealType]: 'You have already submitted feedback for this meal.'
      }));
      return;
    }

    // ── Guard: date must be today
    if (new Date(menu.date).toDateString() !== new Date().toDateString()) {
      setMealErrors(prev => ({
        ...prev,
        [mealType]: "Feedback can only be submitted for today's menu."
      }));
      return;
    }

    // ── Validate: every item must have a response
    const missingItems = [];
    for (const item of menu.items) {
      const key = itemKey(mealType, item.itemName);
      if (!responses[key]) {
        missingItems.push(item.itemName);
      }
    }
    if (missingItems.length > 0) {
      setMealErrors(prev => ({
        ...prev,
        [mealType]: `Please select feedback for: ${missingItems.join(', ')}`
      }));
      return;
    }

    // ── Build items payload
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
      await api.post('/feedback', {
        date:     menu.date,
        mealType: mealType,
        items
      });

      // Mark submitted locally
      const submittedItemNames = new Set(menu.items.map(i => i.itemName));
      setSubmittedMeals(prev => ({ ...prev, [mealType]: submittedItemNames }));

      // Broadcast to other tabs of THIS student only
      try {
        channelRef.current?.postMessage({
          type:     'MEAL_SUBMITTED',
          mealType: mealType,
          items:    [...submittedItemNames]
        });
      } catch { /* channel closed */ }

    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting feedback. Please try again.';

      if (msg.toLowerCase().includes('already')) {
        // DB says already submitted — re-fetch to sync state
        await fetchMealStatus(getTodayStr(), mealType);
      } else {
        setMealErrors(prev => ({ ...prev, [mealType]: msg }));
      }
    } finally {
      setSubmitting(prev => ({ ...prev, [mealType]: false }));
    }
  }, [responses, replacements, submittedMeals]);

  /* ─────────────────────────────────────────────────────────────────────────
     Render helpers
  ───────────────────────────────────────────────────────────────────────── */
  const RESPONSE_OPTIONS = [
    { value: 'Completely Ate', label: '✅ Completely Eaten',  className: 'btn-complete' },
    { value: 'Partially Ate',  label: '⚠️ Partially Eaten',  className: 'btn-partial'  },
    { value: 'Did Not Eat',    label: '❌ Not Eaten',         className: 'btn-none'     },
  ];

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
        ⏳ Loading today's menu…
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="card">
        <h3>Today's Menu</h3>
        <p style={{ color: 'var(--text-muted)' }}>No menu has been posted for today yet.</p>
      </div>
    );
  }

  return (
    <div className="daily-menu-container">
      <h3 className="menu-date">
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}
      </h3>

      {menus.map((menu) => {
        const mealType    = menu.mealType;
        const isDone      = !!submittedMeals[mealType];
        const isSubmitting = !!submitting[mealType];
        const errMsg      = mealErrors[mealType];

        return (
          <div key={menu._id} className="meal-section">
            <h4 className="meal-title" style={{ textTransform: 'capitalize' }}>
              {mealType}
            </h4>

            {/* ── SUBMITTED STATE ── */}
            {isDone ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.2rem', borderRadius: '20px',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.35)',
                color: '#10b981', fontSize: '0.9rem', fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                ✅ Feedback Submitted for {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </div>
            ) : (
              /* ── FEEDBACK FORM ── */
              <div className="meal-feedback-form">
                {menu.items.map((item, idx) => {
                  const key             = itemKey(mealType, item.itemName);
                  const selectedResponse = responses[key] || '';
                  const showReplacement  =
                    (selectedResponse === 'Partially Ate' || selectedResponse === 'Did Not Eat') &&
                    (item.replacementOption1 || item.replacementOption2);

                  return (
                    <div key={idx} className="food-item-card">
                      {/* Item header */}
                      <div className="item-details">
                        <h4>{item.itemName}</h4>
                        {(item.replacementOption1 || item.replacementOption2) && (
                          <p className="options-text">
                            Options: {item.replacementOption1}
                            {item.replacementOption2 ? ` | ${item.replacementOption2}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Response buttons */}
                      <div className="feedback-section" style={{ flexDirection: 'column' }}>
                        <p style={{
                          fontSize: '0.8rem', color: 'var(--text-muted)',
                          marginBottom: '0.4rem', fontWeight: 500
                        }}>
                          Select one: <span style={{ color: '#ef4444' }}>*</span>
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {RESPONSE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              id={`fb-${key}-${opt.value.replace(/\s+/g, '-')}`}
                              className={`feedback-btn ${opt.className}${selectedResponse === opt.value ? ' selected' : ''}`}
                              style={{
                                outline: selectedResponse === opt.value
                                  ? '2px solid #6366f1' : 'none',
                                transform: selectedResponse === opt.value
                                  ? 'scale(1.04)' : 'scale(1)',
                                fontWeight: selectedResponse === opt.value ? 700 : 400,
                                transition: 'all 0.15s ease'
                              }}
                              onClick={() => handleResponseSelect(mealType, item.itemName, opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Replacement picker — only for Partially/Not Eaten with options */}
                        {showReplacement && (
                          <div style={{
                            marginTop: '0.6rem', padding: '0.65rem 0.75rem',
                            backgroundColor: 'var(--background)', borderRadius: '8px',
                            border: '1px solid var(--border)'
                          }}>
                            <label style={{
                              display: 'block', fontSize: '0.82rem',
                              marginBottom: '0.35rem', fontWeight: 600
                            }}>
                              🔁 Would you like a replacement?{' '}
                              <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                            </label>
                            <select
                              style={{
                                width: '100%', padding: '0.45rem 0.6rem', borderRadius: '4px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg, #1e293b)',
                                color: 'var(--text-main, #f1f5f9)'
                              }}
                              value={replacements[key] || ''}
                              onChange={(e) => handleReplacementSelect(mealType, item.itemName, e.target.value)}
                            >
                              <option value="">No replacement needed</option>
                              {item.replacementOption1 && (
                                <option value={item.replacementOption1}>{item.replacementOption1}</option>
                              )}
                              {item.replacementOption2 && (
                                <option value={item.replacementOption2}>{item.replacementOption2}</option>
                              )}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Per-meal error message */}
                {errMsg && (
                  <p style={{
                    color: '#ef4444', fontSize: '0.85rem',
                    marginTop: '0.5rem', fontWeight: 500
                  }}>
                    ⚠️ {errMsg}
                  </p>
                )}

                {/* Submit button — one per meal */}
                <button
                  id={`submit-${mealType}-feedback`}
                  className="request-btn"
                  style={{ marginTop: '1rem', minWidth: '160px' }}
                  disabled={isSubmitting}
                  onClick={() => handleSubmitMeal(menu)}
                >
                  {isSubmitting ? '⏳ Submitting…' : `Submit ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Feedback`}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DailyMenu;
