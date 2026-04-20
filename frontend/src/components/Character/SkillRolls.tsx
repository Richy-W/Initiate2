import React, { useState } from 'react';
import styles from './CharacterSheet.module.css';

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
  skills?: Record<string, any>;
  skill_proficiencies?: any[];
  skill_expertises?: any[];
  skill_proficiencies_detail?: any[];
  skill_expertises_detail?: any[];
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

  // Don't render if character data isn't ready
  if (!character) {
    return <div className={styles['skill-rolls']}>Loading skill rolls...</div>;
  }

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const normalizeSkillToken = (value: unknown): string =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const normalizeToArray = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (value == null) return [];

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          return normalizeToArray(JSON.parse(trimmed));
        } catch {
          return [value];
        }
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

  const proficiencyTokens = new Set(
    [
      ...normalizeToArray(character.skill_proficiencies),
      ...normalizeToArray(character.skill_proficiencies_detail),
    ]
      .map((entry) => {
        if (typeof entry === 'string') return normalizeSkillToken(entry);
        if (entry?.name) return normalizeSkillToken(entry.name);
        if (entry?.id) return normalizeSkillToken(entry.id);
        return '';
      })
      .filter(Boolean)
  );

  const expertiseTokens = new Set(
    [
      ...normalizeToArray(character.skill_expertises),
      ...normalizeToArray(character.skill_expertises_detail),
    ]
      .map((entry) => {
        if (typeof entry === 'string') return normalizeSkillToken(entry);
        if (entry?.name) return normalizeSkillToken(entry.name);
        if (entry?.id) return normalizeSkillToken(entry.id);
        return '';
      })
      .filter(Boolean)
  );

  const hasSkillMatch = (tokens: Set<string>, skillKey: string, skillName: string): boolean => {
    const normalizedKey = normalizeSkillToken(skillKey);
    const normalizedName = normalizeSkillToken(skillName);
    return tokens.has(normalizedKey) || tokens.has(normalizedName);
  };

  const getSkillBonus = (skill: string): number => {
    const skillData = SKILLS[skill as keyof typeof SKILLS];
    
    const abilityScores = {
      strength: character.total_strength ?? character.strength ?? 10,
      dexterity: character.total_dexterity ?? character.dexterity ?? 10,
      constitution: character.total_constitution ?? character.constitution ?? 10,
      intelligence: character.total_intelligence ?? character.intelligence ?? 10,
      wisdom: character.total_wisdom ?? character.wisdom ?? 10,
      charisma: character.total_charisma ?? character.charisma ?? 10,
    };
    
    const abilityScore = abilityScores[skillData.ability as keyof typeof abilityScores] || 10;
    const abilityModifier = getAbilityModifier(abilityScore);
    
    // Check if the character is proficient in this skill
    const isProficient = hasSkillMatch(proficiencyTokens, skill, skillData.name);
    
    // Check if the character has expertise in this skill 
    const hasExpertise = hasSkillMatch(expertiseTokens, skill, skillData.name);
    
    let proficiencyBonus = 0;
    if (hasExpertise) {
      proficiencyBonus = (character.proficiency_bonus || 0) * 2; // Expertise = double proficiency
    } else if (isProficient) {
      proficiencyBonus = character.proficiency_bonus || 0;
    }
    
    return abilityModifier + proficiencyBonus;
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
    const skillData = SKILLS[skill as keyof typeof SKILLS];
    return hasSkillMatch(proficiencyTokens, skill, skillData.name);
  };

  const hasExpertise = (skill: string): boolean => {
    const skillData = SKILLS[skill as keyof typeof SKILLS];
    return hasSkillMatch(expertiseTokens, skill, skillData.name);
  };

  return (
    <div className={styles['skill-rolls']}>
      <div className={styles['roll-modifiers']}>
        <h4>Roll Modifiers</h4>
        <div className={styles['modifier-buttons']}>
          <button
            className={[styles['btn-small'], advantage ? styles['active'] : ''].filter(Boolean).join(' ')}
            onClick={() => {
              setAdvantage(advantage ? null : 'next');
              setDisadvantage(null);
            }}
          >
            Advantage
          </button>
          <button
            className={[styles['btn-small'], disadvantage ? styles['active'] : ''].filter(Boolean).join(' ')}
            onClick={() => {
              setDisadvantage(disadvantage ? null : 'next');
              setAdvantage(null);
            }}
          >
            Disadvantage
          </button>
        </div>
      </div>

      <div className={styles['skills-list']}>
        {Object.entries(SKILLS).map(([skillKey, skillData]) => {
          const bonus = getSkillBonus(skillKey);
          const proficient = isProficient(skillKey);
          const expertise = hasExpertise(skillKey);
          const proficiencyState = expertise ? 'expertise' : proficient ? 'proficient' : 'none';
          
          return (
            <div key={skillKey} className={styles['skill-row']}>
              <div className={styles['skill-info']}>
                <span className={[styles['proficiency-dot'], styles[proficiencyState]].filter(Boolean).join(' ')} aria-hidden="true" />
                <span className={styles['skill-name']}>{skillData.name}</span>
                <span className={styles['skill-meta']}>
                  {skillData.ability.slice(0, 3).toUpperCase()}
                </span>
              </div>
              
              <button
                type="button"
                className={[styles['skill-bonus'], styles['bonus-roll-button'], advantage === skillKey ? styles['advantage'] : disadvantage === skillKey ? styles['disadvantage'] : ''].filter(Boolean).join(' ')}
                onClick={() => {
                  if (advantage === 'next') {
                    setAdvantage(skillKey);
                  } else if (disadvantage === 'next') {
                    setDisadvantage(skillKey);
                  }
                  rollSkill(skillKey);
                }}
              >
                {bonus >= 0 ? '+' : ''}{bonus}
              </button>
            </div>
          );
        })}
      </div>

      {rollResults.length > 0 && (
        <div className={styles['skill-history']}>
          <h4>Recent Rolls</h4>
          <div className={styles['skill-results']}>
            {rollResults.map((result) => (
              <div key={`${result.skill}-${result.timestamp}`} className={styles['roll-result']}>
                <div className={styles['result-header']}>
                  {SKILLS[result.skill as keyof typeof SKILLS].name}: {result.total}
                </div>
                <div className={styles['result-details']}>
                  d20: {result.roll} + {result.bonus}
                  {result.roll === 20 && ' (Natural 20!)'}
                  {result.roll === 1 && ' (Natural 1!)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};