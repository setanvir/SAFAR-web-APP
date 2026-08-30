import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ALL_PACKAGES } from './data/packages';
import { authApi, packagesApi, bookingsApi } from './services/api';
import Navbar from './components/Navbar';
import AdminLayout from './pages/admin/AdminLayout';


// ── Initial Seed Data ──
const INITIAL_USERS = [
  { id: 1, name: 'Main Administrator', email: 'admin@safar.com', role: 'admin', created_at: '2025-01-15' },
  { id: 2, name: 'Oceanic Adventures', email: 'agency@safar.com', role: 'agency', created_at: '2025-02-01' },
  { id: 3, name: 'John Traveler', email: 'traveler@safar.com', role: 'traveler', created_at: '2025-02-10' },
  { id: 4, name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'traveler', created_at: '2025-03-01' }
];

const INITIAL_AGENCIES = [
  { id: 1, user_id: 2, company_name: 'Oceanic Adventures', contact_person: 'David Miller', email: 'agency@safar.com', status: 'verified' },
  { id: 2, user_id: 5, company_name: 'Alpine Horizons Co', contact_person: 'Elena Rostova', email: 'elena@alpine.com', status: 'pending' },
  { id: 3, user_id: 6, company_name: 'Desert Mirage Tours', contact_person: 'Tariq Al-Mansoor', email: 'tariq@desertmirage.com', status: 'pending' }
];

const INITIAL_BOOKINGS = [
  { id: 101, traveler_id: 3, traveler_name: 'John Traveler', traveler_email: 'traveler@safar.com', package_id: 1, package_title: 'Maldives Tropical Retreat', agency_name: 'Oceanic Adventures', price: 1499.00, booking_date: '2026-08-20', status: 'approved', guests: 2 },
  { id: 102, traveler_id: 3, traveler_name: 'John Traveler', traveler_email: 'traveler@safar.com', package_id: 21, package_title: 'The Plaza Hotel', agency_name: 'Oceanic Adventures', price: 450.00, booking_date: '2026-08-24', status: 'pending', guests: 1 },
  { id: 103, traveler_id: 4, traveler_name: 'Sarah Jenkins', traveler_email: 'sarah@example.com', package_id: 2, package_title: 'Bali Sunrise & Waves', agency_name: 'Oceanic Adventures', price: 899.00, booking_date: '2026-08-22', status: 'approved', guests: 2 }
];

export default function App() {
  // Global Live State synced with backend
  const [packages, setPackages] = useState(ALL_PACKAGES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [agencies, setAgencies] = useState(INITIAL_AGENCIES);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safar_current_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  });

  // Fetch live package catalog from API
  const refreshPackages = async () => {
    try {
      const data = await packagesApi.getAll();
      if (data && data.listings && data.listings.length > 0) {
        setPackages(data.listings);
      }
    } catch (err) {
      console.warn('API package sync fallback to local catalog:', err.message);
    }
  };

  useEffect(() => {
    refreshPackages();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('safar_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('safar_current_user');
      localStorage.removeItem('safar_token');
    }
  }, [currentUser]);

  // Handler functions
  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
  };

  const handleUpdateProfile = (updatedData) => {
    setCurrentUser(prev => ({ ...prev, ...updatedData }));
  };

  const handleAddPackage = async (newPkg) => {
    const pkgWithPrice = {
      ...newPkg,
      price: parseFloat(newPkg.price) || 999.00
    };
    try {
      const created = await packagesApi.create(pkgWithPrice);
      setPackages(prev => [created, ...prev]);
      return created;
    } catch (_) {
      const fallback = { ...pkgWithPrice, id: Date.now(), agency: currentUser?.name || 'Authorized Agency' };
      setPackages(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdatePackage = (updatedPkg) => {
    setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
  };

  const handleDeletePackage = (packageId) => {
    setPackages(prev => prev.filter(p => p.id !== packageId));
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      const res = await bookingsApi.reserve({
        package_id: bookingData.package_id,
        guests: bookingData.guests || 1,
        payment_method: bookingData.payment_method || 'demo'
      });
      if (res && res.booking) {
        setBookings(prev => [res.booking, ...prev]);
        return res.booking;
      }
    } catch (err) {
      console.warn('API reservation fallback:', err);
    }
    const newBooking = {
      id: Date.now(),
      traveler_id: currentUser?.id || 999,
      traveler_name: currentUser?.name || bookingData.name || 'Guest Traveler',
      traveler_email: currentUser?.email || bookingData.email || 'guest@example.com',
      package_id: bookingData.package_id,
      package_title: bookingData.package_title,
      agency_name: bookingData.agency_name || 'Oceanic Adventures',
      price: bookingData.price,
      booking_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      guests: bookingData.guests || 1
    };
    setBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  const handleVerifyAgency = (agencyId, newStatus) => {
    setAgencies(prev => prev.map(a => a.id === agencyId ? { ...a, status: newStatus } : a));
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-light)' }}>
        <Navbar currentUser={currentUser} onLogout={handleLogout} />
        
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage packages={packages} />} />
            <Route path="/explore" element={<ExplorePage packages={packages} />} />
            <Route path="/tours" element={<ExplorePage packages={packages} forceType="tour" />} />
            <Route path="/hotels" element={<ExplorePage packages={packages} forceType="hotel" />} />
            <Route path="/package/:id" element={<PackageDetailsPage packages={packages} currentUser={currentUser} onBook={handleCreateBooking} />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage currentUser={currentUser} onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupPage onRegister={(u) => { setCurrentUser(u); }} />} />
            
            {/* User Profile */}
            <Route path="/profile" element={<ProfilePage currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />} />
            
            {/* Role Dashboards */}
            <Route path="/dashboard" element={<TravelerDashboard bookings={bookings} currentUser={currentUser} />} />
            <Route path="/dashboard/traveler" element={<TravelerDashboard bookings={bookings} currentUser={currentUser} />} />
            <Route 
              path="/dashboard/agency" 
              element={
                <AgencyDashboard 
                  packages={packages} 
                  bookings={bookings} 
                  currentUser={currentUser}
                  onAddPackage={handleAddPackage}
                  onUpdatePackage={handleUpdatePackage}
                  onDeletePackage={handleDeletePackage}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                />
              } 
            />
            <Route 
              path="/admin" 
              element={<AdminLayout currentUser={currentUser} />} 
            />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}


// ─────────────────────────────────────────────────────────────
// HOME PAGE WITH SMOOTH HERO SLIDER & ADVANCED SEARCH FORM
// ─────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80'
];

