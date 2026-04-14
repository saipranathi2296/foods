import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';
import '../styles/Analytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Palette
const COLOR_EATEN   = { bg: 'rgba(16,185,129,0.75)',  border: 'rgba(16,185,129,1)'  };
const COLOR_PARTIAL = { bg: 'rgba(245,158,11,0.75)',  border: 'rgba(245,158,11,1)'  };
const COLOR_WASTED  = { bg: 'rgba(239, 68, 68,0.75)', border: 'rgba(239, 68, 68,1)' };
const REPLACEMENT_COLORS = [
  'rgba(79,70,229,0.8)', 'rgba(56,189,248,0.8)', 'rgba(168,85,247,0.8)',
  'rgba(251,146,60,0.8)', 'rgba(34,211,238,0.8)', 'rgba(244,63,94,0.8)',
  'rgba(132,204,22,0.8)', 'rgba(20,184,166,0.8)'
];

const Analytics = () => {
  const [date, setDate]         = useState('');
  const [mealType, setMealType] = useState('');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // for item-level drill-down

  const canFetch = date !== '' && mealType !== '';

  const fetchAnalytics = async () => {
    if (!canFetch) return;
    setLoading(true);
    setError('');
    setSelectedItem(null);
    try {
      const res = await api.get(`/feedback/analytics?date=${date}&mealType=${mealType}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  // ── Chart 1: Eaten count per item (horizontal bar) ───────────────────────
  const eatenBarChart = data ? {
    labels: data.eatenBarData.map(d => d.itemName),
    datasets: [{
      label: 'Students Who Ate',
      data: data.eatenBarData.map(d => d.eaten),
      backgroundColor: COLOR_EATEN.bg,
      borderColor: COLOR_EATEN.border,
      borderWidth: 1.5,
      borderRadius: 4,
    }]
  } : null;

  const eatenBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#e2e8f0', font: { size: 12 } } },
      title:  { display: true, text: 'Number of Students Who Ate Each Item', color: '#e2e8f0', font: { size: 14, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.x} students ate this item`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#94a3b8' },
        grid: { color: 'rgba(148,163,184,0.1)' },
        title: { display: true, text: 'No. of Students', color: '#94a3b8' }
      },
      y: {
        ticks: { color: '#e2e8f0' },
        grid: { color: 'rgba(148,163,184,0.1)' },
        title: { display: true, text: 'Food Items', color: '#94a3b8' }
      }
    }
  };

  // ── Chart 2: Overall meal pie ─────────────────────────────────────────────
  const overallPieChart = data ? (() => {
    const totalStudents = data.totalStudents || 1;
    const responded = data.respondedStudents;
    const notResponded = Math.max(0, totalStudents - responded);
    return {
      labels: ['Completely Ate', 'Partially Ate', 'Did Not Eat', 'No Feedback'],
      datasets: [{
        data: [
          data.pieChartData.eaten,
          data.pieChartData.partial,
          data.pieChartData.wasted,
          notResponded
        ],
        backgroundColor: [COLOR_EATEN.bg, COLOR_PARTIAL.bg, COLOR_WASTED.bg, 'rgba(100,116,139,0.6)'],
        borderColor:     [COLOR_EATEN.border, COLOR_PARTIAL.border, COLOR_WASTED.border, 'rgba(100,116,139,1)'],
        borderWidth: 2,
      }]
    };
  })() : null;

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#e2e8f0', font: { size: 12 }, padding: 16 }
      },
      title: {
        display: true,
        text: 'Overall Meal Feedback Distribution',
        color: '#e2e8f0',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const total = data.totalStudents || 1;
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${ctx.parsed} students (${pct}%)`;
          }
        }
      }
    }
  };

  // ── Chart 3: Item-level breakdown (when item selected) ────────────────────
  const selectedItemData = selectedItem && data
    ? data.itemConsumptionData.find(d => d.itemName === selectedItem)
    : null;

  const itemDetailChart = selectedItemData ? {
    labels: ['Completely Ate', 'Partially Ate', 'Did Not Eat'],
    datasets: [{
      label: selectedItem,
      data: [selectedItemData.ate, selectedItemData.partial, selectedItemData.wasted],
      backgroundColor: [COLOR_EATEN.bg, COLOR_PARTIAL.bg, COLOR_WASTED.bg],
      borderColor:     [COLOR_EATEN.border, COLOR_PARTIAL.border, COLOR_WASTED.border],
      borderWidth: 2,
      borderRadius: 4,
    }]
  } : null;

  const itemDetailOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#e2e8f0', font: { size: 12 } } },
      title: {
        display: true,
        text: `Item Analysis: "${selectedItem}"`,
        color: '#e2e8f0',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.parsed.y} students` }
      }
    },
    scales: {
      x: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(148,163,184,0.1)' } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#94a3b8' },
        grid: { color: 'rgba(148,163,184,0.1)' },
        title: { display: true, text: 'No. of Students', color: '#94a3b8' }
      }
    }
  };

  // ── Chart 4: Per-food-item replacement horizontal bar charts ──────────────
  // One chart per food item:
  //   Y-axis  = replacement option names
  //   X-axis  = no. of students who suggested that replacement
  //   Title   = the original food item being replaced
  const hasAnyReplacement = data
    ? data.itemConsumptionData.some(d => d.replacements && d.replacements.length > 0)
    : false;

  // Builder: returns Chart.js data + options for a single food item's replacements
  const buildReplacementChartForItem = (item, colorOffset) => {
    const replacements = item.replacements && item.replacements.length > 0
      ? item.replacements
      : [{ option: 'No suggestions', votes: 0 }];

    const chartData = {
      labels: replacements.map(r => r.option),
      datasets: [{
        label: 'Students',
        data: replacements.map(r => r.votes),
        backgroundColor: replacements.map(
          (_, i) => REPLACEMENT_COLORS[(colorOffset + i) % REPLACEMENT_COLORS.length]
        ),
        borderColor: replacements.map(
          (_, i) => REPLACEMENT_COLORS[(colorOffset + i) % REPLACEMENT_COLORS.length].replace('0.8', '1')
        ),
        borderWidth: 1.5,
        borderRadius: 4,
      }]
    };

    const chartOptions = {
      indexAxis: 'y',          // horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `🔁 Replacement for: ${item.itemName}`,
          color: '#e2e8f0',
          font: { size: 13, weight: 'bold' },
          padding: { bottom: 10 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.x;
              return v === 0
                ? ' No students suggested this'
                : ` ${v} student${v !== 1 ? 's' : ''} suggested this`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#94a3b8' },
          grid: { color: 'rgba(148,163,184,0.1)' },
          title: { display: true, text: 'No. of Students', color: '#94a3b8' }
        },
        y: {
          ticks: { color: '#e2e8f0', font: { size: 12 } },
          grid: { color: 'rgba(148,163,184,0.05)' },
          title: { display: true, text: 'Replacement Items', color: '#94a3b8' }
        }
      }
    };

    return { chartData, chartOptions };
  };

  // ── Chart 5: Per-item grouped bar (full overview) ────────────────────────
  const groupedBarChart = data ? {
    labels: data.itemConsumptionData.map(d => d.itemName),
    datasets: [
      {
        label: 'Completely Ate',
        data: data.itemConsumptionData.map(d => d.ate),
        backgroundColor: COLOR_EATEN.bg,
        borderColor: COLOR_EATEN.border,
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: 'Partially Ate',
        data: data.itemConsumptionData.map(d => d.partial),
        backgroundColor: COLOR_PARTIAL.bg,
        borderColor: COLOR_PARTIAL.border,
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: 'Did Not Eat',
        data: data.itemConsumptionData.map(d => d.wasted),
        backgroundColor: COLOR_WASTED.bg,
        borderColor: COLOR_WASTED.border,
        borderWidth: 1.5,
        borderRadius: 4,
      }
    ]
  } : null;

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#e2e8f0', font: { size: 12 } } },
      title: {
        display: true,
        text: 'Per-Item Eating Pattern (Grouped)',
        color: '#e2e8f0',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} students` } }
    },
    scales: {
      x: {
        ticks: { color: '#e2e8f0' },
        grid: { color: 'rgba(148,163,184,0.1)' },
        title: { display: true, text: 'Food Items', color: '#94a3b8' }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#94a3b8' },
        grid: { color: 'rgba(148,163,184,0.1)' },
        title: { display: true, text: 'No. of Students', color: '#94a3b8' }
      }
    }
  };

  const mealLabel = mealType
    ? { breakfast: '🌅 Breakfast', lunch: '🍛 Lunch', dinner: '🌙 Dinner' }[mealType]
    : '';

  return (
    <div className="analytics-root">
      {/* ── Page Header ── */}
      <div className="analytics-page-header">
        <h2 className="analytics-title">📊 Mess Feedback Analytics</h2>
        <p className="analytics-subtitle">
          Visualize student meal feedback — select a date and meal to begin.
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="analytics-filter-bar">
        <div className="filter-group">
          <label className="filter-label">📅 Date</label>
          <input
            id="analytics-date"
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => { setDate(e.target.value); setData(null); }}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">🍽️ Meal Type</label>
          <select
            id="analytics-meal"
            value={mealType}
            onChange={e => { setMealType(e.target.value); setData(null); }}
            className="filter-input filter-select"
          >
            <option value="">-- Select Meal --</option>
            <option value="breakfast">🌅 Breakfast</option>
            <option value="lunch">🍛 Lunch</option>
            <option value="dinner">🌙 Dinner</option>
          </select>
        </div>

        <button
          id="analytics-fetch-btn"
          className={`fetch-btn${!canFetch ? ' fetch-btn--disabled' : ''}`}
          onClick={fetchAnalytics}
          disabled={!canFetch || loading}
        >
          {loading ? (
            <span className="btn-spinner">⏳ Loading…</span>
          ) : (
            '🔍 Load Analytics'
          )}
        </button>

        {!canFetch && (
          <span className="filter-hint">⚠️ Select both date and meal type to load analytics</span>
        )}
      </div>

      {error && <div className="analytics-error">⚠️ {error}</div>}

      {/* ── Empty State ── */}
      {!data && !loading && (
        <div className="analytics-empty">
          <div className="empty-icon">📈</div>
          <p className="empty-title">No Data Loaded</p>
          <p className="empty-desc">
            Choose a <strong>date</strong> and a <strong>meal type</strong> above, then click <em>Load Analytics</em>.
          </p>
        </div>
      )}

      {/* ── Data Loaded ── */}
      {data && (
        <>
          {/* Summary ribbon */}
          <div className="summary-ribbon">
            <div className="summary-badge" style={{ '--badge-color': '#6366f1' }}>
              <span className="badge-value">{data.totalStudents}</span>
              <span className="badge-label">Registered Students</span>
            </div>
            <div className="summary-badge" style={{ '--badge-color': '#38bdf8' }}>
              <span className="badge-value">{data.respondedStudents}</span>
              <span className="badge-label">Responded</span>
            </div>
            <div className="summary-badge" style={{ '--badge-color': '#10b981' }}>
              <span className="badge-value">{data.pieChartData.eaten}</span>
              <span className="badge-label">Completely Ate</span>
            </div>
            <div className="summary-badge" style={{ '--badge-color': '#f59e0b' }}>
              <span className="badge-value">{data.pieChartData.partial}</span>
              <span className="badge-label">Partially Ate</span>
            </div>
            <div className="summary-badge" style={{ '--badge-color': '#ef4444' }}>
              <span className="badge-value">{data.pieChartData.wasted}</span>
              <span className="badge-label">Did Not Eat</span>
            </div>
            <div className="summary-badge" style={{ '--badge-color': '#64748b' }}>
              <span className="badge-value">
                {Math.max(0, data.totalStudents - data.respondedStudents)}
              </span>
              <span className="badge-label">No Feedback</span>
            </div>
          </div>

          {/* Meal info bar */}
          <div className="meal-info-bar">
            Showing results for <strong>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> — <strong>{mealLabel}</strong>
          </div>

          {/* ── Section 1: Eaten count per item ── */}
          <section className="analytics-section">
            <div className="section-header">
              <h3 className="section-title">🍽️ Items vs Students (Eaten Count)</h3>
              <p className="section-desc">
                Horizontal bars show how many students fully ate each item.
                <strong> X-axis</strong>: No. of students &nbsp;|&nbsp; <strong>Y-axis</strong>: Food items
              </p>
            </div>
            <div className="chart-card" style={{ height: `${Math.max(200, data.eatenBarData.length * 48 + 80)}px` }}>
              {eatenBarChart && <Bar data={eatenBarChart} options={eatenBarOptions} />}
            </div>
          </section>

          {/* ── Section 2: Item-level drill down ── */}
          <section className="analytics-section">
            <div className="section-header">
              <h3 className="section-title">🔍 Item-wise Consumption Analysis</h3>
              <p className="section-desc">
                Click on an item below to see its detailed eaten / partially eaten / not eaten breakdown.
              </p>
            </div>
            <div className="item-pill-row">
              {data.itemConsumptionData.map(item => (
                <button
                  key={item.itemName}
                  id={`item-pill-${item.itemName.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`item-pill${selectedItem === item.itemName ? ' item-pill--active' : ''}`}
                  onClick={() => setSelectedItem(selectedItem === item.itemName ? null : item.itemName)}
                >
                  {item.itemName}
                </button>
              ))}
            </div>

            {selectedItemData && (
              <div className="item-detail-grid">
                {/* Bar chart */}
                <div className="chart-card" style={{ height: '300px' }}>
                  {itemDetailChart && <Bar data={itemDetailChart} options={itemDetailOptions} />}
                </div>

                {/* Stat pills */}
                <div className="item-stat-panel">
                  <h4 className="item-stat-title">"{selectedItem}" — Breakdown</h4>
                  <div className="item-stat-row">
                    <div className="item-stat-box" style={{ borderColor: '#10b981' }}>
                      <span className="istat-val" style={{ color: '#10b981' }}>{selectedItemData.ate}</span>
                      <span className="istat-label">✅ Completely Ate</span>
                    </div>
                    <div className="item-stat-box" style={{ borderColor: '#f59e0b' }}>
                      <span className="istat-val" style={{ color: '#f59e0b' }}>{selectedItemData.partial}</span>
                      <span className="istat-label">⚠️ Partially Ate</span>
                    </div>
                    <div className="item-stat-box" style={{ borderColor: '#ef4444' }}>
                      <span className="istat-val" style={{ color: '#ef4444' }}>{selectedItemData.wasted}</span>
                      <span className="istat-label">❌ Did Not Eat</span>
                    </div>
                  </div>

                  {/* Per-item replacements */}
                  {selectedItemData.replacements && selectedItemData.replacements.length > 0 && (
                    <div className="item-replacements">
                      <h5 className="repl-heading">🔁 Suggested Replacements</h5>
                      {selectedItemData.replacements.map((r, i) => (
                        <div key={r.option} className="repl-row">
                          <span
                            className="repl-dot"
                            style={{ backgroundColor: REPLACEMENT_COLORS[i % REPLACEMENT_COLORS.length] }}
                          />
                          <span className="repl-option">{r.option}</span>
                          <span className="repl-count">{r.votes} student{r.votes !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── Section 3: Overall Pie ── */}
          <section className="analytics-section">
            <div className="section-header">
              <h3 className="section-title">🥧 Overall Meal Feedback (Pie Chart)</h3>
              <p className="section-desc">
                Distribution of responses across all {data.totalStudents} registered students.
                Percentages are relative to total student count.
              </p>
            </div>
            <div className="pie-section-grid">
              <div className="chart-card pie-card">
                {overallPieChart && <Pie data={overallPieChart} options={pieOptions} />}
              </div>
              <div className="pie-legend-panel">
                <h4 className="pie-legend-title">Legend</h4>
                {[
                  { label: 'Completely Ate', value: data.pieChartData.eaten,  color: '#10b981' },
                  { label: 'Partially Ate',  value: data.pieChartData.partial, color: '#f59e0b' },
                  { label: 'Did Not Eat',    value: data.pieChartData.wasted,  color: '#ef4444' },
                  { label: 'No Feedback',    value: Math.max(0, data.totalStudents - data.respondedStudents), color: '#64748b' }
                ].map(l => {
                  const pct = data.totalStudents > 0 ? ((l.value / data.totalStudents) * 100).toFixed(1) : 0;
                  return (
                    <div key={l.label} className="legend-row">
                      <span className="legend-dot" style={{ backgroundColor: l.color }} />
                      <span className="legend-label">{l.label}</span>
                      <span className="legend-value" style={{ color: l.color }}>
                        {l.value} <span className="legend-pct">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Section 4: Per-item grouped bar ── */}
          <section className="analytics-section">
            <div className="section-header">
              <h3 className="section-title">📊 Per-Item Eating Pattern (Grouped Bar)</h3>
              <p className="section-desc">
                Compare Completely Ate / Partially Ate / Did Not Eat side-by-side for every item.
              </p>
            </div>
            <div className="chart-card" style={{ height: '320px' }}>
              {groupedBarChart && <Bar data={groupedBarChart} options={groupedBarOptions} />}
            </div>
          </section>

          {/* ── Section 5: Replacement Suggestions ── */}
          <section className="analytics-section">
            <div className="section-header">
              <h3 className="section-title">🔁 Replacement Suggestions Analytics</h3>
              <p className="section-desc">
                Each chart shows what students want <em>instead</em> of a particular food item.
                <strong> Y-axis</strong>: replacement names &nbsp;|&nbsp;
                <strong> X-axis</strong>: no. of students.
                Items with no suggestions show <strong>0</strong>.
              </p>
            </div>

            <div className="per-item-repl-charts-grid">
              {data.itemConsumptionData.map((item, idx) => {
                const { chartData, chartOptions } = buildReplacementChartForItem(item, idx * 2);
                const totalVotes = item.replacements
                  ? item.replacements.reduce((s, r) => s + r.votes, 0)
                  : 0;
                const barCount = item.replacements && item.replacements.length > 0
                  ? item.replacements.length
                  : 1;
                // Dynamic height: 60px per bar + 100px overhead
                const chartHeight = Math.max(160, barCount * 52 + 100);

                return (
                  <div key={item.itemName} className="per-item-repl-chart-card">
                    {/* Badge showing total votes */}
                    <div className="repl-chart-badge">
                      {totalVotes === 0
                        ? <span className="repl-badge-zero">No Suggestions</span>
                        : <span className="repl-badge-count">{totalVotes} suggestion{totalVotes !== 1 ? 's' : ''}</span>
                      }
                    </div>
                    <div style={{ height: `${chartHeight}px` }}>
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;
