import React, { useState, useEffect, useCallback } from 'react';
import { contentAPI } from '../../services/apiClient';
import styles from './WizardSpellPicker.module.css';

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
}

interface Props {
  className: string;
  spellcastingData: any;
  selections: string[];
  onSelectionsChange: (ids: string[]) => void;
  onSpellObjectsChange?: (spells: SpellOption[]) => void;
}

const WizardSpellPicker: React.FC<Props> = ({ className, spellcastingData, selections, onSelectionsChange, onSpellObjectsChange }) => {
  const [cantrips, setCantrips] = useState<SpellOption[]>([]);
  const [levelOneSpells, setLevelOneSpells] = useState<SpellOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const cantripLimit: number = spellcastingData?.cantripsKnown?.['1'] ?? 0;
  const spellLimit: number = spellcastingData?.spellsKnown?.['1'] ?? spellcastingData?.spellsPrepared?.['1'] ?? 0;
  const hasSlots = Object.keys(spellcastingData?.spellSlots?.['1'] ?? {}).length > 0;

  const fetchSpells = useCallback(async () => {
    if (!className) return;
    setLoading(true);
    try {
      const [cData, sData] = await Promise.all([
        contentAPI.spells.list({ classes__name: className, level: 0 }),
        hasSlots
          ? contentAPI.spells.list({ classes__name: className, level: 1 })
          : Promise.resolve({ results: [] }),
      ]);
      setCantrips(cData.results ?? cData);
      setLevelOneSpells(sData.results ?? sData);
    } catch {
      setCantrips([]);
      setLevelOneSpells([]);
    } finally {
      setLoading(false);
    }
  }, [className, hasSlots]);

  useEffect(() => { fetchSpells(); }, [fetchSpells]);

  const toggleCantrip = (id: string) => {
    let nextIds: string[];
    if (selections.includes(id)) {
      nextIds = selections.filter(s => s !== id);
    } else {
      const currentCount = cantrips.filter(c => selections.includes(c.id)).length;
      if (cantripLimit > 0 && currentCount >= cantripLimit) return;
      nextIds = [...selections, id];
    }
    onSelectionsChange(nextIds);
    if (onSpellObjectsChange) {
      const allSpells = [...cantrips, ...levelOneSpells];
      onSpellObjectsChange(nextIds.map(sid => allSpells.find(s => s.id === sid)).filter(Boolean) as SpellOption[]);
    }
  };

  const toggleSpell = (id: string) => {
    let nextIds: string[];
    if (selections.includes(id)) {
      nextIds = selections.filter(s => s !== id);
    } else {
      const currentCount = levelOneSpells.filter(s => selections.includes(s.id)).length;
      if (spellLimit > 0 && currentCount >= spellLimit) return;
      nextIds = [...selections, id];
    }
    onSelectionsChange(nextIds);
    if (onSpellObjectsChange) {
      const allSpells = [...cantrips, ...levelOneSpells];
      onSpellObjectsChange(nextIds.map(sid => allSpells.find(s => s.id === sid)).filter(Boolean) as SpellOption[]);
    }
  };

  const q = search.toLowerCase();
  const filteredCantrips = cantrips.filter(s => s.name.toLowerCase().includes(q));
  const filteredSpells = levelOneSpells.filter(s => s.name.toLowerCase().includes(q));

  const selectedCantripCount = cantrips.filter(c => selections.includes(c.id)).length;
  const selectedSpellCount = levelOneSpells.filter(s => selections.includes(s.id)).length;
  const cantripLimitReached = cantripLimit > 0 && selectedCantripCount >= cantripLimit;
  const spellLimitReached = spellLimit > 0 && selectedSpellCount >= spellLimit;

  if (loading) {
    return <div className={styles.loading}>Loading {className} spells...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.hint}>
        Optional — you can manage spells any time from the SPELLS tab after creation.
      </div>

      <input
        type="text"
        className={styles.search}
        placeholder="Search spells..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search spells"
      />

      {filteredCantrips.length > 0 && (
        <section className={styles.section} aria-label="Cantrips">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Cantrips</span>
            {cantripLimit > 0 && (
              <span className={`${styles.counter} ${cantripLimitReached ? styles.counterFull : ''}`}>
                {selectedCantripCount} / {cantripLimit}
              </span>
            )}
          </div>
          <div className={styles.spellList} role="list">
            {filteredCantrips.map(spell => {
              const checked = selections.includes(spell.id);
              const disabled = !checked && cantripLimitReached;
              return (
                <div
                  key={spell.id}
                  className={`${styles.spellRow} ${checked ? styles.spellRowSelected : ''} ${disabled ? styles.spellRowDisabled : ''}`}
                  onClick={() => toggleCantrip(spell.id)}
                  role="listitem"
                  aria-selected={checked}
                  aria-disabled={disabled}
                >
                  <div className={`${styles.checkBox} ${checked ? styles.checkBoxChecked : ''}`}>
                    {checked && <span aria-hidden="true">✓</span>}
                  </div>
                  <span className={styles.spellName}>{spell.name}</span>
                  <span className={styles.spellSchool}>{spell.school}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {filteredSpells.length > 0 && (
        <section className={styles.section} aria-label="1st-level spells">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>1st-Level Spells</span>
            {spellLimit > 0 && (
              <span className={`${styles.counter} ${spellLimitReached ? styles.counterFull : ''}`}>
                {selectedSpellCount} / {spellLimit}
              </span>
            )}
          </div>
          <div className={styles.spellList} role="list">
            {filteredSpells.map(spell => {
              const checked = selections.includes(spell.id);
              const disabled = !checked && spellLimitReached;
              return (
                <div
                  key={spell.id}
                  className={`${styles.spellRow} ${checked ? styles.spellRowSelected : ''} ${disabled ? styles.spellRowDisabled : ''}`}
                  onClick={() => toggleSpell(spell.id)}
                  role="listitem"
                  aria-selected={checked}
                  aria-disabled={disabled}
                >
                  <div className={`${styles.checkBox} ${checked ? styles.checkBoxChecked : ''}`}>
                    {checked && <span aria-hidden="true">✓</span>}
                  </div>
                  <span className={styles.spellName}>{spell.name}</span>
                  <span className={styles.spellSchool}>{spell.school}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {filteredCantrips.length === 0 && filteredSpells.length === 0 && !loading && (
        <div className={styles.empty}>
          No spells found{search ? ' matching your search' : ' for this class'}.
        </div>
      )}
    </div>
  );
};

export default WizardSpellPicker;
