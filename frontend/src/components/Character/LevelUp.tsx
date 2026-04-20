import React, { useState } from 'react';
import { characterAPI } from '../../services/apiClient';
import { Character } from '../../types';

interface LevelUpProps {
  character: Character;
  onLevelUp: (updatedCharacter: Character) => void;
  onClose: () => void;
}

interface LevelUpData {
  hitPointRoll: number;
  hitPointsGained: number;
  newFeatures: any[];
  abilityScoreImprovement?: {
    ability1: string;
    ability2?: string;
  };
}

export const LevelUp: React.FC<LevelUpProps> = ({ character, onLevelUp, onClose }) => {
  const [levelUpData, setLevelUpData] = useState<LevelUpData>({
    hitPointRoll: 0,
    hitPointsGained: 0,
    newFeatures: [],
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRolledHP, setHasRolledHP] = useState(false);

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getConstitutionModifier = (): number => {
    return getAbilityModifier(character.constitution || 10);
  };

  const getHitDie = (): number => {
    return character.character_class?.hit_die || 6;
  };

  const rollHitPoints = () => {
    const hitDie = getHitDie();
    const roll = Math.floor(Math.random() * hitDie) + 1;
    const constitutionModifier = getConstitutionModifier();
    const hitPointsGained = roll + constitutionModifier;
    
    setLevelUpData({
      ...levelUpData,
      hitPointRoll: roll,
      hitPointsGained: Math.max(1, hitPointsGained), // Minimum 1 HP per level
    });
    setHasRolledHP(true);
  };

  const takeAverageHitPoints = () => {
    const hitDie = getHitDie();
    const average = Math.floor(hitDie / 2) + 1; // Average of hit die
    const constitutionModifier = getConstitutionModifier();
    const hitPointsGained = average + constitutionModifier;
    
    setLevelUpData({
      ...levelUpData,
      hitPointRoll: average,
      hitPointsGained: Math.max(1, hitPointsGained),
    });
    setHasRolledHP(true);
  };

  const isAbilityScoreImprovementLevel = (): boolean => {
    const newLevel = character.level + 1;
    // Most classes get ASI at levels 4, 8, 12, 16, 19
    return [4, 8, 12, 16, 19].includes(newLevel);
  };

  const getNewFeatures = (): any[] => {
    const newLevel = character.level + 1;
    const classFeatures = character.character_class?.features || [];
    return classFeatures.filter((feature: any) => feature.level === newLevel);
  };

  const handleAbilityScoreImprovement = (ability1: string, ability2?: string) => {
    setLevelUpData({
      ...levelUpData,
      abilityScoreImprovement: { ability1, ability2 },
    });
  };

  const completeLevelUp = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const levelUpPayload = {
        level: character.level + 1,
        hit_points_gained: levelUpData.hitPointsGained,
        ability_score_improvements: levelUpData.abilityScoreImprovement,
      };
      
      const updatedCharacter = await characterAPI.levelUp(character.id, levelUpPayload);
      onLevelUp(updatedCharacter);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to level up character');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    'Hit Points',
    ...(isAbilityScoreImprovementLevel() ? ['Ability Score Improvement'] : []),
    'Features',
    'Confirm',
  ];

  const renderStepContent = () => {
    const currentStepName = steps[currentStep];
    
    switch (currentStepName) {
      case 'Hit Points':
        return (
          <div className="level-up-step">
            <h3>Gain Hit Points</h3>
            <p>Your hit die: d{getHitDie()}</p>
            <p>Constitution modifier: {getConstitutionModifier() >= 0 ? '+' : ''}{getConstitutionModifier()}</p>
            
            {!hasRolledHP ? (
              <div className="hp-options">
                <div className="hp-option">
                  <button onClick={rollHitPoints} className="btn btn-primary">
                    Roll Hit Points (1d{getHitDie()} + {getConstitutionModifier()})
                  </button>
                  <p>Roll for potentially higher hit points</p>
                </div>
                
                <div className="hp-option">
                  <button onClick={takeAverageHitPoints} className="btn btn-secondary">
                    Take Average ({Math.floor(getHitDie() / 2) + 1} + {getConstitutionModifier()})
                  </button>
                  <p>Take the average for consistent growth</p>
                </div>
              </div>
            ) : (
              <div className="hp-result">
                <h4>Hit Points Gained: {levelUpData.hitPointsGained}</h4>
                <p>Roll: {levelUpData.hitPointRoll} + {getConstitutionModifier()} = {levelUpData.hitPointsGained}</p>
                <p>New Maximum HP: {character.max_hit_points + levelUpData.hitPointsGained}</p>
                
                <button 
                  onClick={() => {
                    setHasRolledHP(false);
                    setLevelUpData({ ...levelUpData, hitPointRoll: 0, hitPointsGained: 0 });
                  }}
                  className="btn btn-small"
                >
                  Reroll
                </button>
              </div>
            )}
          </div>
        );
        
      case 'Ability Score Improvement':
        return (
          <div className="level-up-step">
            <h3>Ability Score Improvement</h3>
            <p>Choose how to improve your ability scores:</p>
            
            <div className="asi-options">
              <div className="asi-option">
                <h4>Increase Two Different Abilities (+1 each)</h4>
                <div className="ability-selectors">
                  <select 
                    onChange={(e) => handleAbilityScoreImprovement(e.target.value, levelUpData.abilityScoreImprovement?.ability2)}
                    value={levelUpData.abilityScoreImprovement?.ability1 || ''}
                  >
                    <option value="">Choose first ability...</option>
                    {[
                      { key: 'strength', name: 'Strength', value: character.strength },
                      { key: 'dexterity', name: 'Dexterity', value: character.dexterity },
                      { key: 'constitution', name: 'Constitution', value: character.constitution },
                      { key: 'intelligence', name: 'Intelligence', value: character.intelligence },
                      { key: 'wisdom', name: 'Wisdom', value: character.wisdom },
                      { key: 'charisma', name: 'Charisma', value: character.charisma },
                    ].map(({ key, name, value }) => (
                      <option key={key} value={key}>
                        {name} ({value})
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    onChange={(e) => handleAbilityScoreImprovement(levelUpData.abilityScoreImprovement?.ability1 || '', e.target.value)}
                    value={levelUpData.abilityScoreImprovement?.ability2 || ''}
                  >
                    <option value="">Choose second ability...</option>
                    {[
                      { key: 'strength', name: 'Strength', value: character.strength },
                      { key: 'dexterity', name: 'Dexterity', value: character.dexterity },
                      { key: 'constitution', name: 'Constitution', value: character.constitution },
                      { key: 'intelligence', name: 'Intelligence', value: character.intelligence },
                      { key: 'wisdom', name: 'Wisdom', value: character.wisdom },
                      { key: 'charisma', name: 'Charisma', value: character.charisma },
                    ].map(({ key, name, value }) => (
                      <option 
                        key={key} 
                        value={key}
                        disabled={key === levelUpData.abilityScoreImprovement?.ability1}
                      >
                        {name} ({value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="asi-option">
                <h4>Increase One Ability (+2)</h4>
                <select 
                  onChange={(e) => handleAbilityScoreImprovement(e.target.value)}
                  value={levelUpData.abilityScoreImprovement?.ability1 || ''}
                >
                  <option value="">Choose ability...</option>
                  {[
                    { key: 'strength', name: 'Strength', value: character.strength },
                    { key: 'dexterity', name: 'Dexterity', value: character.dexterity },
                    { key: 'constitution', name: 'Constitution', value: character.constitution },
                    { key: 'intelligence', name: 'Intelligence', value: character.intelligence },
                    { key: 'wisdom', name: 'Wisdom', value: character.wisdom },
                    { key: 'charisma', name: 'Charisma', value: character.charisma },
                  ].map(({ key, name, value }) => (
                    <option key={key} value={key}>
                      {name} ({value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'Features':
        const newFeatures = getNewFeatures();
        return (
          <div className="level-up-step">
            <h3>New Class Features</h3>
            {newFeatures.length > 0 ? (
              <div className="new-features">
                {newFeatures.map((feature, index) => (
                  <div key={index} className="feature">
                    <h4>{feature.name}</h4>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No new features at this level.</p>
            )}
          </div>
        );
        
      case 'Confirm':
        return (
          <div className="level-up-step">
            <h3>Confirm Level Up</h3>
            <div className="level-up-summary">
              <h4>Level {character.level} → {character.level + 1}</h4>
              
              <div className="summary-item">
                <strong>Hit Points:</strong> {character.max_hit_points} → {character.max_hit_points + levelUpData.hitPointsGained}
                (+{levelUpData.hitPointsGained})
              </div>
              
              {levelUpData.abilityScoreImprovement && (
                <div className="summary-item">
                  <strong>Ability Score Improvements:</strong>
                  <div>
                    {levelUpData.abilityScoreImprovement.ability1}: 
                    {(character as any)[levelUpData.abilityScoreImprovement.ability1]} → 
                    {(character as any)[levelUpData.abilityScoreImprovement.ability1] + (levelUpData.abilityScoreImprovement.ability2 ? 1 : 2)}
                  </div>
                  {levelUpData.abilityScoreImprovement.ability2 && (
                    <div>
                      {levelUpData.abilityScoreImprovement.ability2}: 
                      {(character as any)[levelUpData.abilityScoreImprovement.ability2]} → 
                      {(character as any)[levelUpData.abilityScoreImprovement.ability2] + 1}
                    </div>
                  )}
                </div>
              )}
              
              {getNewFeatures().length > 0 && (
                <div className="summary-item">
                  <strong>New Features:</strong>
                  <ul>
                    {getNewFeatures().map((feature, index) => (
                      <li key={index}>{feature.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {error && (
              <div className="error-message">{error}</div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  const canProceed = () => {
    const currentStepName = steps[currentStep];
    
    switch (currentStepName) {
      case 'Hit Points':
        return hasRolledHP;
      case 'Ability Score Improvement':
        return levelUpData.abilityScoreImprovement?.ability1;
      case 'Features':
        return true;
      case 'Confirm':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="level-up-modal">
      <div className="level-up-content">
        <div className="level-up-header">
          <h2>Level Up {character.name}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        
        <div className="level-up-progress">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${index < currentStep ? 'completed' : index === currentStep ? 'current' : 'upcoming'}`}
            >
              {step}
            </div>
          ))}
        </div>
        
        <div className="level-up-body">
          {renderStepContent()}
        </div>
        
        <div className="level-up-navigation">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="btn btn-secondary"
          >
            Previous
          </button>
          
          <button
            onClick={() => {
              if (currentStep === steps.length - 1) {
                completeLevelUp();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            disabled={!canProceed() || loading}
            className="btn btn-primary"
          >
            {loading ? 'Leveling Up...' : currentStep === steps.length - 1 ? 'Confirm Level Up' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};