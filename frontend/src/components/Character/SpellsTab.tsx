import React, { useState, useCallback } from 'react';
import { Character, CharacterSpell, SpellSlotState } from '../../types';
import { computeSpellcastingProfile } from '../../utils/spellUtils';
import SpellcastingStatBlock from './SpellcastingStatBlock';
import SpellSlotTracker from './SpellSlotTracker';
import SpellBrowser from './SpellBrowser';
import { spellSlotsAPI, characterSpellsAPI } from '../../services/apiClient';
import styles from './SpellsTab.module.css';

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cantrips',
  1: '1st Level',
  2: '2nd Level',
  3: '3rd Level',
  4: '4th Level',
  5: '5th Level',
  6: '6th Level',
  7: '7th Level',
  8: '8th Level',
  9: '9th Level',
};

interface Props {
  character: Character;
  onRefresh?: () => void;
}

const SpellsTab: React.FC<Props> = ({ character, onRefresh }) => {
  const [showBrowser, setShowBrowser] = useState(false);
  const classJson = character.character_class;
  const profile = computeSpellcastingProfile(character, classJson);
  const isPactCaster = profile.spellcastingType === 'pact';

  const characterSpells: CharacterSpell[] = character.character_spells ?? [];
  const slotStates: SpellSlotState[] = character.spell_slot_states ?? [];

  // Group spells by base spell level
  const grouped: Record<number, CharacterSpell[]> = {};
  for (const cs of characterSpells) {
    const level = cs.spell_level ?? 0;
    if (!grouped[level]) grouped[level] = [];
    grouped[level].push(cs);
  }
  const sortedLevels = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const handleToggleSlot = useCallback(
    async (slot: SpellSlotState, newUsed: number) => {
      await spellSlotsAPI.update(slot.id, { used: newUsed });
      onRefresh?.();
    },
    [onRefresh],
  );

  const handleTogglePrepared = useCallback(
    async (cs: CharacterSpell) => {
      await characterSpellsAPI.update(cs.id, { is_prepared: !cs.is_prepared });
      onRefresh?.();
    },
    [onRefresh],
  );

  const handleSpellAdded = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleSpellRemoved = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const showPreparedCount =
    ['full', 'half'].includes(profile.spellcastingType) && profile.spellcastingType !== 'none';
  const preparedSpells = characterSpells.filter(cs => cs.is_prepared && cs.spell_level > 0);

  return (
    <div className={styles.container}>
      <SpellcastingStatBlock profile={profile} />

      <div className={styles.header}>
        {showPreparedCount && (
          <div className={styles.preparedCount}>
            Prepared: {preparedSpells.length}
          </div>
        )}
        <button
          className={styles.manageBtn}
          onClick={() => setShowBrowser(v => !v)}
        >
          {showBrowser ? 'Close Browser' : 'Manage Spells'}
        </button>
      </div>

      {showBrowser && (
        <SpellBrowser
          character={character}
          onSpellAdded={handleSpellAdded}
          onSpellRemoved={handleSpellRemoved}
        />
      )}

      <SpellSlotTracker
        slots={slotStates}
        isPactCaster={isPactCaster}
        onToggleSlot={handleToggleSlot}
      />

      {characterSpells.length === 0 ? (
        <div className={styles.emptyState}>
          No spells added yet. Click <strong>Manage Spells</strong> to add some.
        </div>
      ) : (
        sortedLevels.map(level => (
          <div key={level} className={styles.spellGroup}>
            <div className={styles.groupTitle}>{LEVEL_LABELS[level] ?? `Level ${level}`}</div>
            <table className={styles.spellTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Casting Time</th>
                  <th>Range</th>
                  <th>Indicators</th>
                  <th>Notes</th>
                  {showPreparedCount && <th>Prepared</th>}
                </tr>
              </thead>
              <tbody>
                {grouped[level].map(cs => {
                  const spellData = (cs as any).spell_data ?? {};
                  return (
                    <tr key={cs.id}>
                      <td>{cs.spell_name}</td>
                      <td>{spellData.casting_time ?? '—'}</td>
                      <td>{spellData.range ?? '—'}</td>
                      <td>
                        <div className={styles.badges}>
                          {spellData.concentration && (
                            <span className={`${styles.badge} ${styles.badgeConc}`}>C</span>
                          )}
                          {spellData.ritual && (
                            <span className={`${styles.badge} ${styles.badgeRitual}`}>R</span>
                          )}
                          {spellData.components?.material && (
                            <span className={`${styles.badge} ${styles.badgeMaterial}`}>M</span>
                          )}
                        </div>
                      </td>
                      <td>{cs.notes || '—'}</td>
                      {showPreparedCount && level > 0 && (
                        <td>
                          <button
                            type="button"
                            className={styles.prepareToggle}
                            onClick={() => handleTogglePrepared(cs)}
                            title={cs.is_prepared ? 'Un-prepare' : 'Prepare'}
                          >
                            {cs.is_prepared ? '★' : '☆'}
                          </button>
                        </td>
                      )}
                      {showPreparedCount && level === 0 && <td>—</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default SpellsTab;
