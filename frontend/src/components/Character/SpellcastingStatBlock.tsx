import React from 'react';
import { SpellcastingProfile } from '../../types';
import styles from './SpellcastingStatBlock.module.css';

interface Props {
  profile: SpellcastingProfile;
}

const SpellcastingStatBlock: React.FC<Props> = ({ profile }) => {
  if (profile.spellcastingType === 'none') return null;

  const toHit = profile.attackBonus >= 0
    ? `+${profile.attackBonus}`
    : `${profile.attackBonus}`;

  const modifier = profile.modifier >= 0
    ? `+${profile.modifier}`
    : `${profile.modifier}`;

  return (
    <div className={styles.statBlock}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Spellcasting Ability</span>
        <span className={styles.statValue}>{profile.ability}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Spell Modifier</span>
        <span className={styles.statValue}>{modifier}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Spell Save DC</span>
        <span className={styles.statValue}>{profile.saveDC}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Spell Attack Bonus</span>
        <span className={styles.statValue}>{toHit}</span>
      </div>
    </div>
  );
};

export default SpellcastingStatBlock;
