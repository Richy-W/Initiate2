import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Layout.module.css';

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
    <div className={styles['app-shell']}>
      {/* Skip to main content — keyboard / screen-reader shortcut */}
      <a href="#main-content" className={styles['skip-link']}>Skip to main content</a>

      {/* Navigation */}
      <nav className={styles['top-nav']} aria-label="Primary">
        <div className={styles['top-nav-inner']}>
          <div className={styles['brand-area']}>
            <Link to="/dashboard" className={styles['brand-link']} aria-label="Go to dashboard">
              <span className={styles['brand-mark']} aria-hidden="true">I</span>
              <div className={styles['brand-copy']}>
                <h1 className={styles['brand-title']}>Initiate</h1>
                <p className={styles['brand-subtitle']}>Campaign Companion</p>
              </div>
            </Link>
          </div>

          <div className={styles['top-nav-right']}>
            <ul className={styles['nav-links']} role="list">
                {navigation.map((item) => (
                  <li key={item.name} role="listitem">
                    <Link
                      to={item.href}
                      className={[styles['nav-link'], isActive(item.href) ? styles['active'] : ''].filter(Boolean).join(' ')}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <span className={styles['nav-icon']} aria-hidden="true">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
            </ul>

            <div className={styles['account-controls']}>
              <span className={styles['welcome-text']} aria-live="polite">Welcome, {user?.first_name || user?.username}</span>
              <Link to="/profile" className={styles['account-link']}>Profile</Link>
              <button onClick={logout} className={styles['logout-button']} aria-label="Log out of your account">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className={styles['app-main']} tabIndex={-1}>
        <div className={styles['app-main-inner']}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;