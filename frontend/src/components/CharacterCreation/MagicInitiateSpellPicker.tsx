import React, { useState, useEffect, useCallback } from 'react';
import { contentAPI } from '../../services/apiClient';
import styles from './MagicInitiateSpellPicker.module.css';

const SOURCE_CLASSES = [
  'Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard',
];

interface SpellOption {
  id: string;
  name: string;
  level: number;
  school: string;
}

export interface MagicInitiateSelections {
  sourceClass: string;
  cantrips: SpellOption[];   // exactly 2
  firstLevel: SpellOption | null;  // exactly 1
}

interface Props {
  onConfirm: (selections: MagicInitiateSelections) => void;
}

const MagicInitiateSpellPicker: React.FC<Props> = ({ onConfirm }) => {
  const [sourceClass, setSourceClass] = useState(SOURCE_CLASSES[0]);
  const [cantrips, setCantrips] = useState<SpellOption[]>([]);
  const [firstLevelSpells, setFirstLevelSpells] = useState<SpellOption[]>([]);
  const [selectedCantrips, setSelectedCantrips] = useState<SpellOption[]>([]);
  const [selectedFirstLevel, setSelectedFirstLevel] = useState<SpellOption | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSpells = useCallback(async () => {
    setLoading(true);
    setSelectedCantrips([]);
    setSelectedFirstLevel(null);
    try {
      const [cantripData, firstData] = await Promise.all([
        contentAPI.spells.list({ classes__name: sourceClass, level: 0 }),
        contentAPI.spells.list({ classes__name: sourceClass, level: 1 }),
      ]);
      setCantrips(cantripData.results ?? cantripData);
      setFirstLevelSpells(firstData.results ?? firstData);
    } catch {
      setCantrips([]);
      setFirstLevelSpells([]);
    } finally {
      setLoading(false);
    }
  }, [sourceClass]);

  useEffect(() => { fetchSpells(); }, [fetchSpells]);

  const toggleCantrip = (spell: SpellOption) => {
    setSelectedCantrips(prev => {
      const already = prev.some(s => s.id === spell.id);
      if (already) return prev.filter(s => s.id !== spell.id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, spell];
    });
  };

  const toggleFirstLevel = (spell: SpellOption) => {
    setSelectedFirstLevel(prev => (prev?.id === spell.id ? null : spell));
  };

  const isReady = selectedCantrips.length === 2 && selectedFirstLevel !== null;

  const handleConfirm = () => {
    if (!isReady) return;
    onConfirm({
      sourceClass,
      cantrips: selectedCantrips,
      firstLevel: selectedFirstLevel,
    });
  };

  return (
    <div className={styles.picker}>
      <div className={styles.pickerTitle}>Magic Initiate — Choose Spells</div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Source Class</div>
        <select
          value={sourceClass}
          onChange={e => setSourceClass(e.target.value)}
          className={styles.classSelect}
        >
          {SOURCE_CLASSES.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Cantrips (choose 2)</div>
        <div className={styles.counter}>{selectedCantrips.length}/2 selected</div>
        {loading ? (
          <div className={styles.loadingMsg}>Loading…</div>
        ) : (
          <div className={styles.spellList}>
            {cantrips.map(spell => {
              const selected = selectedCantrips.some(s => s.id === spell.id);
              return (
                <div
                  key={spell.id}
                  className={`${styles.spellRow} ${selected ? styles.spellRowSelected : ''}`}
                  onClick={() => toggleCantrip(spell)}
                >
                  <div className={`${styles.checkBox} ${selected ? styles.checkBoxChecked : ''}`} />
                  <div>
                    <div className={styles.spellName}>{spell.name}</div>
                    <div className={styles.spellMeta}>{spell.school}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>1st-Level Spell (choose 1)</div>
        <div className={styles.counter}>{selectedFirstLevel ? '1/1 selected' : '0/1 selected'}</div>
        {loading ? (
          <div className={styles.loadingMsg}>Loading…</div>
        ) : (
          <div className={styles.spellList}>
            {firstLevelSpells.map(spell => {
              const selected = selectedFirstLevel?.id === spell.id;
              return (
                <div
                  key={spell.id}
                  className={`${styles.spellRow} ${selected ? styles.spellRowSelected : ''}`}
                  onClick={() => toggleFirstLevel(spell)}
                >
                  <div className={`${styles.checkBox} ${selected ? styles.checkBoxChecked : ''}`} />
                  <div>
                    <div className={styles.spellName}>{spell.name}</div>
                    <div className={styles.spellMeta}>{spell.school}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.confirmBtn}
        disabled={!isReady}
        onClick={handleConfirm}
      >
        Confirm Selections
      </button>
    </div>
  );
};

export default MagicInitiateSpellPicker;
