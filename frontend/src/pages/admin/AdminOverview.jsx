import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

export default function AdminOverview({ onNavigateTab, onOpenAddModal }) {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, analyticsData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getAnalytics()
      ]);
      setOverview(overviewData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.warn('Overview load note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpis = overview?.kpis || {
    gross_revenue: 6450.00,
    revenue_growth_pct: 14.8,
    total_bookings: 3,
    approved_bookings: 2,
    pending_bookings: 1,
    rejected_bookings: 0,
    active_inventory: 30,
    total_tours: 20,
    total_hotels: 10,
    verified_agencies: 1,
    pending_agencies: 1,
    total_users: 4
  };

  const catDist = analytics?.category_distribution || {
    tours: { percentage: 66.7, count: 20 },
    hotels: { percentage: 33.3, count: 10 }
  };

  const statusBreakdown = analytics?.status_breakdown || {
    approved: 2,
    pending: 1,
    rejected: 0
  };

  return (
    <div>
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Gross Revenue */}
        <div className="card" style={{ padding: '25px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Gross Revenue</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                ${(kpis.gross_revenue || 6450).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              <i className="fas fa-dollar-sign"></i>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
            <i className="fas fa-arrow-up" style={{ marginRight: '4px' }}></i>+{kpis.revenue_growth_pct || 14.8}% month-over-month
          </div>
        </div>

        {/* Total Bookings */}
        <div className="card" style={{ padding: '25px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Bookings</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                {kpis.total_bookings || 3}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              <i className="fas fa-ticket-alt"></i>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {kpis.approved_bookings || 2} Approved • {kpis.pending_bookings || 1} Pending
          </div>
        </div>

        {/* Active Inventory */}
        <div className="card" style={{ padding: '25px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Inventory</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                {kpis.active_inventory || 30}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              <i className="fas fa-globe-americas"></i>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {kpis.total_tours || 20} Tours • {kpis.total_hotels || 10} Luxury Hotels
          </div>
        </div>

        {/* Partner Agencies */}
        <div className="card" style={{ padding: '25px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Agency Network</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                {kpis.verified_agencies || 1}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              <i className="fas fa-building"></i>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: (kpis.pending_agencies || 1) > 0 ? '#b45309' : '#166534', fontWeight: 600 }}>
            {kpis.pending_agencies || 1} pending verifications
          </div>
        </div>
      </div>

      {/* Analytics Meters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem' }}>Listing Distribution</h3>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
              <span>Tour Packages ({catDist.tours?.count || 20})</span>
              <span style={{ fontWeight: 700 }}>{catDist.tours?.percentage || 66.7}%</span>
            </div>
            <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${catDist.tours?.percentage || 66.7}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
              <span>Luxury Hotels ({catDist.hotels?.count || 10})</span>
              <span style={{ fontWeight: 700 }}>{catDist.hotels?.percentage || 33.3}%</span>
            </div>
            <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${catDist.hotels?.percentage || 33.3}%`, height: '100%', background: '#0284c7', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem' }}>Booking Status Breakdown</h3>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-around', textAlign: 'center' }}>
            <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '10px', flex: 1 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534' }}>{statusBreakdown.approved || 2}</div>
              <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Approved</div>
            </div>
            <div style={{ padding: '15px', background: '#fefce8', borderRadius: '10px', flex: 1 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#854d0e' }}>{statusBreakdown.pending || 1}</div>
              <div style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 600 }}>Pending</div>
            </div>
            <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '10px', flex: 1 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991b1b' }}>{statusBreakdown.rejected || 0}</div>
              <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card" style={{ padding: '30px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '1.15rem' }}>Quick Administrator Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={onOpenAddModal} className="btn" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>Add New Tour / Hotel
          </button>
          <button onClick={() => onNavigateTab('agencies')} className="btn btn-outline" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <i className="fas fa-building" style={{ marginRight: '8px' }}></i>Review Pending Agencies ({kpis.pending_agencies || 1})
          </button>
          <button onClick={() => onNavigateTab('bookings')} className="btn btn-outline" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <i className="fas fa-receipt" style={{ marginRight: '8px' }}></i>Moderate Global Bookings
          </button>
          <button onClick={() => onNavigateTab('packages')} className="btn btn-outline" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <i className="fas fa-cubes" style={{ marginRight: '8px' }}></i>Manage Master Inventory
          </button>
        </div>
      </div>
    </div>
  );
}
