import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

/**
 * Navbar — Senior-level responsive travel-platform navigation bar
 * Preserves all authentication flows, role capabilities, and routing.
 */
export default function Navbar({ currentUser, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  // Track scroll position for subtle elevation effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        if (toggleRef.current) toggleRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  // Check if a link is currently active
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogoutClick = () => {
    closeMenu();
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <header className={`site-header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="container nav-container">
        {/* Brand Logo */}
        <div className="nav-brand-wrapper">
          <BrandLogo size="md" onClick={closeMenu} />
        </div>

        {/* Desktop Primary Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <ul className="nav-primary-list">
            <li>
              <Link
                to="/explore"
                className={`nav-link-item ${isActive('/explore') && !isActive('/tours') && !isActive('/hotels') ? 'active' : ''}`}
                aria-current={isActive('/explore') && !isActive('/tours') && !isActive('/hotels') ? 'page' : undefined}
              >
                <i className="fas fa-compass nav-icon"></i>
                <span>Explore</span>
              </Link>
            </li>
            <li>
              <Link
                to="/tours"
                className={`nav-link-item ${isActive('/tours') ? 'active' : ''}`}
                aria-current={isActive('/tours') ? 'page' : undefined}
              >
                <i className="fas fa-map-marked-alt nav-icon"></i>
                <span>Tours</span>
              </Link>
            </li>
            <li>
              <Link
                to="/hotels"
                className={`nav-link-item ${isActive('/hotels') ? 'active' : ''}`}
                aria-current={isActive('/hotels') ? 'page' : undefined}
              >
                <i className="fas fa-hotel nav-icon"></i>
                <span>Hotels</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Desktop Action & Auth Area */}
        <div className="nav-actions-desktop">
          {currentUser ? (
            <div className="nav-user-cluster">
              {/* Role-Specific Action Badge */}
              {currentUser.role === 'admin' && (
                <Link
                  to="/admin"
                  className="nav-action-btn btn-admin-action"
                  title="Master Administrator Suite"
                >
                  <i className="fas fa-shield-halved btn-icon"></i>
                  <span>Admin Panel</span>
                </Link>
              )}

              {currentUser.role === 'agency' && (
                <Link
                  to="/dashboard/agency"
                  className="nav-action-btn btn-agency-action"
                  title="Agency Partner Dashboard"
                >
                  <i className="fas fa-briefcase btn-icon"></i>
                  <span>Agency Hub</span>
                </Link>
              )}

              {currentUser.role === 'traveler' && (
                <Link
                  to="/dashboard/traveler"
                  className="nav-action-btn btn-outline-action"
                  title="View Your Bookings"
                >
                  <i className="fas fa-ticket-alt btn-icon"></i>
                  <span>My Bookings</span>
                </Link>
              )}

              {/* Profile Button */}
              <Link
                to="/profile"
                className={`nav-action-btn btn-profile-action ${isActive('/profile') ? 'active-profile' : ''}`}
                title={`Logged in as ${currentUser.name || currentUser.email}`}
              >
                <i className="fas fa-user-circle btn-icon"></i>
                <span className="profile-name-truncate">{currentUser.name?.split(' ')[0] || 'Profile'}</span>
              </Link>

              {/* Logout Action */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="nav-action-btn btn-logout-action"
                aria-label="Log out from account"
                title="Log out"
              >
                <i className="fas fa-arrow-right-from-bracket btn-icon"></i>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="nav-guest-cluster">
              <Link
                to="/login"
                className="nav-action-btn btn-login-ghost"
              >
                <span>Log In</span>
              </Link>
              <Link
                to="/signup"
                className="nav-action-btn btn-signup-primary"
              >
                <span>Sign Up</span>
                <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem', marginLeft: '6px' }}></i>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          ref={toggleRef}
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="toggle-box">
            <span className={`toggle-line line-1 ${mobileOpen ? 'line-1-open' : ''}`}></span>
            <span className={`toggle-line line-2 ${mobileOpen ? 'line-2-open' : ''}`}></span>
            <span className={`toggle-line line-3 ${mobileOpen ? 'line-3-open' : ''}`}></span>
          </span>
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Side Drawer Panel */}
      <div
        id="mobile-drawer"
        ref={menuRef}
        className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation Drawer"
      >
        <div className="mobile-drawer-header">
          <BrandLogo size="sm" onClick={closeMenu} />
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {currentUser && (
          <div className="mobile-user-card">
            <div className="mobile-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="mobile-user-info">
              <div className="mobile-user-name">{currentUser.name || 'User'}</div>
              <div className="mobile-user-role">
                <span className={`role-badge role-${currentUser.role || 'traveler'}`}>
                  {currentUser.role?.toUpperCase() || 'TRAVELER'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mobile-drawer-content">
          <div className="mobile-nav-group-title">EXPLORE DESTINATIONS</div>
          <ul className="mobile-nav-links">
            <li>
              <Link
                to="/explore"
                onClick={closeMenu}
                className={`mobile-nav-item ${isActive('/explore') && !isActive('/tours') && !isActive('/hotels') ? 'active' : ''}`}
              >
                <div className="mobile-item-icon"><i className="fas fa-compass"></i></div>
                <span>Explore All</span>
              </Link>
            </li>
            <li>
              <Link
                to="/tours"
                onClick={closeMenu}
                className={`mobile-nav-item ${isActive('/tours') ? 'active' : ''}`}
              >
                <div className="mobile-item-icon"><i className="fas fa-map-marked-alt"></i></div>
                <span>Tour Packages</span>
              </Link>
            </li>
            <li>
              <Link
                to="/hotels"
                onClick={closeMenu}
                className={`mobile-nav-item ${isActive('/hotels') ? 'active' : ''}`}
              >
                <div className="mobile-item-icon"><i className="fas fa-hotel"></i></div>
                <span>Luxury Hotels</span>
              </Link>
            </li>
          </ul>

          <div className="mobile-nav-divider"></div>

          {currentUser ? (
            <>
              <div className="mobile-nav-group-title">MY ACCOUNT</div>
              <ul className="mobile-nav-links">
                {currentUser.role === 'admin' && (
                  <li>
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="mobile-nav-item mobile-item-admin"
                    >
                      <div className="mobile-item-icon"><i className="fas fa-shield-halved"></i></div>
                      <span>Admin Control Panel</span>
                    </Link>
                  </li>
                )}

                {currentUser.role === 'agency' && (
                  <li>
                    <Link
                      to="/dashboard/agency"
                      onClick={closeMenu}
                      className="mobile-nav-item mobile-item-agency"
                    >
                      <div className="mobile-item-icon"><i className="fas fa-briefcase"></i></div>
                      <span>Agency Management Hub</span>
                    </Link>
                  </li>
                )}

                {currentUser.role === 'traveler' && (
                  <li>
                    <Link
                      to="/dashboard/traveler"
                      onClick={closeMenu}
                      className="mobile-nav-item"
                    >
                      <div className="mobile-item-icon"><i className="fas fa-ticket-alt"></i></div>
                      <span>My Bookings</span>
                    </Link>
                  </li>
                )}

                <li>
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
                  >
                    <div className="mobile-item-icon"><i className="fas fa-user-gear"></i></div>
                    <span>Account Profile</span>
                  </Link>
                </li>
              </ul>

              <div className="mobile-drawer-footer">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="mobile-logout-btn"
                >
                  <i className="fas fa-arrow-right-from-bracket"></i>
                  <span>Log Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="mobile-guest-actions">
              <Link
                to="/login"
                onClick={closeMenu}
                className="mobile-btn-login"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="mobile-btn-signup"
              >
                Create Free Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
