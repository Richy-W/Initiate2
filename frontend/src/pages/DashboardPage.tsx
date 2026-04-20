import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import campaignService from '../services/campaignService';
import '../styles/pages.css';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [campaignCount, setCampaignCount] = useState<number | null>(null);

  useEffect(() => {
    campaignService.list().then(c => setCampaignCount(c.length)).catch(() => setCampaignCount(0));
  }, []);

  return (
    <div className="pg-shell">
      <div className="pg-inner">

        {/* Hero */}
        <div className="pg-hero">
          <div className="pg-hero-text">
            <h1>Welcome back{user?.first_name ? `, ${user.first_name}` : user?.username ? `, ${user.username}` : ''}!</h1>
            <p>Your adventure command centre.</p>
          </div>
          <div className="pg-hero-actions">
            <Link to="/characters/create" className="pg-btn pg-btn--primary">⚔️ New Character</Link>
            <Link to="/campaigns" className="pg-btn">🗺️ Campaigns</Link>
          </div>
        </div>

        {/* Stat chips */}
        <div className="pg-stats-row">
          <div className="pg-stat-chip">
            <span className="pg-stat-chip__icon">🗺️</span>
            <span className="pg-stat-chip__value">{campaignCount ?? '—'}</span>
            <span className="pg-stat-chip__label">Campaigns</span>
          </div>
          <div className="pg-stat-chip">
            <span className="pg-stat-chip__icon">📚</span>
            <span className="pg-stat-chip__value">12</span>
            <span className="pg-stat-chip__label">Classes available</span>
          </div>
          <div className="pg-stat-chip">
            <span className="pg-stat-chip__icon">🌿</span>
            <span className="pg-stat-chip__value">11</span>
            <span className="pg-stat-chip__label">Species available</span>
          </div>
          <div className="pg-stat-chip">
            <span className="pg-stat-chip__icon">🧙</span>
            <span className="pg-stat-chip__value">5</span>
            <span className="pg-stat-chip__label">Backgrounds available</span>
          </div>
        </div>

        {/* Two-col */}
        <div className="pg-two-col">
          {/* Quick actions */}
          <div className="pg-card">
            <p className="pg-card-title">Quick actions</p>
            <nav className="pg-action-list" aria-label="Quick actions">
              <Link to="/characters/create" className="pg-action-item">
                <span className="pg-action-item__icon">⚔️</span>
                <span>Create a new character</span>
              </Link>
              <Link to="/campaigns" className="pg-action-item">
                <span className="pg-action-item__icon">🗺️</span>
                <span>Browse your campaigns</span>
              </Link>
              <Link to="/content" className="pg-action-item">
                <span className="pg-action-item__icon">📚</span>
                <span>Browse D&D content</span>
              </Link>
              <Link to="/help" className="pg-action-item">
                <span className="pg-action-item__icon">❓</span>
                <span>Help &amp; documentation</span>
              </Link>
            </nav>
          </div>

          {/* Recent activity */}
          <div className="pg-card">
            <p className="pg-card-title">Recent activity</p>
            <div className="pg-empty" style={{ padding: '32px 0 16px' }}>
              <span className="pg-empty__icon">🕐</span>
              <p className="pg-empty__body">Activity will appear here as you create characters and join campaigns.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;