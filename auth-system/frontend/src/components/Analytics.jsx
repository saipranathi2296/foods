import React, { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import api from '../services/api';
import { BarChart, Search, AlertCircle, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CHART_COLORS = {
  emerald: { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' },
  rose: { bg: 'rgba(244, 63, 94, 0.8)', border: '#f43f5e' },
  orange: { bg: 'rgba(249, 115, 22, 0.8)', border: '#f97316' },
  sky: { bg: 'rgba(14, 165, 233, 0.8)', border: '#0ea5e9' },
  violet: { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' },
  amber: { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' }
};

const COLOR_EATEN   = CHART_COLORS.emerald;
const COLOR_PARTIAL = CHART_COLORS.amber;
const COLOR_WASTED  = CHART_COLORS.rose;
const REPLACEMENT_COLORS = Object.values(CHART_COLORS);

ChartJS.defaults.color = '#475569';
ChartJS.defaults.font.family = "'Outfit', sans-serif";
ChartJS.defaults.font.size = 13;

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

  const eatenBarOptions = { 
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    }, 
    scales: { 
      x: { display:false, grid: { display: false } }, 
      y: { 
        grid: { display: false }, 
        ticks: { color: '#334155', font: { weight: '600' } } 
      } 
    } 
  };

  const overallPieChart = data ? {
    labels: ['Completely Ate', 'Partially Ate', 'Did Not Eat', 'No Feedback'],
    datasets: [{
      data: [data.pieChartData.eaten, data.pieChartData.partial, data.pieChartData.wasted, Math.max(0, (data.totalStudents || 1) - data.respondedStudents)],
      backgroundColor: [COLOR_EATEN.border, COLOR_PARTIAL.border, COLOR_WASTED.border, '#cbd5e1'],
      borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
      borderWidth: 3,
      hoverOffset: 4
    }]
  } : null;

  const groupedBarChart = data ? {
    labels: data.itemConsumptionData.map(d => d.itemName),
    datasets: [
      { label: 'Completely Ate', data: data.itemConsumptionData.map(d => d.ate), backgroundColor: COLOR_EATEN.bg, borderColor: COLOR_EATEN.border, borderWidth: 1, borderRadius: 6 },
      { label: 'Partially Ate', data: data.itemConsumptionData.map(d => d.partial), backgroundColor: COLOR_PARTIAL.bg, borderColor: COLOR_PARTIAL.border, borderWidth: 1, borderRadius: 6 },
      { label: 'Did Not Eat', data: data.itemConsumptionData.map(d => d.wasted), backgroundColor: COLOR_WASTED.bg, borderColor: COLOR_WASTED.border, borderWidth: 1, borderRadius: 6 }
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
                {overallPieChart && <Pie data={overallPieChart} options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { position: 'right', labels: { color: '#334155', padding: 20, usePointStyle: true, pointStyle: 'circle' } },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#0f172a',
                      bodyColor: '#334155',
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8
                    }
                  } 
                }} />}
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
              {groupedBarChart && <Bar data={groupedBarChart} options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { usePointStyle: true, padding: 20, color: '#334155' } },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#0f172a',
                    bodyColor: '#334155',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                  }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#334155', font: { weight: '600' } } },
                  y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, border: { dash: [4, 4] } }
                }
              }} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
