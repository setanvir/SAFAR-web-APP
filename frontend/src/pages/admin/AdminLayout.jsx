import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import BrandLogo from '../../components/BrandLogo';
import AdminOverview from './AdminOverview';
import AdminPackages from './AdminPackages';
import AdminAgencies from './AdminAgencies';
import AdminBookings from './AdminBookings';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';

export default function AdminLayout({ currentUser }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [packages, setPackages] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pkgs, ags, bks, usrs] = await Promise.all([
        adminApi.getPackages(),
        adminApi.getAgencies(),
        adminApi.getBookings(),
        adminApi.getUsers(),
      ]);
      setPackages(pkgs);
      setAgencies(ags);
      setBookings(bks);
      setUsers(usrs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handlers for mutations
  const handleAddPackage = async (packageData) => {
    const created = await adminApi.createPackage(packageData);
    setPackages(prev => [created, ...prev]);
    return created;
  };

  const handleUpdatePackage = async (packageId, updateData) => {
    const updated = await adminApi.updatePackage(packageId, updateData);
    setPackages(prev => prev.map(p => p.id === packageId ? updated : p));
    return updated;
  };

  const handleDeletePackage = async (packageId) => {
    await adminApi.deletePackage(packageId);
    setPackages(prev => prev.filter(p => p.id !== packageId));
  };

  const handleVerifyAgency = async (agencyId, newStatus) => {
    const updated = await adminApi.verifyAgency(agencyId, newStatus);
    setAgencies(prev => prev.map(a => a.id === agencyId ? updated : a));
    return updated;
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    const updated = await adminApi.updateBookingStatus(bookingId, newStatus);
    setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
    return updated;
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "ID,Title,Type,Location,Price,Agency,Status\n"
      + packages.map(p => `"${p.id}","${p.title}","${p.type}","${p.location}","${p.price}","${p.agency || 'SAFAR'}","${p.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `safar_master_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Export Complete! Master inventory CSV downloaded from PostgreSQL.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const pendingAgenciesCount = agencies.filter(a => a.verification_status === 'pending').length;

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container text-center" style={{ padding: '140px 20px 80px' }}>
        <h2>Administrator Access Required</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>
          Only authorized administrators can access the master control suite.
        </p>
        <Link to="/login" className="btn">Sign In as Admin</Link>
      </div>
    );
  }

  return (
    <div className="container dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <BrandLogo size="sm" variant="admin" subtitle="ADMIN CONTROL" to="/admin" />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, width: 'fit-content' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            PostgreSQL Connected
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'overview' ? 'var(--bg-light)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === 'overview' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span><i className="fas fa-chart-pie" style={{ marginRight: '10px', width: '20px' }}></i>Overview & Stats</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('packages')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'packages' ? 'var(--bg-light)' : 'transparent',
                color: activeTab === 'packages' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === 'packages' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span><i className="fas fa-cubes" style={{ marginRight: '10px', width: '20px' }}></i>Master Inventory</span>
              <span className="badge badge-approved" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{packages.length}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('agencies')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'agencies' ? 'var(--bg-light)' : 'transparent',
                color: activeTab === 'agencies' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === 'agencies' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span><i className="fas fa-user-check" style={{ marginRight: '10px', width: '20px' }}></i>Agency Verification</span>
              {pendingAgenciesCount > 0 && (
                <span className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{pendingAgenciesCount}</span>
              )}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('bookings')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'bookings' ? 'var(--bg-light)' : 'transparent',
                color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === 'bookings' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span><i className="fas fa-file-invoice-dollar" style={{ marginRight: '10px', width: '20px' }}></i>Bookings & Ledger</span>
              <span className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{bookings.length}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'users' ? 'var(--bg-light)' : 'transparent',
                color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === 'users' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span><i className="fas fa-users-cog" style={{ marginRight: '10px', width: '20px' }}></i>User Directory</span>
              <span className="badge" style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#e2e8f0' }}>{users.length}</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'settings' ? 'var(--bg-light)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === 'settings' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-sliders-h" style={{ marginRight: '10px', width: '20px' }}></i>Platform Settings
            </button>
          </li>
          <li style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none' }}>
              <i className="fas fa-user-circle" style={{ marginRight: '10px', width: '20px' }}></i>Admin Profile
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px', background: 'white', padding: '20px 25px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>
              {activeTab === 'overview' && 'Executive Overview & Analytics'}
              {activeTab === 'packages' && 'Travel & Hotel Master Inventory'}
              {activeTab === 'agencies' && 'Agency Partner Verifications'}
              {activeTab === 'bookings' && 'Global Bookings & Financial Ledger'}
              {activeTab === 'users' && 'User & Role Management'}
              {activeTab === 'settings' && 'Platform Commission & System Controls'}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Master Admin: <strong>{currentUser.name}</strong> ({currentUser.email})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}>
              <i className="fas fa-file-export"></i> Export CSV
            </button>
            <button onClick={() => setActiveTab('packages')} className="btn" style={{ background: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '0.85rem' }}>
              <i className="fas fa-plus"></i> + Manage Inventory
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>{exportNotice}
          </div>
        )}

        {/* Tab Components */}
        {activeTab === 'overview' && (
          <AdminOverview
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddModal={() => setActiveTab('packages')}
          />
        )}

        {activeTab === 'packages' && (
          <AdminPackages
            packages={packages}
            loading={loading}
            onAddPackage={handleAddPackage}
            onUpdatePackage={handleUpdatePackage}
            onDeletePackage={handleDeletePackage}
            onRefresh={fetchAdminData}
          />
        )}

        {activeTab === 'agencies' && (
          <AdminAgencies
            agencies={agencies}
            loading={loading}
            onVerifyAgency={handleVerifyAgency}
            onRefresh={fetchAdminData}
          />
        )}

        {activeTab === 'bookings' && (
          <AdminBookings
            bookings={bookings}
            loading={loading}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onRefresh={fetchAdminData}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsers
            users={users}
            loading={loading}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings />
        )}
      </main>
    </div>
  );
}
