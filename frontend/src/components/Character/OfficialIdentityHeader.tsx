import React from 'react';
import styles from './OfficialIdentityHeader.module.css';

interface OfficialIdentityHeaderProps {
  name: string;
  level: number;
  background?: string;
  characterClass?: string;
  species?: string;
  subclass?: string;
  compact?: boolean;
}

export const OfficialIdentityHeader: React.FC<OfficialIdentityHeaderProps> = ({
  name,
  level,
  background,
  characterClass,
  species,
  subclass,
  compact = false,
}) => {
  return (
    <div className={[styles['official-sheet-header'], compact ? styles['compact'] : ''].filter(Boolean).join(' ')}>
      <div className={[styles['official-header-row'], styles['official-header-row-1']].filter(Boolean).join(' ')}>
        <div className={[styles['official-field'], styles['official-character-name']].filter(Boolean).join(' ')}>
          <span className={styles['official-label']}>Character Name</span>
          <span className={[styles['official-value'], styles['official-value-large']].filter(Boolean).join(' ')}>{name || 'Unknown Character'}</span>
        </div>
        <div className={styles['official-level-circle']} aria-label={`Level ${level}`}>
          <span className={styles['official-level-value']}>{level}</span>
          <span className={styles['official-level-label']}>Level</span>
        </div>
      </div>

      <div className={[styles['official-header-row'], styles['official-header-row-2']].filter(Boolean).join(' ')}>
        <div className={styles['official-field']}>
          <span className={styles['official-label']}>Background</span>
          <span className={styles['official-value']}>{background || '-'}</span>
        </div>
        <div className={styles['official-field']}>
          <span className={styles['official-label']}>Class</span>
          <span className={styles['official-value']}>{characterClass || '-'}</span>
        </div>
        <div className={styles['official-field']}>
          <span className={styles['official-label']}>Species</span>
          <span className={styles['official-value']}>{species || '-'}</span>
        </div>
        <div className={styles['official-field']}>
          <span className={styles['official-label']}>Subclass</span>
          <span className={styles['official-value']}>{subclass || '-'}</span>
        </div>
      </div>
    </div>
  );
};
