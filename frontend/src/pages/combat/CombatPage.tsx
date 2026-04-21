import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { InitiativeTracker } from '../../types';
import combatService from '../../services/combatService';
import { CombatWebSocketClient } from '../../services/websocketClient';
import InitiativeTrackerComponent from '../../components/Combat/InitiativeTracker';
import InitiativeRoll from '../../components/Combat/InitiativeRoll';
import NPCCreator from '../../components/Combat/NPCCreator';
import SpellEffects from '../../components/Combat/SpellEffects';
import '../../styles/pages.css';

const CombatPage: React.FC = () => {
  const { campaignId, encounterId } = useParams<{ campaignId?: string; encounterId?: string }>();
  const [searchParams] = useSearchParams();
  const effectiveCampaignId = campaignId || searchParams.get('campaign') || '';
  const navigate = useNavigate();

  const [trackers, setTrackers] = useState<InitiativeTracker[]>([]);
  const [activeTracker, setActiveTracker] = useState<InitiativeTracker | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<CombatWebSocketClient | null>(null);
  const activeTrackerId = activeTracker?.id;

  const fetchTrackers = useCallback(async () => {
    if (!effectiveCampaignId) { setLoading(false); return; }
    try {
      const data = await combatService.listTrackers(effectiveCampaignId);
      setTrackers(data);
      const active = encounterId ? data.find(t => t.id === encounterId) : data.find(t => t.is_active);
      if (active) {
        const detail = await combatService.getTracker(active.id);
        setActiveTracker(detail);
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveCampaignId, encounterId]);

  useEffect(() => { fetchTrackers(); }, [fetchTrackers]);

  useEffect(() => {
    if (!activeTrackerId) return;
    const ws = new CombatWebSocketClient(activeTrackerId);
    wsRef.current = ws;
    const unsubscribe = ws.onMessage((msg) => {
      if (msg.type === 'state' && msg.data) {
        setActiveTracker(msg.data);
      }
    });
    ws.connect();
    return () => {
      unsubscribe();
      ws.disconnect();
      wsRef.current = null;
    };
  }, [activeTrackerId]);

  const handleCreateTracker = async () => {
    if (!effectiveCampaignId) return;
    const name = prompt('Encounter name:', 'New Encounter');
    if (!name) return;
    const tracker = await combatService.createTracker({ campaign: effectiveCampaignId, name });
    const detail = await combatService.getTracker(tracker.id);
    setActiveTracker(detail);
    setTrackers(prev => [tracker, ...prev]);
  };

  const handleAdvanceTurn = () => { wsRef.current?.send('advance_turn'); };
  const handleUpdateHp = (participantId: string, change: number) => {
    wsRef.current?.send('update_hp', { participant_id: participantId, hp_change: change });
  };
  const handleToggleVisibility = (participantId: string) => {
    wsRef.current?.send('toggle_visibility', { participant_id: participantId });
  };
  const handleEndCombat = () => { wsRef.current?.send('end_combat'); };
  const handleStartCombat = () => { wsRef.current?.send('start_combat'); };

  const handleAddNPC = async (data: any) => {
    if (!activeTracker) return;
    const participant = await combatService.addParticipant(activeTracker.id, data);
    setActiveTracker(prev => prev ? { ...prev, participants: [...(prev.participants || []), participant] } : prev);
  };

  const handleAddEffect = (data: any) => { wsRef.current?.send('add_effect', data); };
  const handleRemoveEffect = (effectId: string) => { wsRef.current?.send('remove_effect', { effect_id: effectId }); };

  const handleSubmitInitiative = async (participantId: string, value: number) => {
    if (!activeTracker) return;
    await combatService.submitInitiative(activeTracker.id, participantId, value);
  };

  if (loading) {
    return (
      <div className="pg-shell">
        <div className="pg-inner">
          <div className="pg-loading">Loading combat…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-shell">
      <div className="pg-inner">

        {/* Hero */}
        <div className="pg-hero">
          <div className="pg-hero-text">
            {effectiveCampaignId && (
              <button className="pg-back-link" onClick={() => navigate(`/campaigns/${effectiveCampaignId}`)}>
                ← Campaign
              </button>
            )}
            <h1>⚔️ Combat</h1>
            <p>
              {activeTracker
                ? `Round ${activeTracker.round_number} — ${activeTracker.name}`
                : trackers.length > 0
                  ? `${trackers.length} encounter${trackers.length !== 1 ? 's' : ''}`
                  : 'No active encounter'}
            </p>
          </div>
          <div className="pg-hero-actions">
            {effectiveCampaignId && (
              <button className="pg-btn pg-btn--danger" onClick={handleCreateTracker}>
                + New Encounter
              </button>
            )}
          </div>
        </div>

        {/* Empty state — no trackers, no campaign */}
        {!activeTracker && trackers.length === 0 && (
          <div className="pg-card">
            <div className="pg-empty">
              <span className="pg-empty__icon">⚔️</span>
              <h3 className="pg-empty__title">No encounters yet</h3>
              <p className="pg-empty__body">
                {effectiveCampaignId
                  ? 'Create your first encounter to start tracking initiative.'
                  : 'Open a campaign and click Start Combat to begin.'}
              </p>
              {effectiveCampaignId && (
                <button className="pg-btn pg-btn--danger" onClick={handleCreateTracker}>
                  Start first encounter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Encounter list (no active tracker selected) */}
        {!activeTracker && trackers.length > 0 && (
          <section>
            <p className="pg-section-label">Encounters</p>
            <div className="pg-entity-grid">
              {trackers.map(t => (
                <div
                  key={t.id}
                  className="pg-entity-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => combatService.getTracker(t.id).then(setActiveTracker)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') combatService.getTracker(t.id).then(setActiveTracker); }}
                  aria-label={`Open encounter: ${t.name}`}
                >
                  <div className="pg-entity-card__header">
                    <h3 className="pg-entity-card__title">{t.name}</h3>
                    <span className={`pg-badge ${t.is_active ? 'pg-badge--green' : 'pg-badge--gray'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="pg-entity-card__body">Round {t.round_number}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active tracker */}
        {activeTracker && (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              {activeTracker.status === 'rolling' && (
                <InitiativeRoll participants={activeTracker.participants || []} onSubmitRoll={handleSubmitInitiative} />
              )}
              <InitiativeTrackerComponent
                tracker={activeTracker}
                isDM={true}
                onAdvanceTurn={handleAdvanceTurn}
                onUpdateHp={handleUpdateHp}
                onToggleVisibility={handleToggleVisibility}
                onEndCombat={handleEndCombat}
              />
              {activeTracker.status === 'rolling' && (
                <button className="pg-btn pg-btn--primary" style={{ width: '100%' }} onClick={handleStartCombat}>
                  ▶ Start Combat
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
              <NPCCreator onAdd={handleAddNPC} />
              <SpellEffects
                effects={activeTracker.spell_effects || []}
                isDM={true}
                onAddEffect={handleAddEffect}
                onRemoveEffect={handleRemoveEffect}
                participants={(activeTracker.participants || []).filter(p => p.is_active).map(p => ({ id: p.id, display: p.display }))}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CombatPage;