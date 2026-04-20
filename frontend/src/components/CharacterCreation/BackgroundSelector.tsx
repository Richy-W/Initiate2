import React, { useState, useEffect } from 'react';
import styles from './CharacterWizard.module.css';import { contentAPI } from '../../services/apiClient';

// Standard D&D languages - Updated for cache clear
const STANDARD_LANGUAGES = [
  'Common', 'Draconic', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 
  'Goblin', 'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Deep Speech',
  'Infernal', 'Primordial', 'Sylvan', 'Undercommon'
];

interface Background {
  id: string;
  name: string;
  description: string;
  abilityScoreIncrease?: {
    choices: string[];
    points: number;
  };
  feat?: {
    name: string;
    type: string;
    description: string;
  };
  skillProficiencies: string[];
  toolProficiency?: {
    fixed?: string;
    choice?: {
      count: number;
      type: string;
    };
  };
  languageProficiency?: {
    choice?: {
      count: number;
      type: string;
    };
  };
  startingEquipment?: {
    options: Array<{
      choice: string;
      items: string[];
      gold: number;
    }>;
  };
  sourceBook?: string;
}

interface BackgroundSelectorProps {
  selectedBackground: Background | null;
  abilityPointDistribution?: Record<string, number>;
  selectedLanguage?: string;
  selectedEquipmentOption?: string;
  onBackgroundSelect: (background: Background, distribution?: Record<string, number>, language?: string, equipmentOption?: string) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  abilityPointDistribution: propDistribution,
  selectedLanguage: propLanguage,
  selectedEquipmentOption: propEquipmentOption,
  onBackgroundSelect,
}) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abilityPointDistribution, setAbilityPointDistribution] = useState<Record<string, number>>(propDistribution || {});
  const [selectedLanguage, setSelectedLanguage] = useState<string>(propLanguage || '');
  const [selectedEquipmentOption, setSelectedEquipmentOption] = useState<string>(propEquipmentOption || 'A');

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setLoading(true);
        const response = await contentAPI.backgrounds.list();
        setBackgrounds(response.results || response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load backgrounds');
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  // Sync with incoming props
  useEffect(() => {
    if (propDistribution) {
      setAbilityPointDistribution(propDistribution);
    }
  }, [propDistribution]);

  useEffect(() => {
    if (propLanguage) {
      setSelectedLanguage(propLanguage);
    }
  }, [propLanguage]);

  useEffect(() => {
    if (propEquipmentOption) {
      setSelectedEquipmentOption(propEquipmentOption);
    }
  }, [propEquipmentOption]);

  // Notify parent when any values change
  useEffect(() => {
    if (selectedBackground) {
      onBackgroundSelect(selectedBackground, abilityPointDistribution, selectedLanguage, selectedEquipmentOption);
    }
  }, [abilityPointDistribution, selectedLanguage, selectedEquipmentOption, selectedBackground, onBackgroundSelect]);

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selectedBackground = backgrounds.find(bg => bg.id === selectedId);
      if (selectedBackground) {
        // Reset ability point distribution
        const initialDistribution: Record<string, number> = {};
        selectedBackground.abilityScoreIncrease?.choices.forEach(ability => {
          initialDistribution[ability] = 0;
        });
        setAbilityPointDistribution(initialDistribution);
        setSelectedLanguage('');
        setSelectedEquipmentOption('A');
        onBackgroundSelect(selectedBackground, initialDistribution, '', 'A');
      }
    }
  };

  const handleAbilityPointChange = (ability: string, change: number) => {
    if (!selectedBackground?.abilityScoreIncrease) return;
    
    const maxPoints = selectedBackground.abilityScoreIncrease.points;
    const currentTotal = Object.values(abilityPointDistribution).reduce((sum, points) => sum + points, 0);
    const currentAbilityPoints = abilityPointDistribution[ability] || 0;
    const newAbilityPoints = currentAbilityPoints + change;
    
    // Validate constraints
    if (newAbilityPoints < 0 || newAbilityPoints > 3) return;
    if (change > 0 && currentTotal >= maxPoints) return;
    
    setAbilityPointDistribution(prev => ({
      ...prev,
      [ability]: newAbilityPoints
    }));
  };

  if (loading) {
    return <div className={styles['loading']}>Loading backgrounds...</div>;
  }

  if (error) {
    return <div className={styles['error']}>Error: {error}</div>;
  }

  return (
    <div className={styles['background-selector']}>
      <h2>Choose Your Background</h2>
      
      <div className={styles['background-dropdown']}>
        <label htmlFor="background-select">Select a background:</label>
        <select
          id="background-select"
          value={selectedBackground?.id || ''}
          onChange={handleBackgroundChange}
          className={styles['background-select']}
        >
          <option value="">-- Choose a background --</option>
          {backgrounds.map((bg) => (
            <option key={bg.id} value={bg.id}>
              {bg.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBackground && (
        <div className={styles['background-details']}>
          <div className={[styles['background-card'], styles['selected']].filter(Boolean).join(' ')}>
            <h3>{selectedBackground.name}</h3>
            <p className={styles['description']}>{selectedBackground.description}</p>
            
            <div className={styles['background-info']}>
              {selectedBackground.abilityScoreIncrease && (
                <div className={styles['ability-increases']}>
                  <strong>Ability Score Increase:</strong>
                  <p>
                    Distribute {selectedBackground.abilityScoreIncrease.points} points among the following abilities 
                    (max +3 per ability):
                  </p>
                  <div className={styles['ability-point-distribution']}>
                    {selectedBackground.abilityScoreIncrease.choices.map(ability => {
                      const currentPoints = abilityPointDistribution[ability] || 0;
                      const totalAssigned = Object.values(abilityPointDistribution).reduce((sum, points) => sum + points, 0);
                      const maxPoints = selectedBackground.abilityScoreIncrease!.points;
                      
                      return (
                        <div key={ability} className={styles['ability-point-row']}>
                          <label className={styles['ability-name']}>{ability}</label>
                          <div className={styles['point-controls']}>
                            <button
                              type="button"
                              className={[styles['point-btn'], styles['decrease']].filter(Boolean).join(' ')}
                              onClick={() => handleAbilityPointChange(ability, -1)}
                              disabled={currentPoints === 0}
                            >
                              −
                            </button>
                            <div className={styles['point-display']}>
                              <span className={styles['points']}>+{currentPoints}</span>
                            </div>
                            <button
                              type="button"
                              className={[styles['point-btn'], styles['increase']].filter(Boolean).join(' ')}
                              onClick={() => handleAbilityPointChange(ability, 1)}
                              disabled={currentPoints >= 3 || totalAssigned >= maxPoints}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles['points-summary']}>
                    <span className={styles['points-used']}>
                      {Object.values(abilityPointDistribution).reduce((sum, points) => sum + points, 0)} / {selectedBackground.abilityScoreIncrease.points} points used
                    </span>
                  </div>
                </div>
              )}
              
              <div className={styles['proficiencies']}>
                <div className={styles['skills']}>
                  <strong>Skill Proficiencies:</strong>
                  <p>{selectedBackground.skillProficiencies?.join(', ') || 'None'}</p>
                </div>
                
                {selectedBackground.toolProficiency && (
                  <div className={styles['tools']}>
                    <strong>Tool Proficiencies:</strong>
                    <p>{
                      selectedBackground.toolProficiency.fixed ||
                      (selectedBackground.toolProficiency.choice ? 
                        `${selectedBackground.toolProficiency.choice.count} ${selectedBackground.toolProficiency.choice.type} tool(s) of your choice` :
                        'None'
                      )
                    }</p>
                  </div>
                )}
                
                {selectedBackground.languageProficiency?.choice && (
                  <div className={styles['languages']}>
                    <strong>Languages:</strong>
                    <p>Choose {selectedBackground.languageProficiency.choice.count} {selectedBackground.languageProficiency.choice.type} language:</p>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className={styles['language-select']}
                    >
                      <option value="">-- Choose a language --</option>
                      {STANDARD_LANGUAGES.map(language => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {selectedBackground.feat && (
                <div className={styles['background-feat']}>
                  <h4>Origin Feat: {selectedBackground.feat.name}</h4>
                  <p>{selectedBackground.feat.description}</p>
                </div>
              )}
              
              {selectedBackground.startingEquipment && (
                <div className={styles['starting-equipment']}>
                  <h4>Starting Equipment</h4>
                  <div className={styles['equipment-choice']}>
                    <p><strong>Choose your starting equipment option:</strong></p>
                    <div className={styles['equipment-options']}>
                      {selectedBackground.startingEquipment.options.map((option) => (
                        <div key={option.choice} className={styles['equipment-option-container']}>
                          <label className={styles['equipment-option-label']}>
                            <input
                              type="radio"
                              name="equipment-option"
                              value={option.choice}
                              checked={selectedEquipmentOption === option.choice}
                              onChange={(e) => setSelectedEquipmentOption(e.target.value)}
                            />
                            <strong>Option {option.choice}:</strong>
                          </label>
                          <div className={[styles['equipment-option-details'], selectedEquipmentOption === option.choice ? styles['selected'] : ''].filter(Boolean).join(' ')}>
                            {option.items.length > 0 ? (
                              <ul>
                                {option.items.map((item, itemIndex) => (
                                  <li key={itemIndex}>{item}</li>
                                ))}
                                <li><strong>{option.gold} gold pieces</strong></li>
                              </ul>
                            ) : (
                              <ul>
                                <li><strong>{option.gold} gold pieces</strong></li>
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};