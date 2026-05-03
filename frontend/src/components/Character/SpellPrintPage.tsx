import React from 'react';
import { Character, SpellSlotState } from '../../types';
import { computeSpellcastingProfile } from '../../utils/spellUtils';

interface Props {
  character: Character;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

const SpellPrintPage: React.FC<Props> = ({ character }) => {
  const classJson = character.character_class;
  const profile = computeSpellcastingProfile(character as any, classJson);

  if (profile.spellcastingType === 'none') return null;

  const spells = character.character_spells ?? [];
  const slots: SpellSlotState[] = character.spell_slot_states ?? [];

  const cantripSpells = spells.filter(cs => cs.spell?.level === 0);
  const preparedSpells = spells.filter(cs => (cs.spell?.level ?? 0) > 0);

  const slotLevels = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="spell-print-page">
      <h2 style={{ marginBottom: 8, fontSize: '1.1rem' }}>
        {character.name} — Spell Sheet
      </h2>

      {/* Spellcasting Stat Block */}
      <div className="spell-print-stat-block">
        <div className="spell-print-stat-box">
          <div className="spell-print-stat-label">Ability</div>
          <div className="spell-print-stat-value">{profile.spellcastingAbility.toUpperCase()}</div>
        </div>
        <div className="spell-print-stat-box">
          <div className="spell-print-stat-label">Modifier</div>
          <div className="spell-print-stat-value">{fmt(profile.spellcastingModifier)}</div>
        </div>
        <div className="spell-print-stat-box">
          <div className="spell-print-stat-label">Save DC</div>
          <div className="spell-print-stat-value">{profile.spellSaveDC}</div>
        </div>
        <div className="spell-print-stat-box">
          <div className="spell-print-stat-label">Attack Bonus</div>
          <div className="spell-print-stat-value">{fmt(profile.spellAttackBonus)}</div>
        </div>
      </div>

      {/* Spell Slot Grid */}
      {profile.spellcastingType !== 'pact' && slots.length > 0 && (
        <div className="spell-print-slots-grid">
          <div className="spell-print-slots-cell spell-print-slots-header">Slot Level</div>
          {slotLevels.map(lvl => (
            <div key={lvl} className="spell-print-slots-cell spell-print-slots-header">{lvl}</div>
          ))}
          <div className="spell-print-slots-cell">Total</div>
          {slotLevels.map(lvl => {
            const slot = slots.find(s => s.slot_level === lvl);
            return (
              <div key={lvl} className="spell-print-slots-cell">{slot?.total ?? '—'}</div>
            );
          })}
          <div className="spell-print-slots-cell">Used</div>
          {slotLevels.map(lvl => {
            const slot = slots.find(s => s.slot_level === lvl);
            return (
              <div key={lvl} className="spell-print-slots-cell">{slot != null ? slot.used : '—'}</div>
            );
          })}
        </div>
      )}

      {/* Cantrips */}
      {cantripSpells.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.82rem', margin: '8px 0 4px' }}>Cantrips</h3>
          <table className="spell-print-spells-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Casting Time</th>
                <th>Range</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {cantripSpells.map(cs => (
                <tr key={cs.id}>
                  <td>{cs.spell?.name ?? '—'}</td>
                  <td>{cs.spell?.school ?? '—'}</td>
                  <td>{cs.spell?.casting_time ?? '—'}</td>
                  <td>{cs.spell?.range ?? '—'}</td>
                  <td>{cs.spell?.duration ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Prepared Spells */}
      {preparedSpells.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.82rem', margin: '8px 0 4px' }}>Prepared Spells</h3>
          <table className="spell-print-spells-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Level</th>
                <th>School</th>
                <th>Casting Time</th>
                <th>Range</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {preparedSpells.map(cs => (
                <tr key={cs.id}>
                  <td>{cs.spell?.name ?? '—'}</td>
                  <td>{cs.spell?.level ?? '—'}</td>
                  <td>{cs.spell?.school ?? '—'}</td>
                  <td>{cs.spell?.casting_time ?? '—'}</td>
                  <td>{cs.spell?.range ?? '—'}</td>
                  <td>{cs.spell?.duration ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default SpellPrintPage;
