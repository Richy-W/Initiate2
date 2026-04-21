import React, { useState } from 'react';
import '../../styles/pages.css';
import { Campaign, CampaignInvitation } from '../../types';
import campaignService from '../../services/campaignService';

interface PlayerInvitesProps {
  campaign: Campaign;
  invitations: CampaignInvitation[];
  onInviteSent: (invitation: CampaignInvitation) => void;
  onInviteCodeChanged: (newCode: string) => void;
}

const PlayerInvites: React.FC<PlayerInvitesProps> = ({ campaign, invitations, onInviteSent, onInviteCodeChanged }) => {
  const campaignId = campaign.id;
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<CampaignInvitation | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  const handleCopyCampaignCode = () => {
    navigator.clipboard.writeText(campaign.invite_code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handleRegenCode = async () => {
    setRegenLoading(true);
    try {
      const res = await campaignService.regenerateInviteCode(campaignId);
      onInviteCodeChanged(res.invite_code);
    } finally {
      setRegenLoading(false);
    }
  };

  const handleCopyToken = (inv: CampaignInvitation) => {
    navigator.clipboard.writeText(inv.token).then(() => {
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastSent(null);
    try {
      const invitation = await campaignService.invite(campaignId, { email, message });
      onInviteSent(invitation);
      setLastSent(invitation);
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--app-bg-2)',
    border: '1px solid var(--app-border)',
    borderRadius: 7,
    padding: '8px 12px',
    fontSize: '0.9rem',
    color: 'var(--app-ink-0)',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--app-ink-1)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Campaign Invite Code ─────────────────────────────────── */}
      <div className="pg-card" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <p className="pg-card-title">Campaign Invite Code</p>
        <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--app-ink-1)' }}>
          Share this code with players at the table. Anyone who enters it on the Campaigns page will join immediately.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1,
            background: 'var(--app-bg-0, #11111b)',
            border: '2px solid var(--app-accent, #7c6af7)',
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.6rem',
              fontWeight: 800,
              letterSpacing: '0.3em',
              color: 'var(--app-ink-0)',
            }}>{campaign.invite_code}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="pg-btn pg-btn--primary pg-btn--sm"
              onClick={handleCopyCampaignCode}
              style={{ whiteSpace: 'nowrap' }}
            >
              {codeCopied ? '✓ Copied!' : 'Copy Code'}
            </button>
            <button
              className="pg-btn pg-btn--secondary pg-btn--sm"
              onClick={handleRegenCode}
              disabled={regenLoading}
              style={{ whiteSpace: 'nowrap' }}
              title="Generate a new invite code (old one stops working)"
            >
              {regenLoading ? '…' : '↻ New Code'}
            </button>
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--app-ink-2, #555)' }}>
          Regenerating will invalidate the current code.
        </p>
      </div>

      <div className="pg-card" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <p className="pg-card-title">Send Invitation by Email</p>
        {error && (
          <div style={{ background: 'rgba(214,71,98,0.12)', border: '1px solid rgba(214,71,98,0.35)', borderRadius: 8, padding: '10px 14px', color: '#f07286', fontSize: '0.875rem', marginBottom: 12 }}>{error}</div>
        )}
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Player Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="player@example.com"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Message (optional)</label>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={inputStyle}
              placeholder="Come join our adventure!"
            />
          </div>
          <div>
            <button type="submit" disabled={loading} className="pg-btn pg-btn--primary">
              {loading ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>

        {/* Invite code shown after successful send */}
        {lastSent && (
          <div style={{
            marginTop: 16,
            background: 'rgba(124,106,247,0.1)',
            border: '1px solid rgba(124,106,247,0.35)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--app-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Invitation Created — Share this code
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{
                flex: 1, fontSize: '0.8rem', color: 'var(--app-ink-0)',
                background: 'var(--app-bg-0, #11111b)', borderRadius: 5,
                padding: '6px 10px', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', userSelect: 'all', fontFamily: 'monospace',
              }}>{lastSent.token}</code>
              <button
                className="pg-btn pg-btn--secondary pg-btn--sm"
                style={{ flexShrink: 0 }}
                onClick={() => handleCopyToken(lastSent)}
              >
                {copiedId === lastSent.id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--app-ink-1)' }}>
              Send this code to <strong>{lastSent.email}</strong>. They can enter it on the Campaigns page to join.
            </p>
          </div>
        )}
      </div>

      <div className="pg-card" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <p className="pg-card-title">Pending Invitations</p>
        {invitations.length === 0 ? (
          <div className="pg-empty" style={{ padding: '20px 0 8px' }}>
            <span className="pg-empty__icon">✉️</span>
            <p className="pg-empty__body">No pending invitations yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invitations.map(inv => (
              <div key={inv.id} style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '12px 14px',
                background: 'var(--app-bg-2)',
                border: '1px solid var(--app-border)',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--app-ink-0)', fontWeight: 600 }}>
                    {inv.email || inv.invitee || 'Unknown'}
                  </span>
                  <span className={`pg-badge ${
                    inv.status === 'accepted' ? 'pg-badge--green' :
                    inv.status === 'pending' ? 'pg-badge--blue' :
                    (inv.status === 'declined' || inv.status === 'expired' || inv.status === 'revoked') ? 'pg-badge--red' :
                    'pg-badge--gray'
                  }`}>{inv.status}</span>
                </div>
                {inv.status === 'pending' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{
                      flex: 1, fontSize: '0.75rem', color: 'var(--app-ink-1)',
                      background: 'var(--app-bg-0, #11111b)', borderRadius: 5,
                      padding: '5px 8px', overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', userSelect: 'all',
                    }}>{inv.token}</code>
                    <button
                      className="pg-btn pg-btn--secondary pg-btn--sm"
                      style={{ flexShrink: 0 }}
                      onClick={() => handleCopyToken(inv)}
                    >
                      {copiedId === inv.id ? '✓ Copied' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerInvites;
