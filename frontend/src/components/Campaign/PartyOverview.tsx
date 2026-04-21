import React from 'react';
import '../../styles/pages.css';
import { CampaignMembership } from '../../types';

interface PartyOverviewProps {
  memberships: CampaignMembership[];
  isDM?: boolean;
  onRemoveMember?: (playerId: string) => void;
}

const PartyOverview: React.FC<PartyOverviewProps> = ({ memberships, isDM, onRemoveMember }) => {
  if (memberships.length === 0) {
    return (
      <div className="pg-card">
        <p className="pg-card-title">Party</p>
        <div className="pg-empty" style={{ padding: '24px 0 8px' }}>
          <span className="pg-empty__icon">🧑‍🤝‍🧑</span>
          <p className="pg-empty__body">No players have joined yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-card">
      <p className="pg-card-title">Party &mdash; {memberships.length} member{memberships.length !== 1 ? 's' : ''}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {memberships.map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--app-bg-2)',
            border: '1px solid var(--app-border)',
            borderRadius: 8,
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--app-ink-0)', fontSize: '0.9rem' }}>{m.player_username}</p>
              {m.character_name && (
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--app-ink-1)' }}>Playing: {m.character_name}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`pg-badge ${
                m.status === 'active' ? 'pg-badge--green' :
                m.status === 'invited' ? 'pg-badge--blue' :
                'pg-badge--gray'
              }`}>
                {m.status}
              </span>
              {isDM && onRemoveMember && m.status === 'active' && (
                <button
                  onClick={() => onRemoveMember(m.player)}
                  className="pg-btn pg-btn--danger pg-btn--sm"
                  style={{ padding: '3px 10px' }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartyOverview;
