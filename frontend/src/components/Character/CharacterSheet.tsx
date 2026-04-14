import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { characterAPI } from '../../services/apiClient';
import { SkillRolls } from './SkillRolls';
import { AttackRolls } from './AttackRolls';
import { SavingThrows } from './SavingThrows';

interface Character {
  id: string;
  name: string;
  level: number;
  experience_points: number;
  species: any;
  class_primary: any;
  background: any;
  ability_scores: Record<string, number>;
  hit_points_current: number;
  hit_points_maximum: number;
  armor_class: number;
  proficiency_bonus: number;
  skills: Record<string, any>;
  equipment: any[];
  currency: Record<string, number>;
  notes: string;
}

export const CharacterSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await characterAPI.get(id);
        setCharacter(response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load character');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getAbilityModifierString = (score: number): string => {
    const mod = getAbilityModifier(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getSkillBonus = (skill: string): number => {
    if (!character) return 0;
    
    // Skill to ability mapping
    const skillAbilities: Record<string, keyof typeof character.ability_scores> = {
      'acrobatics': 'dexterity',
      'animal_handling': 'wisdom',
      'arcana': 'intelligence',
      'athletics': 'strength',
      'deception': 'charisma',
      'history': 'intelligence',
      'insight': 'wisdom',
      'intimidation': 'charisma',
      'investigation': 'intelligence',
      'medicine': 'wisdom',
      'nature': 'intelligence',
      'perception': 'wisdom',
      'performance': 'charisma',
      'persuasion': 'charisma',
      'religion': 'intelligence',
      'sleight_of_hand': 'dexterity',
      'stealth': 'dexterity',
      'survival': 'wisdom',
    };

    const ability = skillAbilities[skill];
    const abilityModifier = getAbilityModifier(character.ability_scores[ability] || 10);
    const proficiencyBonus = character.skills[skill]?.proficient ? character.proficiency_bonus : 0;
    const expertiseBonus = character.skills[skill]?.expertise ? character.proficiency_bonus : 0;
    
    return abilityModifier + proficiencyBonus + expertiseBonus;
  };

  const getSavingThrowBonus = (ability: string): number => {
    if (!character) return 0;
    
    const abilityScore = character.ability_scores[ability] || 10;
    const abilityModifier = getAbilityModifier(abilityScore);
    
    // Check if proficient in this saving throw (from class)
    const proficiencyBonus = character.class_primary?.saving_throw_proficiencies?.includes(ability) ?
      character.proficiency_bonus : 0;
    
    return abilityModifier + proficiencyBonus;
  };

  if (loading) {
    return <div className="loading">Loading character...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!character) {
    return <div className="error">Character not found</div>;
  }

  return (
    <div className="character-sheet">
      <div className="character-header">
        <div className="character-title">
          <h1>{character.name}</h1>
          <p className="character-subtitle">
            Level {character.level} {character.species?.name} {character.class_primary?.name}
          </p>
          <p className="character-background">
            Background: {character.background?.name}
          </p>
        </div>
        
        <div className="character-vital-stats">
          <div className="stat-block">
            <div className="stat-value">{character.armor_class}</div>
            <div className="stat-label">Armor Class</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{character.hit_points_current}/{character.hit_points_maximum}</div>
            <div className="stat-label">Hit Points</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">30 ft.</div>
            <div className="stat-label">Speed</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">+{character.proficiency_bonus}</div>
            <div className="stat-label">Proficiency</div>
          </div>
        </div>
      </div>

      <div className="character-tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats & Skills
        </button>
        <button
          className={`tab ${activeTab === 'combat' ? 'active' : ''}`}
          onClick={() => setActiveTab('combat')}
        >
          Combat
        </button>
        <button
          className={`tab ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      <div className="character-content">
        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="ability-scores">
              <h3>Ability Scores</h3>
              <div className="abilities-grid">
                {Object.entries(character.ability_scores).map(([ability, score]) => (
                  <div key={ability} className="ability-block">
                    <div className="ability-name">{ability.charAt(0).toUpperCase() + ability.slice(1)}</div>
                    <div className="ability-score">{score}</div>
                    <div className="ability-modifier">{getAbilityModifierString(score)}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="saving-throws">
              <h3>Saving Throws</h3>
              <SavingThrows character={character} />
            </div>
            
            <div className="skills">
              <h3>Skills</h3>
              <SkillRolls character={character} />
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="combat-tab">
            <AttackRolls character={character} />
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="equipment-tab">
            <h3>Equipment</h3>
            <div className="currency">
              <h4>Currency</h4>
              <div className="currency-display">
                <span>CP: {character.currency?.cp || 0}</span>
                <span>SP: {character.currency?.sp || 0}</span>
                <span>GP: {character.currency?.gp || 0}</span>
                <span>EP: {character.currency?.ep || 0}</span>
                <span>PP: {character.currency?.pp || 0}</span>
              </div>
            </div>
            
            <div className="equipment-list">
              <h4>Items</h4>
              {character.equipment && character.equipment.length > 0 ? (
                <ul>
                  {character.equipment.map((item, index) => (
                    <li key={index}>
                      {item.name || item} {item.quantity && `(${item.quantity})`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No equipment</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-tab">
            <h3>Character Notes</h3>
            <textarea
              value={character.notes || ''}
              onChange={(e) => {
                // Handle notes update - could implement auto-save
                setCharacter({ ...character, notes: e.target.value });
              }}
              className="notes-textarea"
              placeholder="Add character notes here..."
            />
          </div>
        )}
      </div>
    </div>
  );
};