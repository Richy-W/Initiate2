import React, { useState } from 'react';

interface Character {
  ability_scores: Record<string, number>;
  proficiency_bonus: number;
  class_primary: any;
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

export const SavingThrows: React.FC<SavingThrowsProps> = ({ character }) => {
  const [saveResults, setSaveResults] = useState<SaveResult[]>([]);
  const [advantage, setAdvantage] = useState<string | null>(null);
  const [disadvantage, setDisadvantage] = useState<string | null>(null);

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getSavingThrowBonus = (ability: string): number => {
    const abilityScore = character.ability_scores[ability] || 10;
    const abilityModifier = getAbilityModifier(abilityScore);
    
    // Check if proficient in this saving throw (from class)
    const isProficient = character.class_primary?.saving_throw_proficiencies?.includes(ability) || false;
    const proficiencyBonus = isProficient ? character.proficiency_bonus : 0;
    
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
    return character.class_primary?.saving_throw_proficiencies?.includes(ability) || false;
  };

  return (
    <div className="saving-throws">
      <div className="save-modifiers">
        <h4>Save Modifiers</h4>
        <div className="modifier-buttons">
          <button
            className={`btn btn-small ${advantage ? 'active' : ''}`}
            onClick={() => {
              setAdvantage(advantage ? null : 'next');
              setDisadvantage(null);
            }}
          >
            Advantage
          </button>
          <button
            className={`btn btn-small ${disadvantage ? 'active' : ''}`}
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
          
          return (
            <div key={abilityKey} className="save-row">
              <div className="save-info">
                <span className="save-name">{abilityName}</span>
                {proficient && <span className="proficiency-indicator">●</span>}
              </div>
              
              <div className="save-bonus">
                {bonus >= 0 ? '+' : ''}{bonus}
              </div>
              
              <button
                className={`btn btn-roll ${
                  advantage === abilityKey ? 'advantage' :
                  disadvantage === abilityKey ? 'disadvantage' : ''
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
                Roll
              </button>
            </div>
          );
        })}
      </div>

      {saveResults.length > 0 && (
        <div className="save-history">
          <h4>Recent Saves</h4>
          <div className="save-results">
            {saveResults.map((result, index) => (
              <div key={`${result.ability}-${result.timestamp}`} className="save-result">
                <span className="save-ability">{SAVING_THROWS[result.ability as keyof typeof SAVING_THROWS]}:</span>
                <span className="save-dice">d20: {result.roll}</span>
                <span className="save-bonus">+{result.bonus}</span>
                <span className={`save-total ${
                  result.roll === 20 ? 'critical-success' :
                  result.roll === 1 ? 'critical-failure' : ''
                }`}>
                  = {result.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="save-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <span>● Proficient</span>
        </div>
      </div>
    </div>
  );
};