import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Layout.css';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Characters', href: '/characters', icon: '⚔️' },
    { name: 'Campaigns', href: '/campaigns', icon: '🗺️' },
    { name: 'Content', href: '/content', icon: '📚' },
    { name: 'Help', href: '/help', icon: '❓' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="app-shell">
      {/* Skip to main content — keyboard / screen-reader shortcut */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Navigation */}
      <nav className="top-nav" aria-label="Primary">
        <div className="top-nav-inner">
          <div className="brand-area">
            <Link to="/dashboard" className="brand-link" aria-label="Go to dashboard">
              <span className="brand-mark" aria-hidden="true">I</span>
              <div className="brand-copy">
                <h1 className="brand-title">Initiate</h1>
                <p className="brand-subtitle">Campaign Companion</p>
              </div>
            </Link>
          </div>

          <div className="top-nav-right">
            <ul className="nav-links" role="list">
                {navigation.map((item) => (
                  <li key={item.name} role="listitem">
                    <Link
                      to={item.href}
                      className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
            </ul>

            <div className="account-controls">
              <span className="welcome-text" aria-live="polite">Welcome, {user?.first_name || user?.username}</span>
              <Link to="/profile" className="account-link">Profile</Link>
              <button onClick={logout} className="logout-button" aria-label="Log out of your account">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;