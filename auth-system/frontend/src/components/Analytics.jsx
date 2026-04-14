import React, { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';
import { BarChart, Search, AlertCircle, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const COLOR_EATEN   = { bg: 'rgba(16,185,129,0.75)',  border: 'rgba(16,185,129,1)'  };
const COLOR_PARTIAL = { bg: 'rgba(245,158,11,0.75)',  border: 'rgba(245,158,11,1)'  };
const COLOR_WASTED  = { bg: 'rgba(239, 68, 68,0.75)', border: 'rgba(239, 68, 68,1)' };
const REPLACEMENT_COLORS = [
  '#4f46e5', '#38bdf8', '#a855f7', '#fb923c', '#22d3ee', '#f43f5e', '#84cc16', '#14b8a6'
];

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Outfit', sans-serif";

const Analytics = () => {
  const [date, setDate]         = useState('');
  const [mealType, setMealType] = useState('');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

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

  const eatenBarChart = data ? {
    labels: data.eatenBarData.map(d => d.itemName),
    datasets: [{
      label: 'Students Who Ate',
      data: data.eatenBarData.map(d => d.eaten),
      backgroundColor: COLOR_EATEN.bg,
      borderColor: COLOR_EATEN.border,
      borderWidth: 1,
      borderRadius: 4,
    }]
  } : null;

  const eatenBarOptions = { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display:false }, y: { grid: { display: false } } } };

  const overallPieChart = data ? {
    labels: ['Completely Ate', 'Partially Ate', 'Did Not Eat', 'No Feedback'],
    datasets: [{
      data: [data.pieChartData.eaten, data.pieChartData.partial, data.pieChartData.wasted, Math.max(0, (data.totalStudents || 1) - data.respondedStudents)],
      backgroundColor: [COLOR_EATEN.bg, COLOR_PARTIAL.bg, COLOR_WASTED.bg, 'rgba(255,255,255,0.1)'],
      borderColor: [COLOR_EATEN.border, COLOR_PARTIAL.border, COLOR_WASTED.border, 'transparent'],
      borderWidth: 0,
    }]
  } : null;

  const groupedBarChart = data ? {
    labels: data.itemConsumptionData.map(d => d.itemName),
    datasets: [
      { label: 'Completely Ate', data: data.itemConsumptionData.map(d => d.ate), backgroundColor: COLOR_EATEN.bg, borderRadius: 4 },
      { label: 'Partially Ate', data: data.itemConsumptionData.map(d => d.partial), backgroundColor: COLOR_PARTIAL.bg, borderRadius: 4 },
      { label: 'Did Not Eat', data: data.itemConsumptionData.map(d => d.wasted), backgroundColor: COLOR_WASTED.bg, borderRadius: 4 }
    ]
  } : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="clay-card-inset" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={e => { setDate(e.target.value); setData(null); }} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label className="form-label">Meal Type</label>
          <select className="form-select" value={mealType} onChange={e => { setMealType(e.target.value); setData(null); }}>
            <option value="">-- Select Meal --</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={fetchAnalytics} disabled={!canFetch || loading} style={{ height: 'fit-content', marginTop: '1.5rem' }}>
          {loading ? <span className="spinner"></span> : <><Search size={18} /> Load Analytics</>}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!data && !loading && (
        <div className="clay-card-inset" style={{ textAlign: 'center', padding: '4rem' }}>
          <BarChart size={48} color="var(--clay-border-2)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No Analytics Loaded</h3>
          <p style={{ color: 'var(--text-muted)' }}>Select a date and meal to view insight data.</p>
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="clay-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--accent)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.totalStudents}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered</div>
            </div>
            <div className="clay-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.respondedStudents}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Responded</div>
            </div>
            <div className="clay-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--success)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{data.pieChartData.eaten}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completely Ate</div>
            </div>
            <div className="clay-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{data.pieChartData.partial}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Partially Ate</div>
            </div>
            <div className="clay-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{data.pieChartData.wasted}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Did Not Eat</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', md: { gridTemplateColumns: '1fr' } }}>
            <div className="clay-card-inset">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Total Consumption</h3>
              <div style={{ height: '250px' }}>
                {overallPieChart && <Pie data={overallPieChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white' } } } }} />}
              </div>
            </div>

            <div className="clay-card-inset">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Eaten Count by Item</h3>
              <div style={{ height: '250px' }}>
                {eatenBarChart && <Bar data={eatenBarChart} options={eatenBarOptions} />}
              </div>
            </div>
          </div>

          <div className="clay-card-inset">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Detailed Breakdown</h3>
            <div style={{ height: '350px' }}>
              {groupedBarChart && <Bar data={groupedBarChart} options={{ responsive: true, maintainAspectRatio: false }} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
