import React from 'react';
import { Character } from '../../types';
import './EncumbranceStatus.css';

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
    <div className={`encumbrance-status ${getEncumbranceColor(encumbranceStatus)} ${className}`}>
      <div className="encumbrance-header">
        <span className="encumbrance-icon">
          {getEncumbranceIcon(encumbranceStatus)}
        </span>
        <div className="encumbrance-info">
          <div className="weight-display">
            <span className="current-weight">
              {formatWeight(character.total_weight || 0)} lb
            </span>
            <span className="weight-separator">/</span>
            <span className="max-weight">
              {formatWeight(character.carrying_capacity || 0)} lb
            </span>
          </div>
          <div className="encumbrance-label">
            {encumbranceStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
        <div className="encumbrance-percentage">
          {Math.round(weightPercentage)}%
        </div>
      </div>

      <div className="weight-bar">
        <div 
          className={`weight-fill ${getEncumbranceColor(encumbranceStatus)}`}
          style={{ width: `${Math.min(weightPercentage, 100)}%` }}
        />
        {weightPercentage > 100 && (
          <div 
            className="weight-overflow"
            style={{ width: `${Math.min(weightPercentage - 100, 100)}%` }}
          />
        )}
        {/* Encumbrance thresholds */}
        <div className="threshold normal-threshold" title="Normal carrying capacity" />
        <div className="threshold encumbered-threshold" title="Heavily encumbered at 200%" />
      </div>

      {detailed && (
        <div className="encumbrance-details">
          {encumbranceEffects.speed_penalty > 0 && (
            <div className="penalty-item speed-penalty">
              <span className="penalty-icon">🏃</span>
              <span className="penalty-text">
                Speed {character.effective_speed} ft 
                {encumbranceEffects.speed_penalty > 0 && 
                  ` (-${encumbranceEffects.speed_penalty} ft)`
                }
              </span>
            </div>
          )}
          
          {encumbranceEffects.disadvantage_checks && (
            <div className="penalty-item disadvantage-penalty">
              <span className="penalty-icon">🎲</span>
              <span className="penalty-text">
                Disadvantage on ability checks, attack rolls, and saves using Str, Dex, or Con
              </span>
            </div>
          )}
          
          {encumbranceStatus === 'normal' && (
            <div className="penalty-item no-penalty">
              <span className="penalty-icon">✅</span>
              <span className="penalty-text">
                No encumbrance penalties
              </span>
            </div>
          )}
        </div>
      )}

      {!detailed && encumbranceStatus !== 'normal' && (
        <div className="encumbrance-summary">
          {encumbranceEffects.description}
        </div>
      )}
    </div>
  );
};

export default EncumbranceStatus;