import React, { useState } from 'react';

interface Character {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  total_strength?: number;
  total_dexterity?: number;
  total_constitution?: number;
  total_intelligence?: number;
  total_wisdom?: number;
  total_charisma?: number;
  proficiency_bonus: number;
  saving_throw_proficiencies?: string[] | Record<string, any> | string | null;
  character_class?: any;
}

interface SavingThrowsProps {
  character: Character;
}

interface SaveResult {
  ability: string;
  roll: number;
  bonus: number;
  total: number;
  timestamp: number;
}

const SAVING_THROWS = {
  strength: 'Strength',
  dexterity: 'Dexterity', 
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

const ABILITY_ALIAS_MAP: Record<string, string> = {
  str: 'strength',
  strength: 'strength',
  dex: 'dexterity',
  dexterity: 'dexterity',
  con: 'constitution',
  constitution: 'constitution',
  int: 'intelligence',
  intelligence: 'intelligence',
  wis: 'wisdom',
  wisdom: 'wisdom',
  cha: 'charisma',
  charisma: 'charisma',
};

export const SavingThrows: React.FC<SavingThrowsProps> = ({ character }) => {
  const [saveResults, setSaveResults] = useState<SaveResult[]>([]);
  const [advantage, setAdvantage] = useState<string | null>(null);
  const [disadvantage, setDisadvantage] = useState<string | null>(null);

  const normalizeToArray = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (value == null) return [];

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];

      // Python-style list literal: ['Wisdom', 'Charisma']
      if (trimmed.startsWith('[')) {
        // Try standard JSON first
        try {
          const parsed = JSON.parse(trimmed);
          return normalizeToArray(parsed);
        } catch {
          // Fall back: treat as Python list with single quotes
          const inner = trimmed.slice(1, -1).trim();
          if (!inner) return [];
          return inner
            .split(',')
            .map((s) => s.trim().replace(/^['"]+|['"]+$/g, '').trim())
            .filter(Boolean);
        }
      }

      if (trimmed.startsWith('{')) {
        try {
          return normalizeToArray(JSON.parse(trimmed));
        } catch {
          return [value];
        }
      }

      // Comma-separated plain string e.g. "Wisdom, Charisma"
      if (trimmed.includes(',')) {
        return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      }

      return [value];
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, any>;
      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.results)) return obj.results;
      return Object.values(obj);
    }

    return [value];
  };

  const savingThrowProficiencies = normalizeToArray(character?.saving_throw_proficiencies)
    .map((value) => {
      const raw =
        typeof value === 'string'
          ? value
          : value?.name || value?.id || value?.ability || null;

      if (!raw) return null;

      const normalized = ABILITY_ALIAS_MAP[String(raw).trim().toLowerCase()];
      if (normalized) return normalized;

      return null;
    })
    .filter(Boolean) as string[];

  // Don't render if character data isn't ready
  if (!character) {
    return <div className="saving-throws">Loading saving throws...</div>;
  }

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getSavingThrowBonus = (ability: string): number => {
    if (!character) return 0;
    
    const abilityScores: Record<string, number> = {
      strength: character.total_strength ?? character.strength ?? 10,
      dexterity: character.total_dexterity ?? character.dexterity ?? 10,
      constitution: character.total_constitution ?? character.constitution ?? 10,
      intelligence: character.total_intelligence ?? character.intelligence ?? 10,
      wisdom: character.total_wisdom ?? character.wisdom ?? 10,
      charisma: character.total_charisma ?? character.charisma ?? 10,
    };
    
    const abilityScore = abilityScores[ability] || 10;
    const abilityModifier = getAbilityModifier(abilityScore);
    
    // Check if proficient in this saving throw (from character's saving_throw_proficiencies)
    const isProficient = savingThrowProficiencies.includes(ability);
    const proficiencyBonus = isProficient ? (character.proficiency_bonus || 0) : 0;
    
    return abilityModifier + proficiencyBonus;
  };

  const rollD20 = (): number => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const rollSavingThrow = (ability: string) => {
    const bonus = getSavingThrowBonus(ability);
    let roll: number;
    
    if (advantage === ability) {
      const roll1 = rollD20();
      const roll2 = rollD20();
      roll = Math.max(roll1, roll2);
    } else if (disadvantage === ability) {
      const roll1 = rollD20();
      const roll2 = rollD20();
      roll = Math.min(roll1, roll2);
    } else {
      roll = rollD20();
    }
    
    const total = roll + bonus;
    
    const result: SaveResult = {
      ability,
      roll,
      bonus,
      total,
      timestamp: Date.now(),
    };
    
    setSaveResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    
    // Clear advantage/disadvantage after roll
    setAdvantage(null);
    setDisadvantage(null);
  };

  const isProficient = (ability: string): boolean => {
    return savingThrowProficiencies.includes(ability);
  };

  return (
    <div className="saving-throws">
      <div className="save-modifiers">
        <h4>Save Modifiers</h4>
        <div className="modifier-buttons">
          <button
            className={`btn-small ${advantage ? 'active' : ''}`}
            onClick={() => {
              setAdvantage(advantage ? null : 'next');
              setDisadvantage(null);
            }}
          >
            Advantage
          </button>
          <button
            className={`btn-small ${disadvantage ? 'active' : ''}`}
            onClick={() => {
              setDisadvantage(disadvantage ? null : 'next');
              setAdvantage(null);
            }}
          >
            Disadvantage
          </button>
        </div>
      </div>

      <div className="saves-list">
        {Object.entries(SAVING_THROWS).map(([abilityKey, abilityName]) => {
          const bonus = getSavingThrowBonus(abilityKey);
          const proficient = isProficient(abilityKey);
          const proficiencyState = proficient ? 'proficient' : 'none';
          
          return (
            <div key={abilityKey} className="save-row">
              <div className="save-info">
                <span className={`proficiency-dot ${proficiencyState}`} aria-hidden="true" />
                <span className="save-name">{abilityName}</span>
              </div>
              
              <button
                type="button"
                className={`save-bonus bonus-roll-button ${
                  advantage === abilityKey ? 'advantage' : disadvantage === abilityKey ? 'disadvantage' : ''
                }`}
                onClick={() => {
                  if (advantage === 'next') {
                    setAdvantage(abilityKey);
                  } else if (disadvantage === 'next') {
                    setDisadvantage(abilityKey);
                  }
                  rollSavingThrow(abilityKey);
                }}
              >
                {bonus >= 0 ? '+' : ''}{bonus}
              </button>
            </div>
          );
        })}
      </div>

      {saveResults.length > 0 && (
        <div className="save-history">
          <h4>Recent Saves</h4>
          <div className="save-results">
            {saveResults.map((result) => (
              <div key={`${result.ability}-${result.timestamp}`} className="roll-result">
                <div className="result-header">
                  {SAVING_THROWS[result.ability as keyof typeof SAVING_THROWS]} Save: {result.total}
                </div>
                <div className="result-details">
                  d20: {result.roll} + {result.bonus}
                  {result.roll === 20 && ' (Critical Success!)'}
                  {result.roll === 1 && ' (Critical Failure!)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};