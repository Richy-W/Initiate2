import React from 'react';
import '../../styles/OfficialIdentityHeader.css';

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
    <div className={`official-sheet-header ${compact ? 'compact' : ''}`}>
      <div className="official-header-row official-header-row-1">
        <div className="official-field official-character-name">
          <span className="official-label">Character Name</span>
          <span className="official-value official-value-large">{name || 'Unknown Character'}</span>
        </div>
        <div className="official-level-circle" aria-label={`Level ${level}`}>
          <span className="official-level-value">{level}</span>
          <span className="official-level-label">Level</span>
        </div>
      </div>

      <div className="official-header-row official-header-row-2">
        <div className="official-field">
          <span className="official-label">Background</span>
          <span className="official-value">{background || '-'}</span>
        </div>
        <div className="official-field">
          <span className="official-label">Class</span>
          <span className="official-value">{characterClass || '-'}</span>
        </div>
        <div className="official-field">
          <span className="official-label">Species</span>
          <span className="official-value">{species || '-'}</span>
        </div>
        <div className="official-field">
          <span className="official-label">Subclass</span>
          <span className="official-value">{subclass || '-'}</span>
        </div>
      </div>
    </div>
  );
};
