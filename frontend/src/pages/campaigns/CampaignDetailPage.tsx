import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Campaign, CampaignMembership, CampaignInvitation, CampaignNotification } from '../../types';
import campaignService from '../../services/campaignService';
import { useAuth } from '../../contexts/AuthContext';
import CampaignSettings from '../../components/Campaign/CampaignSettings';
import PlayerInvites from '../../components/Campaign/PlayerInvites';
import PartyOverview from '../../components/Campaign/PartyOverview';
import PlayerDashboard from '../../components/Campaign/PlayerDashboard';
import CampaignNotifications from '../../components/Campaign/CampaignNotifications';
import '../../styles/pages.css';

type Tab = 'overview' | 'settings' | 'invitations';

const CampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const authState = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [memberships, setMemberships] = useState<CampaignMembership[]>([]);
  const [invitations, setInvitations] = useState<CampaignInvitation[]>([]);
  const [notifications, setNotifications] = useState<CampaignNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  const isDM = campaign?.dm === authState.user?.id;

  const fetchData = useCallback(async () => {
    if (!campaignId) return;
    try {
      const [c, party] = await Promise.all([
        campaignService.get(campaignId),
        campaignService.getParty(campaignId),
      ]);
      setCampaign(c);
      setMemberships(party);
    } catch {
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  }, [campaignId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (isDM && campaignId) {
      campaignService.getInvitations(campaignId).then(setInvitations).catch(() => {});
    }
  }, [isDM, campaignId]);

  const refreshNotifications = useCallback(async () => {
    if (!campaignId) return;
    const data = await campaignService.getNotifications(campaignId);
    setNotifications(data);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) return;
    refreshNotifications().catch(() => {});
  }, [campaignId, refreshNotifications]);

  const handleRemoveMember = async (playerId: string) => {
    if (!campaignId) return;
    await campaignService.removeMember(campaignId, playerId);
    setMemberships(prev => prev.filter(m => m.player !== playerId));
  };

  if (loading) {
    return (
      <div className="pg-shell">
        <div className="pg-inner">
          <div className="pg-loading">Loading campaign…</div>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="pg-shell">
      <div className="pg-inner">

        {/* Hero */}
        <div className="pg-hero pg-hero--centered">
          <div className="pg-hero-text">
            <button className="pg-back-link" onClick={() => navigate('/campaigns')}>← Campaigns</button>
            <h1>{campaign.name}</h1>
            <p>
              {campaign.description || 'No description.'}
              &nbsp;&nbsp;
              <span className={`pg-badge ${campaign.is_active ? 'pg-badge--green' : 'pg-badge--gray'}`}>
                {campaign.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div className="pg-hero-actions">
            {isDM && (
              <button
                className="pg-btn pg-btn--danger"
                onClick={() => navigate(`/combat?campaign=${campaign.id}`)}
              >
                ⚔️ Start Combat
              </button>
            )}
          </div>
        </div>

        {/* Tabs — DM only */}
        {isDM && (
          <div className="pg-tabs" role="tablist" aria-label="Campaign sections">
            {(['overview', 'settings', 'invitations'] as Tab[]).map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`pg-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'overview' ? '📋 Overview' : t === 'settings' ? '⚙️ Settings' : '📨 Invitations'}
              </button>
            ))}
          </div>
        )}

        {/* Tab panels */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <PlayerDashboard campaign={campaign} userId={authState.user?.id || ''} />
            <CampaignNotifications
              campaignId={campaign.id}
              notifications={notifications}
              memberships={memberships}
              isDM={!!isDM}
              onRefresh={refreshNotifications}
            />
            <PartyOverview memberships={memberships} isDM={isDM} onRemoveMember={handleRemoveMember} />
          </div>
        )}

        {tab === 'settings' && isDM && (
          <CampaignSettings campaign={campaign} onUpdated={setCampaign} />
        )}

        {tab === 'invitations' && isDM && (
          <PlayerInvites
            campaign={campaign}
            invitations={invitations}
            onInviteSent={inv => setInvitations(prev => [inv, ...prev])}
            onInviteCodeChanged={newCode => setCampaign(prev => prev ? { ...prev, invite_code: newCode } : prev)}
          />
        )}

      </div>
    </div>
  );
};

export default CampaignDetailPage;