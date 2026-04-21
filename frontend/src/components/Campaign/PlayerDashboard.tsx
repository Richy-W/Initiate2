import React, { useState } from 'react';
import '../../styles/pages.css';
import { Campaign } from '../../types';
import campaignService from '../../services/campaignService';

interface PlayerDashboardProps {
  campaign: Campaign;
  userId: string;
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ campaign, userId }) => {
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDM = campaign.dm === userId;

  const handleLeave = async () => {
    if (!window.confirm(`Leave campaign "${campaign.name}"?`)) return;
    setLeaving(true);
    setError(null);
    try {
      await campaignService.leave(campaign.id);
      window.location.href = '/campaigns';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to leave campaign.');
      setLeaving(false);
    }
  };

  return (
    <div className="pg-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p className="pg-card-title" style={{ marginBottom: 4 }}>Campaign overview</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--app-ink-1)' }}>DM: <strong style={{ color: 'var(--app-ink-0)' }}>{campaign.dm_username}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: campaign.description ? 16 : 0 }}>
        <div className="pg-stat-chip" style={{ padding: '12px 14px' }}>
          <span className="pg-stat-chip__value" style={{ fontSize: '1.4rem' }}>{campaign.member_count}</span>
          <span className="pg-stat-chip__label">Players</span>
        </div>
        <div className="pg-stat-chip" style={{ padding: '12px 14px' }}>
          <span className="pg-stat-chip__value" style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{campaign.encumbrance_rules || '—'}</span>
          <span className="pg-stat-chip__label">Encumbrance</span>
        </div>
        <div className="pg-stat-chip" style={{ padding: '12px 14px' }}>
          <span className="pg-stat-chip__value" style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{campaign.rule_validation || '—'}</span>
          <span className="pg-stat-chip__label">Rules</span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(214,71,98,0.12)', border: '1px solid rgba(214,71,98,0.35)', borderRadius: 8, padding: '10px 14px', color: '#f07286', fontSize: '0.875rem', marginTop: 12 }}>{error}</div>
      )}

      {!isDM && (
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="pg-btn pg-btn--danger pg-btn--sm"
          style={{ marginTop: 16 }}
        >
          {leaving ? 'Leaving…' : 'Leave Campaign'}
        </button>
      )}
    </div>
  );
};

export default PlayerDashboard;
