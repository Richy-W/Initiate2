import React, { useEffect, useMemo, useState } from 'react';
import { characterAPI } from '../../services/apiClient';
import styles from './CharacterEditor.module.css';

interface CharacterEditorProps {
  characterId: string;
}

interface CharacterDetail {
  id: string;
  name: string;
  level: number;
  current_hit_points: number;
  max_hit_points: number;
  temporary_hit_points?: number;
  class_detail?: {
    name?: string;
    subclass_name?: string;
    hit_die?: number;
    source?: string;
  };
}

export const CharacterEditor: React.FC<CharacterEditorProps> = ({ characterId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showHpManager, setShowHpManager] = useState(false);

  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [name, setName] = useState('');
  const [level, setLevel] = useState(1);
  const [maxHp, setMaxHp] = useState(1);
  const [hpAmount, setHpAmount] = useState(0);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        setLoading(true);
        const data = await characterAPI.get(characterId);
        setCharacter(data);
        setName(data.name || '');
        setLevel(Number(data.level || 1));
        setMaxHp(Math.max(1, Number(data.max_hit_points || 1)));
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load character for editing.');
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [characterId]);

  const className = character?.class_detail?.name || 'Class';
  const subclassName = character?.class_detail?.subclass_name || '';
  const hitDie = Number(character?.class_detail?.hit_die || 8);

  const hitDiceSummary = useMemo(() => {
    if (level <= 1) return `1d${hitDie}`;
    return `1d${hitDie} + ${level - 1}d${hitDie}`;
  }, [hitDie, level]);

  const handleSave = async () => {
    if (!character) return;

    const sanitizedName = name.trim();
    if (!sanitizedName) {
      setError('Character name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setStatusMessage(null);

      const payload: Record<string, any> = {
        name: sanitizedName,
        level,
        max_hit_points: Math.max(1, maxHp),
      };

      if ((character.current_hit_points || 0) > payload.max_hit_points) {
        payload.current_hit_points = payload.max_hit_points;
      }

      const updated = await characterAPI.update(character.id, payload);
      setCharacter((prev) => ({
        ...(prev || updated),
        ...updated,
      }));
      setStatusMessage('Character changes saved.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not save character changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDamage = async () => {
    if (!character || hpAmount <= 0) return;
    try {
      const response = await characterAPI.takeDamage(character.id, { damage: hpAmount });
      if (response?.character) {
        setCharacter(response.character);
      } else {
        const fresh = await characterAPI.get(character.id);
        setCharacter(fresh);
      }
      setHpAmount(0);
    } catch {
      setError('Could not apply damage.');
    }
  };

  const handleHeal = async () => {
    if (!character || hpAmount <= 0) return;
    try {
      const response = await characterAPI.heal(character.id, { healing: hpAmount });
      if (response?.character) {
        setCharacter(response.character);
      } else {
        const fresh = await characterAPI.get(character.id);
        setCharacter(fresh);
      }
      setHpAmount(0);
    } catch {
      setError('Could not apply healing.');
    }
  };

  if (loading) {
    return <div className={styles['character-editor-loading']}>Loading character editor...</div>;
  }

  if (error && !character) {
    return <div className={styles['character-editor-error']}>{error}</div>;
  }

  if (!character) {
    return <div className={styles['character-editor-error']}>Character not found.</div>;
  }

  return (
    <div className={styles['character-editor-page']}>
      <div className={styles['editor-canvas']}>
        <section className={styles['editor-name-row']}>
          <div className={styles['editor-avatar']} aria-hidden="true">{className.charAt(0).toUpperCase()}</div>
          <div className={styles['editor-name-panel']}>
            <label htmlFor="editor-character-name">Character Name</label>
            <input
              id="editor-character-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
            />
          </div>
        </section>

        <section className={styles['editor-level-row']}>
          <div className={styles['editor-level-summary']}>
            <h2>Character Level: {level}</h2>
            <p>Milestone Advancement</p>
          </div>

          <div className={styles['editor-hp-box']}>
            <div>
              <strong>Max Hit Points:</strong> {maxHp}
            </div>
            <div>
              <strong>Hit Dice:</strong> {hitDiceSummary}
            </div>
            <button
              type="button"
              className={styles['manage-hp-btn']}
              onClick={() => setShowHpManager((prev) => !prev)}
            >
              {showHpManager ? 'Hide HP' : 'Manage HP'}
            </button>
          </div>
        </section>

        {showHpManager && (
          <section className={styles['editor-hp-manager']}>
            <div className={styles['hp-live-stats']}>
              <span>Current: {character.current_hit_points}</span>
              <span>Temp: {character.temporary_hit_points || 0}</span>
            </div>
            <div className={styles['hp-actions']}>
              <input
                type="number"
                min={0}
                value={hpAmount}
                onChange={(e) => setHpAmount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="Amount"
              />
              <button type="button" onClick={handleDamage}>Damage</button>
              <button type="button" onClick={handleHeal}>Heal</button>
            </div>
          </section>
        )}

        <section className={styles['editor-class-row']}>
          <div className={styles['class-identity']}>
            <div className={styles['class-icon']} aria-hidden="true">✦</div>
            <div>
              <p className={styles['class-subclass']}>{subclassName || 'Starting Class'}</p>
              <h3>{className}</h3>
            </div>
          </div>

          <div className={styles['class-level-control']}>
            <label htmlFor="class-level">Level</label>
            <select
              id="class-level"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles['editor-feature-tabs']}>
          <button type="button" className={styles['active']}>Class Features</button>
          <button type="button">Optional Feature Manager</button>
          <button type="button">Spells</button>
        </section>

        <section className={styles['editor-extra-row']}>
          <button type="button" className={styles['ghost-link']} disabled>
            + Add Another Class (coming soon)
          </button>
        </section>

        <section className={styles['editor-save-row']}>
          <div className={styles['editor-inline-edit']}>
            <label htmlFor="max-hp-edit">Max HP</label>
            <input
              id="max-hp-edit"
              type="number"
              min={1}
              value={maxHp}
              onChange={(e) => setMaxHp(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <button type="button" className={styles['save-editor-btn']} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </section>

        {error && <div className={[styles['character-editor-error'], styles['inline']].filter(Boolean).join(' ')}>{error}</div>}
        {statusMessage && <div className={styles['character-editor-status']}>{statusMessage}</div>}
      </div>
    </div>
  );
};
