import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/pages.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="pg-shell">
      <div className="pg-inner">

        {/* Hero */}
        <div className="pg-hero">
          <div className="pg-hero-text">
            <h1>Profile</h1>
            <p>Your account information.</p>
          </div>
        </div>

        <div className="pg-two-col" style={{ alignItems: 'start' }}>

          {/* Identity card */}
          <div className="pg-card">
            <p className="pg-card-title">Account details</p>
            {user ? (
              <div className="pg-field-list">
                <div className="pg-field">
                  <span className="pg-field__label">Full name</span>
                  <span className="pg-field__value">{user.full_name || '—'}</span>
                </div>
                <div className="pg-field">
                  <span className="pg-field__label">Username</span>
                  <span className="pg-field__value">@{user.username}</span>
                </div>
                <div className="pg-field">
                  <span className="pg-field__label">Email</span>
                  <span className="pg-field__value">{user.email}</span>
                </div>
                <div className="pg-field">
                  <span className="pg-field__label">Role</span>
                  <span className="pg-field__value">
                    <span className={`pg-badge ${user.is_dm ? 'pg-badge--blue' : 'pg-badge--gray'}`}>
                      {user.is_dm ? '🎲 Dungeon Master' : '🧑‍🤝‍🧑 Player'}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="pg-empty" style={{ padding: '24px 0' }}>
                <p className="pg-empty__body">No user data available.</p>
              </div>
            )}
          </div>

          {/* Permissions card */}
          <div className="pg-card">
            <p className="pg-card-title">Permissions</p>
            <div className="pg-field-list">
              <div className="pg-field">
                <span className="pg-field__label">Create campaigns</span>
                <span className="pg-field__value">
                  <span className={`pg-badge ${user?.is_dm ? 'pg-badge--green' : 'pg-badge--gray'}`}>
                    {user?.is_dm ? '✓ Allowed' : '✗ DM only'}
                  </span>
                </span>
              </div>
              <div className="pg-field">
                <span className="pg-field__label">Create characters</span>
                <span className="pg-field__value">
                  <span className="pg-badge pg-badge--green">✓ Allowed</span>
                </span>
              </div>
              <div className="pg-field">
                <span className="pg-field__label">Submit homebrew</span>
                <span className="pg-field__value">
                  <span className="pg-badge pg-badge--green">✓ Allowed</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;