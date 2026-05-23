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
  presetClass?: string;
}

const MagicInitiateSpellPicker: React.FC<Props> = ({ onConfirm, presetClass }) => {
  const [sourceClass, setSourceClass] = useState(presetClass || SOURCE_CLASSES[0]);
  const [cantrips, setCantrips] = useState<SpellOption[]>([]);
  const [firstLevelSpells, setFirstLevelSpells] = useState<SpellOption[]>([]);
  const [cantrip1, setCantrip1] = useState<SpellOption | null>(null);
  const [cantrip2, setCantrip2] = useState<SpellOption | null>(null);
  const [selectedFirstLevel, setSelectedFirstLevel] = useState<SpellOption | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSpells = useCallback(async () => {
    setLoading(true);
    setCantrip1(null);
    setCantrip2(null);
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

  const isReady = cantrip1 !== null && cantrip2 !== null && cantrip1.id !== cantrip2.id && selectedFirstLevel !== null;

  useEffect(() => {
    if (isReady) {
      onConfirm({
        sourceClass,
        cantrips: [cantrip1!, cantrip2!],
        firstLevel: selectedFirstLevel,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cantrip1, cantrip2, selectedFirstLevel]);

  return (
    <div className={styles.picker}>
      <div className={styles.pickerTitle}>Magic Initiate — Choose Spells</div>

      {!presetClass && (
        <div className={styles.section}>
          <label className={styles.sectionLabel} htmlFor="mi-source-class">Source Class</label>
          <select
            id="mi-source-class"
            value={sourceClass}
            onChange={e => setSourceClass(e.target.value)}
            className={styles.spellSelect}
          >
            {SOURCE_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingMsg}>Loading…</div>
      ) : (
        <>
          <div className={styles.section}>
            <label className={styles.sectionLabel} htmlFor="mi-cantrip1">Cantrip 1</label>
            <select
              id="mi-cantrip1"
              className={styles.spellSelect}
              value={cantrip1?.id ?? ''}
              onChange={e => {
                const spell = cantrips.find(s => String(s.id) === e.target.value) ?? null;
                setCantrip1(spell);
              }}
            >
              <option value="">-- Choose a cantrip --</option>
              {cantrips.map(spell => (
                <option key={spell.id} value={spell.id} disabled={String(cantrip2?.id) === String(spell.id)}>
                  {spell.name} ({spell.school})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.section}>
            <label className={styles.sectionLabel} htmlFor="mi-cantrip2">Cantrip 2</label>
            <select
              id="mi-cantrip2"
              className={styles.spellSelect}
              value={cantrip2?.id ?? ''}
              onChange={e => {
                const spell = cantrips.find(s => String(s.id) === e.target.value) ?? null;
                setCantrip2(spell);
              }}
            >
              <option value="">-- Choose a cantrip --</option>
              {cantrips.map(spell => (
                <option key={spell.id} value={spell.id} disabled={String(cantrip1?.id) === String(spell.id)}>
                  {spell.name} ({spell.school})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.section}>
            <label className={styles.sectionLabel} htmlFor="mi-firstlevel">1st-Level Spell</label>
            <select
              id="mi-firstlevel"
              className={styles.spellSelect}
              value={selectedFirstLevel?.id ?? ''}
              onChange={e => {
                const spell = firstLevelSpells.find(s => String(s.id) === e.target.value) ?? null;
                setSelectedFirstLevel(spell);
              }}
            >
              <option value="">-- Choose a spell --</option>
              {firstLevelSpells.map(spell => (
                <option key={spell.id} value={spell.id}>
                  {spell.name} ({spell.school})
                </option>
              ))}
            </select>
          </div>

          {isReady && (
            <div className={styles.confirmedBadge}>
              ✓ Spells confirmed
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MagicInitiateSpellPicker;
