import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Campaign, CampaignInvitation } from '../../types';
import campaignService from '../../services/campaignService';
import CreateCampaign from '../../components/Campaign/CreateCampaign';
import '../../styles/pages.css';

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<CampaignInvitation[]>([]);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadInvites = useCallback(() => {
    campaignService.getMyInvitations().then(setPendingInvites).catch(() => {});
  }, []);

  useEffect(() => {
    campaignService.list().then(data => {
      setCampaigns(data);
      setLoading(false);
    }).catch(() => setLoading(false));
    loadInvites();
  }, [loadInvites]);

  const handleAcceptInvite = async (invite: CampaignInvitation) => {
    setInviteLoading(invite.id);
    try {
      await campaignService.acceptInvitation(invite.campaign, invite.token);
      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
      // Reload campaigns so the newly joined one appears
      const updated = await campaignService.list();
      setCampaigns(updated);
    } catch {
      // ignore
    } finally {
      setInviteLoading(null);
    }
  };

  const handleDeclineInvite = async (invite: CampaignInvitation) => {
    setInviteLoading(invite.id);
    try {
      await campaignService.declineInvitation(invite.campaign, invite.token);
      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch {
      // ignore
    } finally {
      setInviteLoading(null);
    }
  };

  const handleCreated = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
    setShowCreate(false);
    navigate(`/campaigns/${campaign.id}`);
  };

  if (showCreate) {
    return (
      <div className="pg-shell">
        <div className="pg-inner">
          <CreateCampaign onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
        </div>
      </div>
    );
  }

  const active = campaigns.filter(c => c.is_active);
  const inactive = campaigns.filter(c => !c.is_active);

  return (
    <div className="pg-shell">
      <div className="pg-inner">

        {/* Hero */}
        <div className="pg-hero">
          <div className="pg-hero-text">
            <h1>Campaigns</h1>
            <p>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} in your library</p>
          </div>
          <div className="pg-hero-actions">
            <button className="pg-btn pg-btn--secondary" onClick={() => setShowJoinModal(true)}>
              Enter Invite Code
            </button>
            <button className="pg-btn pg-btn--primary" onClick={() => setShowCreate(true)}>
              + New Campaign
            </button>
          </div>
        </div>

        {/* Join with Code Modal */}
        {showJoinModal && (
          <JoinWithCodeModal
            onClose={() => setShowJoinModal(false)}
            onJoined={async (campaignId) => {
              setShowJoinModal(false);
              const updated = await campaignService.list();
              setCampaigns(updated);
              navigate(`/campaigns/${campaignId}`);
            }}
          />
        )}

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <section>
            <p className="pg-section-label">Pending Invitations</p>
            <div className="pg-invite-list">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="pg-invite-card">
                  <div className="pg-invite-card__info">
                    <span className="pg-invite-card__name">{invite.campaign_name}</span>
                    <span className="pg-invite-card__from">
                      Invited by <strong>{invite.invited_by_username}</strong>
                    </span>
                    {invite.message && (
                      <span className="pg-invite-card__msg">"{invite.message}"</span>
                    )}
                  </div>
                  <div className="pg-invite-card__actions">
                    <button
                      className="pg-btn pg-btn--primary pg-btn--sm"
                      disabled={inviteLoading === invite.id}
                      onClick={() => handleAcceptInvite(invite)}
                    >
                      {inviteLoading === invite.id ? '…' : 'Accept'}
                    </button>
                    <button
                      className="pg-btn pg-btn--secondary pg-btn--sm"
                      disabled={inviteLoading === invite.id}
                      onClick={() => handleDeclineInvite(invite)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="pg-loading">
            <div className="pg-pulse-row">
              {[300, 240, 300].map((w, i) => (
                <div key={i} className="pg-pulse" style={{ width: w, height: 120 }} />
              ))}
            </div>
            Loading campaigns…
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="pg-card">
            <div className="pg-empty">
              <span className="pg-empty__icon">🗺️</span>
              <h3 className="pg-empty__title">No campaigns yet</h3>
              <p className="pg-empty__body">Create your first campaign as a DM, or use an invite code from a DM to join one.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="pg-btn pg-btn--secondary" onClick={() => setShowJoinModal(true)}>
                  Enter Invite Code
                </button>
                <button className="pg-btn pg-btn--primary" onClick={() => setShowCreate(true)}>
                  Create a campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && active.length > 0 && (
          <section>
            <p className="pg-section-label">Active</p>
            <div className="pg-entity-grid">
              {active.map(c => (
                <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/campaigns/${c.id}`)} />
              ))}
            </div>
          </section>
        )}

        {!loading && inactive.length > 0 && (
          <section>
            <p className="pg-section-label">Inactive</p>
            <div className="pg-entity-grid">
              {inactive.map(c => (
                <CampaignCard key={c.id} campaign={c} onClick={() => navigate(`/campaigns/${c.id}`)} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

interface CampaignCardProps { campaign: Campaign; onClick: () => void; }

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onClick }) => (
  <div className="pg-entity-card" onClick={onClick} role="button" tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    aria-label={`Open campaign: ${campaign.name}`}>
    <div className="pg-entity-card__header">
      <h2 className="pg-entity-card__title">{campaign.name}</h2>
      <span className={`pg-badge ${campaign.is_active ? 'pg-badge--green' : 'pg-badge--gray'}`}>
        {campaign.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>
    <p className="pg-entity-card__body">
      {campaign.description || 'No description provided.'}
    </p>
    <div className="pg-entity-card__footer">
      <span>DM: {campaign.dm_username}</span>
      <span>{campaign.member_count} player{campaign.member_count !== 1 ? 's' : ''}</span>
    </div>
  </div>
);

interface JoinWithCodeModalProps {
  onClose: () => void;
  onJoined: (campaignId: string) => void;
}

const JoinWithCodeModal: React.FC<JoinWithCodeModalProps> = ({ onClose, onJoined }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await campaignService.joinByCode(code.trim());
      onJoined(result.campaign_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pg-card" style={{ width: '100%', maxWidth: 440, margin: 0 }}>
        <p className="pg-card-title">Join with Invite Code</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--app-ink-1)', marginBottom: 16 }}>
          Paste the invite code your DM shared with you.
        </p>
        {error && (
          <div style={{
            background: 'rgba(214,71,98,0.12)', border: '1px solid rgba(214,71,98,0.35)',
            borderRadius: 8, padding: '10px 14px', color: '#f07286',
            fontSize: '0.875rem', marginBottom: 14,
          }}>{error}</div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A3F9KQ2B"
            autoFocus
            required
            style={{
              background: 'var(--app-bg-2)',
              border: '1px solid var(--app-border)',
              borderRadius: 7,
              padding: '10px 12px',
              fontSize: '0.9rem',
              color: 'var(--app-ink-0)',
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pg-btn pg-btn--secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="pg-btn pg-btn--primary" disabled={loading || !code.trim()} style={{ flex: 1 }}>
              {loading ? 'Joining…' : 'Join Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignsPage;