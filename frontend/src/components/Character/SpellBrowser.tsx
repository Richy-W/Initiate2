import React, { useState, useEffect, useCallback } from 'react';
import { Character } from '../../types';
import { contentAPI, characterSpellsAPI } from '../../services/apiClient';
import styles from './SpellBrowser.module.css';

const SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];

interface SpellResult {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
}

interface Props {
  character: Character;
  onSpellAdded?: () => void;
  onSpellRemoved?: () => void;
}

const SpellBrowser: React.FC<Props> = ({ character, onSpellAdded, onSpellRemoved }) => {
  const [spells, setSpells] = useState<SpellResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [schoolFilter, setSchoolFilter] = useState<string>('');

  const className = character.character_class?.name ?? '';
  const existingSpellIds = new Set(
    (character.character_spells ?? []).map(cs => String(cs.spell))
  );

  const fetchSpells = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (className) params.classes__name = className;
      if (levelFilter !== '') params.level = levelFilter;
      if (schoolFilter) params.school = schoolFilter;
      const data = await contentAPI.spells.list(params);
      setSpells(data.results ?? data);
    } catch {
      setSpells([]);
    } finally {
      setLoading(false);
    }
  }, [className, levelFilter, schoolFilter]);

  useEffect(() => {
    fetchSpells();
  }, [fetchSpells]);

  const filtered = spells.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (spell: SpellResult) => {
    await characterSpellsAPI.create({
      character: character.id,
      spell: spell.id,
      source: 'class',
      is_prepared: false,
      spell_level: spell.level,
      notes: '',
    });
    onSpellAdded?.();
  };

  const handleRemove = async (spell: SpellResult) => {
    const cs = (character.character_spells ?? []).find(s => String(s.spell) === String(spell.id));
    if (cs) {
      await characterSpellsAPI.delete(cs.id);
      onSpellRemoved?.();
    }
  };

  return (
    <div className={styles.browser}>
      <div className={styles.browserTitle}>Spell Browser — {className}</div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search spells…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.filterInput}
        />
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Levels</option>
          <option value="0">Cantrips</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
            <option key={l} value={String(l)}>Level {l}</option>
          ))}
        </select>
        <select
          value={schoolFilter}
          onChange={e => setSchoolFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Schools</option>
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className={styles.spellList}>
        {loading ? (
          <div className={styles.loadingMsg}>Loading spells…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyMsg}>No spells found</div>
        ) : (
          filtered.map(spell => (
            <div key={spell.id} className={styles.spellRow}>
              <div className={styles.spellInfo}>
                <div className={styles.spellName}>{spell.name}</div>
                <div className={styles.spellMeta}>
                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · {spell.school}
                  {spell.casting_time ? ` · ${spell.casting_time}` : ''}
                </div>
              </div>
              {existingSpellIds.has(String(spell.id)) ? (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemove(spell)}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => handleAdd(spell)}
                >
                  Add
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpellBrowser;