function HomePage({ packages }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dest, setDest] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featuredPackages = packages.slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/explore?';
    if (dest) url += `search=${encodeURIComponent(dest)}&`;
    navigate(url);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-wrapper">
        <div className="hero-slider">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url('${slide}')` }}
            />
          ))}
        </div>
        <div className="hero-overlay" />

        <div className="container hero-content">
          <h1>Discover Your Next Adventure</h1>
          <p>Find the best tour packages from verified agencies worldwide. Book easily, travel safely.</p>

          <div className="hero-search-box">
            <form onSubmit={handleSearch}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>Destination
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Where are you going?"
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <i className="far fa-calendar-alt" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>Check In
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <i className="far fa-calendar-alt" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>Check Out
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <i className="fas fa-user" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>Guests
                  </label>
                  <select
                    className="form-control"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4+ Guests</option>
                  </select>
                </div>
              </div>

              {/* Centered Search Action Button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    minWidth: '220px',
                    height: '48px',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fas fa-search"></i>
                  <span>Search</span>
                </button>
              </div>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/explore?type=hotel')}
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '20px' }}
              >
                <i className="fas fa-bed" style={{ marginRight: '6px' }}></i>Search Near Hotels
              </button>
              <button
                type="button"
                onClick={() => navigate('/explore?search=Paris')}
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '20px' }}
              >
                <i className="fas fa-leaf" style={{ marginRight: '6px' }}></i>Explore Paris Tours
              </button>
              <button
                type="button"
                onClick={() => navigate('/explore?search=Tokyo')}
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '20px' }}
              >
                <i className="fas fa-torii-gate" style={{ marginRight: '6px' }}></i>Explore Tokyo Tours
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Packages Section */}
      <section className="container" style={{ padding: '70px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>TOP DESTINATIONS</span>
            <h2 style={{ fontSize: '2.2rem', marginTop: '5px', fontWeight: 800 }}>Featured Tour Packages</h2>
          </div>
          <Link to="/explore" className="btn btn-outline">View All Listings ({packages.length})</Link>
        </div>

        <div className="packages-grid">
          {featuredPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPLORE PAGE
// ─────────────────────────────────────────────────────────────
function ExplorePage({ packages, forceType = null }) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(forceType || searchParams.get('type') || 'all');
  const [maxPrice, setMaxPrice] = useState(5000);

  useEffect(() => {
    if (forceType) setSelectedType(forceType);
  }, [forceType]);

  const filtered = packages.filter((pkg) => {
    if (selectedType !== 'all' && pkg.type !== selectedType) return false;
    if (pkg.price > maxPrice) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return pkg.title.toLowerCase().includes(q) || pkg.location.toLowerCase().includes(q) || pkg.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="container dashboard-layout">
      {/* Sidebar Filter */}
      <aside className="dashboard-sidebar">
        <h3 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Filter & Search</h3>

        {!forceType && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>LISTING TYPE</label>
            <select className="form-control" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="all">All (Tours & Hotels)</option>
              <option value="tour">Tours Only</option>
              <option value="hotel">Hotels Only</option>
            </select>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>LOCATION / KEYWORD</label>
          <input type="text" className="form-control" placeholder="e.g. Dubai, Paris, Bali..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>MAX PRICE ($)</label>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>${maxPrice}</span>
          </div>
          <input type="range" min="100" max="5000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>$100</span>
            <span>$5000</span>
          </div>
        </div>

        <button onClick={() => { setSearchQuery(''); setSelectedType(forceType || 'all'); setMaxPrice(5000); }} className="btn btn-outline" style={{ width: '100%' }}>
          Reset Filters
        </button>
      </aside>

      {/* Listings Grid */}
      <main className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0, textTransform: 'capitalize' }}>
              {forceType === 'tour' ? 'Tour Packages' : forceType === 'hotel' ? 'Luxury Hotels' : 'Explore All Experiences'}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '5px 0 0' }}>Showing {filtered.length} curated destinations</p>
          </div>
          <span className="badge badge-approved" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
            {filtered.length} Available
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center" style={{ padding: '60px 20px' }}>
            <i className="fas fa-search" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '15px' }}></i>
            <h3>No Listings Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Try relaxing your search terms or expanding the price filter.</p>
          </div>
        ) : (
          <div className="listings-grid">
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PACKAGE CARD COMPONENT
// ─────────────────────────────────────────────────────────────
function PackageCard({ pkg }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      <div
        style={{
          height: '200px',
          backgroundColor: '#cbd5e1',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: `url('${pkg.image_url}'), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70')`,
        }}
      />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            <i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i>{pkg.location}
          </span>
          <span className={`badge ${pkg.type === 'tour' ? 'badge-approved' : 'badge-pending'}`}>
            {pkg.type === 'tour' ? 'Tour' : 'Hotel'}
          </span>
        </div>

        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', fontWeight: 700 }}>{pkg.title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {pkg.description}
        </p>

        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '15px' }}>
          ${parseFloat(pkg.price).toFixed(2)}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {pkg.type === 'hotel' ? 'night' : 'person'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Link to={`/package/${pkg.id}`} className="btn btn-outline" style={{ textAlign: 'center', padding: '10px 5px', fontSize: '0.9rem' }}>
            View Details
          </Link>
          <Link to={`/package/${pkg.id}`} className="btn" style={{ textAlign: 'center', padding: '10px 5px', fontSize: '0.9rem' }}>
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PACKAGE DETAILS PAGE
// ─────────────────────────────────────────────────────────────
function PackageDetailsPage({ packages, currentUser, onBook }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const pkg = packages.find((p) => p.id === parseInt(id) || p.id === id);

  const [guests, setGuests] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!pkg) {
    return (
      <div className="container text-center" style={{ padding: '80px 20px' }}>
        <h2>Destination Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>The travel listing you requested is not available.</p>
        <Link to="/explore" className="btn">Return to Explore</Link>
      </div>
    );
  }

  const totalPrice = (pkg.price * guests).toFixed(2);

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    onBook({
      package_id: pkg.id,
      package_title: pkg.title,
      agency_name: pkg.agency || 'Oceanic Adventures',
      price: parseFloat(totalPrice),
      guests
    });
    setShowModal(false);
    setBookingSuccess(true);
  };

  return (
    <div>
      {/* Hero Banner */}
      <div
        style={{
          height: '420px',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url('${pkg.image_url}'), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70')`,
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '40px'
        }}
      >
        <div className="container" style={{ color: 'white' }}>
          <span className="badge badge-approved" style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'inline-block' }}>
            {pkg.type === 'tour' ? 'Guided Tour Package' : 'Luxury 5-Star Hotel'}
          </span>
          <h1 style={{ fontSize: '2.8rem', margin: '5px 0', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{pkg.title}</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>{pkg.location}
          </p>
        </div>
      </div>

      <div className="container dashboard-layout" style={{ marginTop: '40px' }}>
        {/* Main Details */}
        <main className="dashboard-main">
          {bookingSuccess && (
            <div className="alert alert-success" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Reservation Request Submitted!</strong> Your booking is now pending confirmation.
              </div>
              <Link to="/dashboard/traveler" className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>View My Bookings</Link>
            </div>
          )}

          <div className="card" style={{ padding: '35px', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>About this Experience</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-main)' }}>{pkg.description}</p>

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Key Highlights & Inclusions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-light)', padding: '12px', borderRadius: '8px' }}>
                <i className="fas fa-shield-alt" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                <span>Verified Provider</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-light)', padding: '12px', borderRadius: '8px' }}>
                <i className="fas fa-undo" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                <span>Free Cancellation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-light)', padding: '12px', borderRadius: '8px' }}>
                <i className="fas fa-headset" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                <span>24/7 Concierge Support</span>
              </div>
            </div>
          </div>
        </main>

        {/* Sticky Booking Card */}
        <aside className="dashboard-sidebar" style={{ top: '80px' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              ${pkg.price}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {pkg.type === 'hotel' ? 'night' : 'person'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
              {pkg.type === 'hotel' ? 'NUMBER OF ROOMS / GUESTS' : 'NUMBER OF TRAVELERS'}
            </label>
            <input type="number" min="1" max="10" value={guests} onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <div style={{ background: 'var(--bg-light)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Base Price</span>
              <span>${pkg.price} x {guests}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
              <span>Total Price:</span>
              <span style={{ color: 'var(--primary)' }}>${totalPrice}</span>
            </div>
          </div>

          {currentUser ? (
            <button onClick={() => setShowModal(true)} className="btn" style={{ width: '100%', padding: '15px', fontSize: '1rem', fontWeight: 700 }}>
              Reserve Now
            </button>
          ) : (
            <Link to="/login" className="btn" style={{ width: '100%', padding: '15px', fontSize: '1rem', fontWeight: 700, textAlign: 'center', display: 'block' }}>
              Log In to Book
            </Link>
          )}
        </aside>
      </div>

      {/* Checkout Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Confirm Reservation</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              You are booking <strong>{pkg.title}</strong> for <strong>{guests} {guests > 1 ? 'guests' : 'guest'}</strong> at <strong>${totalPrice}</strong>.
            </p>

            <form onSubmit={handleConfirmBooking}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Payment Option</label>
                <select className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="demo">Demo Travel Wallet (Instant)</option>
                  <option value="credit_card">Credit Card (+2.5% fee)</option>
                  <option value="crypto">Crypto Gateway (USDT/BTC)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE PAGE (AVAILABLE TO ALL ROLES)
// ─────────────────────────────────────────────────────────────
function ProfilePage({ currentUser, onUpdateProfile }) {
  const navigate = useNavigate();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);

  if (!currentUser) {
    return (
      <div className="container text-center" style={{ padding: '140px 20px 80px' }}>
        <h2>Please Log In</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>You must be signed in to view and edit your profile.</p>
        <Link to="/login" className="btn">Go to Login</Link>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({ name, email });
    setMsg('Profile changes saved successfully!');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '130px 20px 60px' }}>
      <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '40px', borderTop: '5px solid var(--primary)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '25px' }}>My Account Profile</h2>

        {msg && <div className="alert alert-success text-center" style={{ marginBottom: '20px' }}>{msg}</div>}

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 800, margin: '0 auto 15px' }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span className={`badge ${currentUser.role === 'admin' ? 'badge-rejected' : currentUser.role === 'agency' ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>
            {currentUser.role} Account
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>FULL NAME</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>NEW PASSWORD (OPTIONAL)</label>
            <input type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRAVELER DASHBOARD
// ─────────────────────────────────────────────────────────────
function TravelerDashboard({ bookings, currentUser }) {
  if (!currentUser) {
    return (
      <div className="container text-center" style={{ padding: '80px 20px' }}>
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>Please log in as a traveler to access your personal dashboard.</p>
        <Link to="/login" className="btn">Sign In</Link>
      </div>
    );
  }

  const myBookings = bookings.filter(b => b.traveler_id === currentUser.id || b.traveler_email === currentUser.email);
  const totalSpent = myBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);
  const upcomingTrips = myBookings.filter(b => b.status === 'approved' || b.status === 'pending').length;

  return (
    <div className="container dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <h3 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Traveler Menu</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <Link to="/dashboard/traveler" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              <i className="fas fa-home" style={{ marginRight: '10px' }}></i>My Bookings
            </Link>
          </li>
          <li>
            <Link to="/explore" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none' }}>
              <i className="fas fa-search" style={{ marginRight: '10px' }}></i>Explore Destinations
            </Link>
          </li>
          <li>
            <Link to="/profile" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none' }}>
              <i className="fas fa-user-cog" style={{ marginRight: '10px' }}></i>Edit Profile
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Traveler Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Welcome back, <strong>{currentUser.name}</strong>!</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '25px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Total Bookings</h4>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>{myBookings.length}</div>
          </div>
          <div className="card" style={{ padding: '25px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Active / Upcoming Trips</h4>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '8px' }}>{upcomingTrips}</div>
          </div>
          <div className="card" style={{ padding: '25px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Total Investment</h4>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>${totalSpent.toFixed(2)}</div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="card" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '20px' }}>My Reservation History</h2>

          {myBookings.length === 0 ? (
            <div className="text-center" style={{ padding: '40px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>You have not booked any tours or hotels yet.</p>
              <Link to="/explore" className="btn">Explore Travel Packages</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Package / Experience</th>
                    <th>Provider Agency</th>
                    <th>Booking Date</th>
                    <th>Guests</th>
                    <th>Total Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.package_title}</td>
                      <td>{b.agency_name}</td>
                      <td>{b.booking_date}</td>
                      <td>{b.guests || 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(b.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${b.status === 'approved' ? 'badge-approved' : b.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AGENCY DASHBOARD (FULL TOUR ADD / DELETE / EDIT & BOOKING MGMT)
// ─────────────────────────────────────────────────────────────
function AgencyDashboard({ packages, bookings, currentUser, onAddPackage, onUpdatePackage, onDeletePackage, onUpdateBookingStatus }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'tour',
    location: '',
    price: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
    duration_days: 5,
    room_type: 'Luxury Suite'
  });

  if (!currentUser || (currentUser.role !== 'agency' && currentUser.role !== 'admin')) {
    return (
      <div className="container text-center" style={{ padding: '140px 20px 80px' }}>
        <h2>Agency Portal Restricted</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>You need an Agency or Admin account to access this management dashboard.</p>
        <Link to="/login" className="btn">Sign In as Agency</Link>
      </div>
    );
  }

  const myPackages = packages.filter(p => currentUser.role === 'admin' || p.agency === currentUser.name || !p.agency);
  const myBookings = bookings;
  const pendingRequests = myBookings.filter(b => b.status === 'pending');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onAddPackage({
      ...formData,
      price: parseFloat(formData.price) || 999.00
    });
    setShowAddModal(false);
    setFormData({
      title: '',
      type: 'tour',
      location: '',
      price: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
      duration_days: 5,
      room_type: 'Luxury Suite'
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editPkg) {
      onUpdatePackage({
        ...editPkg,
        price: parseFloat(editPkg.price) || 999.00
      });
      setEditPkg(null);
    }
  };

  return (
    <div className="container dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <h3 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Agency Hub</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <a href="#packages-section" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              <i className="fas fa-cubes" style={{ marginRight: '10px' }}></i>Manage Packages
            </a>
          </li>
          <li>
            <a href="#bookings-section" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none' }}>
              <i className="fas fa-list-alt" style={{ marginRight: '10px' }}></i>Booking Requests
            </a>
          </li>
          <li>
            <Link to="/profile" style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none' }}>
              <i className="fas fa-building" style={{ marginRight: '10px' }}></i>Agency Profile
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Agency Management Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Provider: <strong>{currentUser.name}</strong></p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-plus"></i> + Add Tour / Hotel
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '35px' }}>
          <div className="card" style={{ padding: '25px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Active Listings</h4>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>{myPackages.length}</div>
          </div>
          <div className="card" style={{ padding: '25px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Pending Requests</h4>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>{pendingRequests.length}</div>
          </div>
          <div className="card" style={{ padding: '25px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Total Received</h4>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '8px' }}>{myBookings.length}</div>
          </div>
        </div>

        {/* Bookings Section */}
        <div id="bookings-section" className="card" style={{ padding: '30px', marginBottom: '35px' }}>
          <h2 style={{ marginBottom: '20px' }}>Recent Booking Requests</h2>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Traveler</th>
                  <th>Destination / Package</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.traveler_name}</strong><br />
                      <small style={{ color: 'var(--text-muted)' }}>{b.traveler_email}</small>
                    </td>
                    <td>{b.package_title}</td>
                    <td>{b.booking_date}</td>
                    <td style={{ fontWeight: 700 }}>${parseFloat(b.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${b.status === 'approved' ? 'badge-approved' : b.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {b.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => onUpdateBookingStatus(b.id, 'approved')} className="btn" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#10b981' }}>Approve</button>
                          <button onClick={() => onUpdateBookingStatus(b.id, 'rejected')} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Package Listings CRUD Section */}
        <div id="packages-section" className="card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>My Travel Inventory ({myPackages.length})</h2>
            <button onClick={() => setShowAddModal(true)} className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>+ Create New</button>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Title & Location</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myPackages.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong><br />
                      <small style={{ color: 'var(--text-muted)' }}>{p.location}</small>
                    </td>
                    <td>
                      <span className={`badge ${p.type === 'tour' ? 'badge-approved' : 'badge-pending'}`}>{p.type}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${p.price}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/package/${p.id}`} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }} title="Preview">
                          <i className="fas fa-eye"></i>
                        </Link>
                        <button onClick={() => setEditPkg({ ...p })} className="btn" style={{ background: '#0284c7', padding: '4px 8px', fontSize: '0.8rem' }} title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => { if (window.confirm(`Are you sure you want to delete "${p.title}"?`)) onDeletePackage(p.id); }} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Tour/Hotel Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Create New Listing</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Type</label>
                  <select className="form-control" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="tour">Tour Package</option>
                    <option value="hotel">Luxury Hotel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Price ($ USD)</label>
                  <input type="number" required placeholder="e.g. 1200" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Title</label>
                <input type="text" required placeholder="e.g. Golden Coast Luxury Tour" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Destination / City & Country</label>
                <input type="text" required placeholder="e.g. Rome, Italy" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Cover Image URL</label>
                <input type="url" required value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Detailed Description</label>
                <textarea rows="4" required placeholder="Describe the itinerary, luxury amenities, and experiences..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Publish Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tour/Hotel Modal */}
      {editPkg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Edit Listing #{editPkg.id}</h2>
              <button onClick={() => setEditPkg(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Type</label>
                  <select className="form-control" value={editPkg.type} onChange={(e) => setEditPkg({ ...editPkg, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="tour">Tour Package</option>
                    <option value="hotel">Luxury Hotel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Price ($ USD)</label>
                  <input type="number" required value={editPkg.price} onChange={(e) => setEditPkg({ ...editPkg, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Title</label>
                <input type="text" required value={editPkg.title} onChange={(e) => setEditPkg({ ...editPkg, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Location</label>
                <input type="text" required value={editPkg.location} onChange={(e) => setEditPkg({ ...editPkg, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Cover Image URL</label>
                <input type="url" required value={editPkg.image_url} onChange={(e) => setEditPkg({ ...editPkg, image_url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Description</label>
                <textarea rows="4" required value={editPkg.description} onChange={(e) => setEditPkg({ ...editPkg, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditPkg(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN PANEL (ENTERPRISE MASTER CONTROL SUITE)
// ─────────────────────────────────────────────────────────────
function AdminPanel({ packages, users, agencies, bookings, currentUser, onAddPackage, onUpdatePackage, onDeletePackage, onVerifyAgency, onUpdateBookingStatus }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [exportNotice, setExportNotice] = useState(null);

  // Platform settings state
  const [commissionRate, setCommissionRate] = useState(12.5);
  const [platformCurrency, setPlatformCurrency] = useState('USD ($)');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    type: 'tour',
    location: '',
    price: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
    duration_days: 6,
    room_type: 'Deluxe Suite'
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container text-center" style={{ padding: '140px 20px 80px' }}>
        <h2>Administrator Access Required</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>Only system administrators can access the master control panel.</p>
        <Link to="/login" className="btn">Sign In as Admin</Link>
      </div>
    );
  }

  // Analytics Computations
  const totalRevenue = bookings.reduce((sum, b) => b.status === 'approved' ? sum + (parseFloat(b.price) || 0) : sum, 0);
  const totalTours = packages.filter(p => p.type === 'tour').length;
  const totalHotels = packages.filter(p => p.type === 'hotel').length;
  const pendingAgencies = agencies.filter(a => a.status === 'pending');
  const verifiedAgencies = agencies.filter(a => a.status === 'verified');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');

  // Filtered packages
  const filteredPackages = packages.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || (p.agency && p.agency.toLowerCase().includes(q));
    }
    return true;
  });

  // Handlers
  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddPackage({
      ...formData,
      price: parseFloat(formData.price) || 999.00
    });
    setShowAddModal(false);
    setFormData({
      title: '',
      type: 'tour',
      location: '',
      price: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
      duration_days: 6,
      room_type: 'Deluxe Suite'
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editPkg) {
      onUpdatePackage({
        ...editPkg,
        price: parseFloat(editPkg.price) || 999.00
      });
      setEditPkg(null);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Title,Type,Location,Price,Agency\n"
      + packages.map(p => `"${p.id}","${p.title}","${p.type}","${p.location}","${p.price}","${p.agency || 'SAFAR'}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `safar_master_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Export Complete! Master inventory CSV downloaded.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="container dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            <i className="fas fa-shield-alt"></i>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>SAFAR Admin</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>● System Online</div>
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <button 
              onClick={() => setActiveTab('overview')} 
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '8px', border: 'none', background: activeTab === 'overview' ? 'var(--bg-light)' : 'transparent', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-main)', fontWeight: activeTab === 'overview' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}
            >
              <span><i className="fas fa-chart-pie" style={{ marginRight: '10px', width: '20px' }}></i>Overview & Stats</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('packages')} 
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '8px', border: 'none', background: activeTab === 'packages' ? 'var(--bg-light)' : 'transparent', color: activeTab === 'packages' ? 'var(--primary)' : 'var(--text-main)', fontWeight: activeTab === 'packages' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}
            >
              <span><i className="fas fa-cubes" style={{ marginRight: '10px', width: '20px' }}></i>Tour & Hotel Inventory</span>
              <span className="badge badge-approved" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{packages.length}</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('agencies')} 
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '8px', border: 'none', background: activeTab === 'agencies' ? 'var(--bg-light)' : 'transparent', color: activeTab === 'agencies' ? 'var(--primary)' : 'var(--text-main)', fontWeight: activeTab === 'agencies' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}
            >
              <span><i className="fas fa-user-check" style={{ marginRight: '10px', width: '20px' }}></i>Agency Verification</span>
              {pendingAgencies.length > 0 && (
                <span className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{pendingAgencies.length}</span>
              )}
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('bookings')} 
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '8px', border: 'none', background: activeTab === 'bookings' ? 'var(--bg-light)' : 'transparent', color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-main)', fontWeight: activeTab === 'bookings' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}
            >
              <span><i className="fas fa-file-invoice-dollar" style={{ marginRight: '10px', width: '20px' }}></i>Bookings & Ledger</span>
              <span className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{bookings.length}</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('users')} 
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '8px', border: 'none', background: activeTab === 'users' ? 'var(--bg-light)' : 'transparent', color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-main)', fontWeight: activeTab === 'users' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}
            >
              <span><i className="fas fa-users-cog" style={{ marginRight: '10px', width: '20px' }}></i>User Directory</span>
              <span className="badge" style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#e2e8f0' }}>{users.length}</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('settings')} 
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '8px', border: 'none', background: activeTab === 'settings' ? 'var(--bg-light)' : 'transparent', color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-main)', fontWeight: activeTab === 'settings' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}
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

      {/* Main Panel Content */}
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
            <button onClick={() => setShowAddModal(true)} className="btn" style={{ background: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '0.85rem' }}>
              <i className="fas fa-plus"></i> + Add Tour / Hotel
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>{exportNotice}
          </div>
        )}

        {/* ── TAB 1: OVERVIEW & ANALYTICS ── */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="card" style={{ padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Gross Revenue</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                  <i className="fas fa-arrow-up" style={{ marginRight: '4px' }}></i>+14.2% from last month
                </div>
              </div>

              <div className="card" style={{ padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Bookings</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>{bookings.length}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    <i className="fas fa-ticket-alt"></i>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {approvedBookings.length} Approved • {pendingBookings.length} Pending
                </div>
              </div>

              <div className="card" style={{ padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Inventory</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>{packages.length}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    <i className="fas fa-globe-americas"></i>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {totalTours} Tours • {totalHotels} Luxury Hotels
                </div>
              </div>

              <div className="card" style={{ padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Agency Network</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>{verifiedAgencies.length}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    <i className="fas fa-building"></i>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: pendingAgencies.length > 0 ? '#b45309' : '#166534', fontWeight: 600 }}>
                  {pendingAgencies.length} pending verifications
                </div>
              </div>
            </div>

            {/* Analytics Breakdown & Progress */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '30px' }}>
              <div className="card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem' }}>Listing Distribution</h3>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <span>Tour Packages ({totalTours})</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((totalTours / packages.length) * 100)}%</span>
                  </div>
                  <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${(totalTours / packages.length) * 100}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <span>Luxury Hotels ({totalHotels})</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((totalHotels / packages.length) * 100)}%</span>
                  </div>
                  <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${(totalHotels / packages.length) * 100}%`, height: '100%', background: '#0284c7' }} />
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem' }}>Booking Status Breakdown</h3>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '10px', flex: 1 }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534' }}>{approvedBookings.length}</div>
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Approved</div>
                  </div>
                  <div style={{ padding: '15px', background: '#fefce8', borderRadius: '10px', flex: 1 }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#854d0e' }}>{pendingBookings.length}</div>
                    <div style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 600 }}>Pending</div>
                  </div>
                  <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '10px', flex: 1 }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991b1b' }}>{bookings.filter(b => b.status === 'rejected').length}</div>
                    <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>Rejected</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="card" style={{ padding: '30px' }}>
              <h3 style={{ margin: '0 0 15px', fontSize: '1.15rem' }}>Quick Administrator Actions</h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button onClick={() => { setActiveTab('packages'); setShowAddModal(true); }} className="btn" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>Add New Tour Package
                </button>
                <button onClick={() => { setActiveTab('agencies'); }} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  <i className="fas fa-building" style={{ marginRight: '8px' }}></i>Review Pending Agencies ({pendingAgencies.length})
                </button>
                <button onClick={() => { setActiveTab('bookings'); }} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  <i className="fas fa-receipt" style={{ marginRight: '8px' }}></i>Moderate Recent Bookings
                </button>
                <button onClick={handleExportCSV} className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  <i className="fas fa-download" style={{ marginRight: '8px' }}></i>Download Master Inventory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PACKAGES INVENTORY FULL CRUD ── */}
        {activeTab === 'packages' && (
          <div className="card" style={{ padding: '30px' }}>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by title, country, or agency..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <select 
                  className="form-control" 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)} 
                  style={{ width: '160px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="all">All Types</option>
                  <option value="tour">Tours Only</option>
                  <option value="hotel">Hotels Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Found {filteredPackages.length} items</span>
                <button onClick={() => setShowAddModal(true)} className="btn" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
                  + Add Listing
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Cover</th>
                    <th>Title & Destination</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Provider Agency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((p) => (
                    <tr key={p.id}>
                      <td style={{ width: '60px' }}>
                        <img 
                          src={p.image_url} 
                          alt={p.title} 
                          style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70'; }}
                        />
                      </td>
                      <td>
                        <strong>{p.title}</strong><br />
                        <small style={{ color: 'var(--text-muted)' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>{p.location}</small>
                      </td>
                      <td>
                        <span className={`badge ${p.type === 'tour' ? 'badge-approved' : 'badge-pending'}`}>
                          {p.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>${parseFloat(p.price).toFixed(2)}</td>
                      <td><span style={{ fontSize: '0.85rem' }}>{p.agency || 'SAFAR Verified'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link to={`/package/${p.id}`} className="btn btn-outline" style={{ padding: '5px 8px', fontSize: '0.8rem' }} title="Preview">
                            <i className="fas fa-eye"></i>
                          </Link>
                          <button onClick={() => setEditPkg({ ...p })} className="btn" style={{ background: '#0284c7', padding: '5px 8px', fontSize: '0.8rem' }} title="Edit">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => { if (window.confirm(`Admin: Permanently delete "${p.title}"?`)) onDeletePackage(p.id); }} className="btn btn-danger" style={{ padding: '5px 8px', fontSize: '0.8rem' }} title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: AGENCIES APPROVALS ── */}
        {activeTab === 'agencies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Pending Agency Applications ({pendingAgencies.length})</h2>
                <span className="badge badge-pending">Requires Admin Review</span>
              </div>

              {pendingAgencies.length === 0 ? (
                <div className="text-center" style={{ padding: '30px 0', color: 'var(--text-muted)' }}>
                  <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '10px' }}></i>
                  <p>All travel agency applications have been reviewed and verified.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Contact Representative</th>
                        <th>Official Email</th>
                        <th>Status</th>
                        <th>Decision Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAgencies.map((a) => (
                        <tr key={a.id}>
                          <td><strong>{a.company_name}</strong></td>
                          <td>{a.contact_person || 'Representative'}</td>
                          <td>{a.email}</td>
                          <td><span className="badge badge-pending">PENDING VERIFICATION</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => onVerifyAgency(a.id, 'verified')} className="btn" style={{ background: '#10b981', padding: '6px 14px', fontSize: '0.85rem' }}>
                                <i className="fas fa-check" style={{ marginRight: '5px' }}></i>Approve & Verify
                              </button>
                              <button onClick={() => onVerifyAgency(a.id, 'rejected')} className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                                <i className="fas fa-times" style={{ marginRight: '5px' }}></i>Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '20px' }}>Verified Partner Agencies ({verifiedAgencies.length})</h2>
              <div className="table-responsive">
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Partner Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedAgencies.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.company_name}</strong></td>
                        <td>{a.contact_person || 'Verified Representative'}</td>
                        <td>{a.email}</td>
                        <td><span className="badge badge-approved">VERIFIED PARTNER</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: BOOKINGS & FINANCIAL LEDGER ── */}
        {activeTab === 'bookings' && (
          <div className="card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Global Bookings & Financial Ledger</h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>Real-time transaction history and booking statuses</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span className="badge badge-approved" style={{ padding: '6px 14px' }}>Gross: ${totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Traveler Details</th>
                    <th>Reserved Destination</th>
                    <th>Agency</th>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>#{b.id}</code></td>
                      <td>
                        <strong>{b.traveler_name}</strong><br />
                        <small style={{ color: 'var(--text-muted)' }}>{b.traveler_email}</small>
                      </td>
                      <td><strong>{b.package_title}</strong></td>
                      <td>{b.agency_name}</td>
                      <td>{b.booking_date}</td>
                      <td>{b.guests || 1}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>${parseFloat(b.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${b.status === 'approved' ? 'badge-approved' : b.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => onUpdateBookingStatus(b.id, 'approved')} className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#10b981' }} title="Approve">
                                <i className="fas fa-check"></i>
                              </button>
                              <button onClick={() => onUpdateBookingStatus(b.id, 'rejected')} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} title="Reject">
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}
                          <button onClick={() => setSelectedReceipt(b)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} title="View Receipt">
                            <i className="fas fa-receipt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: USER MANAGEMENT ── */}
        {activeTab === 'users' && (
          <div className="card" style={{ padding: '30px' }}>
            <h2 style={{ marginBottom: '20px' }}>Registered Platform Users ({users.length})</h2>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Account Role</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-rejected' : u.role === 'agency' ? 'badge-pending' : 'badge-approved'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{u.created_at || '2025-01-01'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 6: PLATFORM SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="card" style={{ padding: '35px', maxWidth: '700px' }}>
            <h2 style={{ marginBottom: '20px' }}>Platform Commission & System Controls</h2>

            {settingsSaved && (
              <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                Platform configuration saved successfully!
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  DEFAULT PLATFORM COMMISSION RATE (%)
                </label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={commissionRate} 
                  onChange={(e) => setCommissionRate(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  SYSTEM CURRENCY
                </label>
                <select 
                  className="form-control" 
                  value={platformCurrency} 
                  onChange={(e) => setPlatformCurrency(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="USD ($)">USD - US Dollar ($)</option>
                  <option value="EUR (€)">EUR - Euro (€)</option>
                  <option value="GBP (£)">GBP - British Pound (£)</option>
                  <option value="BDT (৳)">BDT - Bangladeshi Taka (৳)</option>
                </select>
              </div>

              <button type="submit" className="btn" style={{ padding: '12px 24px', fontWeight: 700 }}>
                Save System Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ── MODAL 1: ADD PACKAGE MODAL ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', padding: '35px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Add New Tour or Hotel Listing</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Category</label>
                  <select className="form-control" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="tour">Tour Package</option>
                    <option value="hotel">Luxury Hotel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Price ($ USD)</label>
                  <input type="number" required placeholder="e.g. 1450" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Title</label>
                <input type="text" required placeholder="e.g. Mediterranean Coastal Escape" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Destination Location</label>
                <input type="text" required placeholder="e.g. Santorini, Greece" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Cover Photo URL</label>
                <input type="url" required value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                {formData.image_url && (
                  <div style={{ marginTop: '8px', height: '100px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0' }}>
                    <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70'; }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Detailed Overview</label>
                <textarea rows="4" required placeholder="Provide an exciting description of the tour itinerary or hotel features..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1, background: '#dc2626' }}>Publish Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT PACKAGE MODAL ── */}
      {editPkg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', padding: '35px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Edit Listing #{editPkg.id}</h2>
              <button onClick={() => setEditPkg(null)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Type</label>
                  <select className="form-control" value={editPkg.type} onChange={(e) => setEditPkg({ ...editPkg, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="tour">Tour Package</option>
                    <option value="hotel">Luxury Hotel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Price ($ USD)</label>
                  <input type="number" required value={editPkg.price} onChange={(e) => setEditPkg({ ...editPkg, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Title</label>
                <input type="text" required value={editPkg.title} onChange={(e) => setEditPkg({ ...editPkg, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Location</label>
                <input type="text" required value={editPkg.location} onChange={(e) => setEditPkg({ ...editPkg, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Cover Image URL</label>
                <input type="url" required value={editPkg.image_url} onChange={(e) => setEditPkg({ ...editPkg, image_url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Description</label>
                <textarea rows="4" required value={editPkg.description} onChange={(e) => setEditPkg({ ...editPkg, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditPkg(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: BOOKING RECEIPT INVOICE MODAL ── */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '35px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>SAFAR INVOICE</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Booking Reference #{selectedReceipt.id}</div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Traveler:</span>
                <strong>{selectedReceipt.traveler_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span>{selectedReceipt.traveler_email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Experience:</span>
                <strong>{selectedReceipt.package_title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider Agency:</span>
                <span>{selectedReceipt.agency_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reservation Date:</span>
                <span>{selectedReceipt.booking_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Guests:</span>
                <span>{selectedReceipt.guests || 1} Person(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '1.2rem', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>${parseFloat(selectedReceipt.price).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => { window.print(); }} className="btn" style={{ width: '100%' }}>
              <i className="fas fa-print" style={{ marginRight: '8px' }}></i>Print Official Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH: LOGIN PAGE (CONNECTED TO POSTGRESQL & JWT)
// ─────────────────────────────────────────────────────────────
function LoginPage({ currentUser, onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    return searchParams.get('expired') ? 'Your session has expired. Please log in again.' : null;
  });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') navigate('/admin');
      else if (currentUser.role === 'agency') navigate('/dashboard/agency');
      else navigate('/dashboard/traveler');
    }
  }, [currentUser, navigate]);

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(demoEmail, demoPassword);
      if (res && res.user) {
        onLogin(res.user);
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'agency') navigate('/dashboard/agency');
        else navigate('/dashboard/traveler');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(email.trim(), password);
      if (res && res.user) {
        onLogin(res.user);
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'agency') navigate('/dashboard/agency');
        else navigate('/dashboard/traveler');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '40px', borderTop: '5px solid var(--primary)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>Log In to SAFAR</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>Select a 1-click role or enter verified credentials.</p>

        {/* 1-Click Quick Demo Login Switcher */}
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            ⚡ 1-Click Quick Sign In
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@safar.com', 'admin123')}
              className="btn"
              style={{ padding: '8px 4px', fontSize: '0.78rem', background: '#dc2626', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <i className="fas fa-shield-alt"></i>
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('agency@safar.com', 'agency123')}
              className="btn"
              style={{ padding: '8px 4px', fontSize: '0.78rem', background: '#8b5cf6', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <i className="fas fa-building"></i>
              <span>Agency</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('traveler@safar.com', 'traveler123')}
              className="btn"
              style={{ padding: '8px 4px', fontSize: '0.78rem', background: '#0284c7', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <i className="fas fa-user"></i>
              <span>Traveler</span>
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
            <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>PASSWORD</label>
            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <button type="submit" disabled={loading} className="btn" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}>
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH: SIGNUP PAGE (CONNECTED TO POSTGRESQL)
// ─────────────────────────────────────────────────────────────
function SignupPage({ onRegister }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('traveler');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role
      });
      if (res && res.user) {
        onRegister(res.user);
        if (role === 'agency') navigate('/dashboard/agency');
        else navigate('/dashboard/traveler');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px', borderTop: '5px solid var(--primary)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>Create an Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.95rem' }}>Join SAFAR to book tours or list your agency offerings.</p>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>I WANT TO JOIN AS A</label>
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
              <option value="traveler">Traveler / Tourist (Book Experiences)</option>
              <option value="agency">Travel Agency / Hotel (Publish Listings)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>FULL NAME / COMPANY NAME</label>
            <input type="text" required placeholder="e.g. John Doe or Oceanic Travel" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL ADDRESS</label>
            <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>PASSWORD</label>
            <input type="password" required minLength="6" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
          </div>

          <button type="submit" disabled={loading} className="btn" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer" style={{ background: '#FF7D4B', color: 'white', padding: '50px 0 25px', marginTop: '60px' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginBottom: '40px' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px', color: 'white' }}>SAFAR</h3>
          <p style={{ opacity: 0.9, lineHeight: 1.6, fontSize: '0.95rem' }}>
            Your ultimate travel and holiday reservation companion. Crafting unforgettable memories across global destinations.
          </p>
        </div>
        <div>
          <h4 style={{ marginBottom: '15px', color: 'white' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2, fontSize: '0.95rem' }}>
            <li><Link to="/explore" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Explore All</Link></li>
            <li><Link to="/tours" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Tour Packages</Link></li>
            <li><Link to="/hotels" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Luxury Hotels</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '15px', color: 'white' }}>Portals</h4>
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2, fontSize: '0.95rem' }}>
            <li><Link to="/dashboard/traveler" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Traveler Bookings</Link></li>
            <li><Link to="/dashboard/agency" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Agency Dashboard</Link></li>
            <li><Link to="/admin" style={{ color: 'white', textDecoration: 'none', opacity: 0.9 }}>Admin Master Panel</Link></li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', opacity: 0.85 }}>
        &copy; {new Date().getFullYear()} SAFAR Travel Network. All rights reserved.
      </div>
    </footer>
  );
}
