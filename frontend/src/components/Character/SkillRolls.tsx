import React, { useState } from 'react';

interface Character {
  ability_scores: Record<string, number>;
  skills: Record<string, any>;
  proficiency_bonus: number;
}

interface SkillRollsProps {
  character: Character;
}

interface RollResult {
  skill: string;
  roll: number;
  bonus: number;
  total: number;
  timestamp: number;
}

const SKILLS = {
  'acrobatics': { ability: 'dexterity', name: 'Acrobatics' },
  'animal_handling': { ability: 'wisdom', name: 'Animal Handling' },
  'arcana': { ability: 'intelligence', name: 'Arcana' },
  'athletics': { ability: 'strength', name: 'Athletics' },
  'deception': { ability: 'charisma', name: 'Deception' },
  'history': { ability: 'intelligence', name: 'History' },
  'insight': { ability: 'wisdom', name: 'Insight' },
  'intimidation': { ability: 'charisma', name: 'Intimidation' },
  'investigation': { ability: 'intelligence', name: 'Investigation' },
  'medicine': { ability: 'wisdom', name: 'Medicine' },
  'nature': { ability: 'intelligence', name: 'Nature' },
  'perception': { ability: 'wisdom', name: 'Perception' },
  'performance': { ability: 'charisma', name: 'Performance' },
  'persuasion': { ability: 'charisma', name: 'Persuasion' },
  'religion': { ability: 'intelligence', name: 'Religion' },
  'sleight_of_hand': { ability: 'dexterity', name: 'Sleight of Hand' },
  'stealth': { ability: 'dexterity', name: 'Stealth' },
  'survival': { ability: 'wisdom', name: 'Survival' },
};

export const SkillRolls: React.FC<SkillRollsProps> = ({ character }) => {
  const [rollResults, setRollResults] = useState<RollResult[]>([]);
  const [advantage, setAdvantage] = useState<string | null>(null);
  const [disadvantage, setDisadvantage] = useState<string | null>(null);

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getSkillBonus = (skill: string): number => {
    const skillData = SKILLS[skill as keyof typeof SKILLS];
    const abilityScore = character.ability_scores[skillData.ability] || 10;
    const abilityModifier = getAbilityModifier(abilityScore);
    const proficiencyBonus = character.skills[skill]?.proficient ? character.proficiency_bonus : 0;
    const expertiseBonus = character.skills[skill]?.expertise ? character.proficiency_bonus : 0;
    
    return abilityModifier + proficiencyBonus + expertiseBonus;
  };

  const rollD20 = (): number => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const rollSkill = (skill: string) => {
    const bonus = getSkillBonus(skill);
    let roll: number;
    
    if (advantage === skill) {
      const roll1 = rollD20();
      const roll2 = rollD20();
      roll = Math.max(roll1, roll2);
    } else if (disadvantage === skill) {
      const roll1 = rollD20();
      const roll2 = rollD20();
      roll = Math.min(roll1, roll2);
    } else {
      roll = rollD20();
    }
    
    const total = roll + bonus;
    
    const result: RollResult = {
      skill,
      roll,
      bonus,
      total,
      timestamp: Date.now(),
    };
    
    setRollResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    
    // Clear advantage/disadvantage after roll
    setAdvantage(null);
    setDisadvantage(null);
  };

  const isProficient = (skill: string): boolean => {
    return character.skills[skill]?.proficient || false;
  };

  const hasExpertise = (skill: string): boolean => {
    return character.skills[skill]?.expertise || false;
  };

  return (
    <div className="skill-rolls">
      <div className="roll-modifiers">
        <h4>Roll Modifiers</h4>
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

      <div className="skills-list">
        {Object.entries(SKILLS).map(([skillKey, skillData]) => {
          const bonus = getSkillBonus(skillKey);
          const proficient = isProficient(skillKey);
          const expertise = hasExpertise(skillKey);
          
          return (
            <div key={skillKey} className="skill-row">
              <div className="skill-info">
                <span className="skill-name">{skillData.name}</span>
                <span className="skill-ability">({skillData.ability.slice(0, 3).toUpperCase()})</span>
                {proficient && <span className="proficiency-indicator">●</span>}
                {expertise && <span className="expertise-indicator">◆</span>}
              </div>
              
              <div className="skill-bonus">
                {bonus >= 0 ? '+' : ''}{bonus}
              </div>
              
              <button
                className={`btn btn-roll ${
                  advantage === skillKey ? 'advantage' :
                  disadvantage === skillKey ? 'disadvantage' : ''
                }`}
                onClick={() => {
                  if (advantage === 'next') {
                    setAdvantage(skillKey);
                  } else if (disadvantage === 'next') {
                    setDisadvantage(skillKey);
                  }
                  rollSkill(skillKey);
                }}
              >
                Roll
              </button>
            </div>
          );
        })}
      </div>

      {rollResults.length > 0 && (
        <div className="roll-history">
          <h4>Recent Rolls</h4>
          <div className="roll-results">
            {rollResults.map((result, index) => (
              <div key={`${result.skill}-${result.timestamp}`} className="roll-result">
                <span className="roll-skill">{SKILLS[result.skill as keyof typeof SKILLS].name}:</span>
                <span className="roll-dice">d20: {result.roll}</span>
                <span className="roll-bonus">+{result.bonus}</span>
                <span className={`roll-total ${
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
      
      <div className="skill-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <span>● Proficient</span>
          <span>◆ Expertise (double proficiency)</span>
        </div>
      </div>
    </div>
  );
};