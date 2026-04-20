import React, { useState } from 'react';
import '../../styles/pages.css';
import { Campaign } from '../../types';
import campaignService from '../../services/campaignService';

interface CampaignSettingsProps {
  campaign: Campaign;
  onUpdated: (campaign: Campaign) => void;
}

const CampaignSettings: React.FC<CampaignSettingsProps> = ({ campaign, onUpdated }) => {
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description,
    join_mode: campaign.join_mode,
    encumbrance_rules: campaign.encumbrance_rules,
    rule_validation: campaign.rule_validation,
    is_active: campaign.is_active,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await campaignService.update(campaign.id, formData);
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update campaign settings.');
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
    <div className="pg-card" style={{ maxWidth: 640, margin: '0 auto' }}>
      <p className="pg-card-title">Campaign Settings</p>

      {error && (
        <div style={{ background: 'rgba(214,71,98,0.12)', border: '1px solid rgba(214,71,98,0.35)', borderRadius: 8, padding: '10px 14px', color: '#f07286', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>
      )}
      {saved && (
        <div style={{ background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.35)', borderRadius: 8, padding: '10px 14px', color: '#4ade80', fontSize: '0.875rem', marginBottom: 16 }}>Settings saved successfully.</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>Campaign Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Join Mode</label>
            <select
              value={formData.join_mode}
              onChange={e => setFormData(p => ({ ...p, join_mode: e.target.value as Campaign['join_mode'] }))}
              style={inputStyle}
            >
              <option value="invitation_only">Invitation Only</option>
              <option value="approval_required">Approval Required</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Encumbrance Rules</label>
            <select
              value={formData.encumbrance_rules}
              onChange={e => setFormData(p => ({ ...p, encumbrance_rules: e.target.value as Campaign['encumbrance_rules'] }))}
              style={inputStyle}
            >
              <option value="disabled">Disabled</option>
              <option value="simple">Simple</option>
              <option value="variant">Variant</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Rule Validation</label>
          <select
            value={formData.rule_validation}
            onChange={e => setFormData(p => ({ ...p, rule_validation: e.target.value as Campaign['rule_validation'] }))}
            style={inputStyle}
          >
            <option value="strict">Strict</option>
            <option value="warnings">Warnings</option>
            <option value="permissive">Permissive</option>
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
            style={{ accentColor: 'var(--app-accent)', width: 16, height: 16 }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--app-ink-0)', fontWeight: 500 }}>Campaign Active</span>
        </label>
        <div>
          <button type="submit" disabled={loading} className="pg-btn pg-btn--primary">
            {loading ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignSettings;
