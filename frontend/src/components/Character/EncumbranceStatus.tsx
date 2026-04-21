import React from 'react';
import { Character } from '../../types';
import styles from './EncumbranceStatus.module.css';

interface EncumbranceStatusProps {
  character: Character;
  className?: string;
  detailed?: boolean;
}

const EncumbranceStatus: React.FC<EncumbranceStatusProps> = ({ 
  character, 
  className = '', 
  detailed = false 
}) => {
  const getEncumbranceIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return '🎒';
      case 'encumbered':
        return '⚠️';
      case 'heavily_encumbered':
        return '🚫';
      default:
        return '🎒';
    }
  };

  const getEncumbranceColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'normal';
      case 'encumbered':
        return 'warning';
      case 'heavily_encumbered':
        return 'danger';
      default:
        return 'normal';
    }
  };

  const getWeightPercentage = () => {
    const weight = character.total_weight || 0;
    const capacity = character.carrying_capacity || 1;
    return Math.min((weight / capacity) * 100, 200); // Cap at 200% for display
  };

  const formatWeight = (weight: number) => {
    return weight.toFixed(1);
  };

  const encumbranceStatus = character.encumbrance_status || 'normal';
  const encumbranceEffects = character.encumbrance_effects || {
    speed_penalty: 0,
    disadvantage_checks: false,
    description: 'No encumbrance penalties'
  };
  const weightPercentage = getWeightPercentage();

  return (
    <div className={[styles['encumbrance-status'], styles[getEncumbranceColor(encumbranceStatus)], className].filter(Boolean).join(' ')}>
      <div className={styles['encumbrance-header']}>
        <span className={styles['encumbrance-icon']}>
          {getEncumbranceIcon(encumbranceStatus)}
        </span>
        <div className={styles['encumbrance-info']}>
          <div className={styles['weight-display']}>
            <span className={styles['current-weight']}>
              {formatWeight(character.total_weight || 0)} lb
            </span>
            <span className={styles['weight-separator']}>/</span>
            <span className={styles['max-weight']}>
              {formatWeight(character.carrying_capacity || 0)} lb
            </span>
          </div>
          <div className={styles['encumbrance-label']}>
            {encumbranceStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
        <div className={styles['encumbrance-percentage']}>
          {Math.round(weightPercentage)}%
        </div>
      </div>

      <div className={styles['weight-bar']}>
        <div 
          className={[styles['weight-fill'], styles[getEncumbranceColor(encumbranceStatus)]].filter(Boolean).join(' ')}
          style={{ width: `${Math.min(weightPercentage, 100)}%` }}
        />
        {weightPercentage > 100 && (
          <div 
            className={styles['weight-overflow']}
            style={{ width: `${Math.min(weightPercentage - 100, 100)}%` }}
          />
        )}
        {/* Encumbrance thresholds */}
        <div className={[styles['threshold'], styles['normal-threshold']].filter(Boolean).join(' ')} title="Normal carrying capacity" />
        <div className={[styles['threshold'], styles['encumbered-threshold']].filter(Boolean).join(' ')} title="Heavily encumbered at 200%" />
      </div>

      {detailed && (
        <div className={styles['encumbrance-details']}>
          {encumbranceEffects.speed_penalty > 0 && (
            <div className={[styles['penalty-item'], styles['speed-penalty']].filter(Boolean).join(' ')}>
              <span className={styles['penalty-icon']}>🏃</span>
              <span className={styles['penalty-text']}>
                Speed {character.effective_speed} ft 
                {encumbranceEffects.speed_penalty > 0 && 
                  ` (-${encumbranceEffects.speed_penalty} ft)`
                }
              </span>
            </div>
          )}
          
          {encumbranceEffects.disadvantage_checks && (
            <div className={[styles['penalty-item'], styles['disadvantage-penalty']].filter(Boolean).join(' ')}>
              <span className={styles['penalty-icon']}>🎲</span>
              <span className={styles['penalty-text']}>
                Disadvantage on ability checks, attack rolls, and saves using Str, Dex, or Con
              </span>
            </div>
          )}
          
          {encumbranceStatus === 'normal' && (
            <div className={[styles['penalty-item'], styles['no-penalty']].filter(Boolean).join(' ')}>
              <span className={styles['penalty-icon']}>✅</span>
              <span className={styles['penalty-text']}>
                No encumbrance penalties
              </span>
            </div>
          )}
        </div>
      )}

      {!detailed && encumbranceStatus !== 'normal' && (
        <div className={styles['encumbrance-summary']}>
          {encumbranceEffects.description}
        </div>
      )}
    </div>
  );
};

export default EncumbranceStatus;