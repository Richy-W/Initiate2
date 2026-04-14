import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpeciesSelector } from './SpeciesSelector';
import { ClassSelector } from './ClassSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { AbilityScores } from './AbilityScores';
import { characterAPI } from '../../services/apiClient';

export interface CharacterData {
  name: string;
  species: any;
  characterClass: any;
  selectedSkills?: string[];
  selectedEquipment?: { choice: string; items: string[]; gold: number };
  background: any;
  backgroundAbilityDistribution?: Record<string, number>;
  backgroundLanguage?: string;
  backgroundEquipmentOption?: string;
  customSize?: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  abilityScoresMethod?: 'standard-array' | 'point-buy' | 'roll';
  rolledValues?: number[];
  rollAssignments?: Record<string, number>;
  arrayAssignments?: Record<string, number>;
  pointBuyScores?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

export const CharacterWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData>({
    name: '',
    species: null,
    characterClass: null,
    selectedSkills: [],
    selectedEquipment: undefined,
    background: null,
    backgroundAbilityDistribution: {},
    backgroundLanguage: '',
    backgroundEquipmentOption: 'A',
    customSize: '',
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    abilityScoresMethod: 'standard-array',
    rolledValues: undefined,
    rollAssignments: undefined,
    arrayAssignments: undefined,
    pointBuyScores: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable callback functions to prevent infinite re-renders
  const handleSpeciesSelect = useCallback((species: any) => {
    setCharacterData(prev => ({ ...prev, species }));
  }, []);

  const handleClassSelect = useCallback((characterClass: any, skills?: string[], equipment?: { choice: string; items: string[]; gold: number }) => {
    setCharacterData(prev => ({ 
      ...prev, 
      characterClass,
      selectedSkills: skills || [],
      selectedEquipment: equipment
    }));
  }, []);

  const handleBackgroundSelect = useCallback((background: any, distribution?: Record<string, number>, language?: string, equipmentOption?: string) => {
    setCharacterData(prev => ({ 
      ...prev, 
      background,
      backgroundAbilityDistribution: distribution || {},
      backgroundLanguage: language || '',
      backgroundEquipmentOption: equipmentOption || 'A'
    }));
  }, []);

  const handleAbilityScoresChange = useCallback((
    abilityScores: any, 
    method?: 'standard-array' | 'point-buy' | 'roll',
    additionalData?: {
      rolledValues?: number[];
      rollAssignments?: Record<string, number>;
      arrayAssignments?: Record<string, number>;
      pointBuyScores?: any;
    }) => {
    setCharacterData(prev => ({ 
      ...prev, 
      abilityScores,
      ...(method && { abilityScoresMethod: method }),
      ...(additionalData?.rolledValues && { rolledValues: additionalData.rolledValues }),
      ...(additionalData?.rollAssignments && { rollAssignments: additionalData.rollAssignments }),
      ...(additionalData?.arrayAssignments && { arrayAssignments: additionalData.arrayAssignments }),
      ...(additionalData?.pointBuyScores && { pointBuyScores: additionalData.pointBuyScores }),
    }));
  }, []);

  const steps = [
    { title: 'Character Name', component: 'name' },
    { title: 'Species Selection', component: 'species' },
    { title: 'Class Selection', component: 'class' },
    { title: 'Background Selection', component: 'background' },
    { title: 'Ability Scores', component: 'abilities' },
    { title: 'Review & Create', component: 'review' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateCharacter();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCharacter = async () => {
    // Check authentication first
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You must be logged in to create a character. Please login first.');
      return;
    }

    // Validate required fields
    if (!characterData.name?.trim()) {
      setError('Character name is required');
      return;
    }
    if (!characterData.species?.id) {
      setError('Species selection is required');
      return;
    }
    if (!characterData.characterClass?.id) {
      setError('Class selection is required');
      return;
    }
    if (!characterData.background?.id) {
      setError('Background selection is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Character data:', characterData);
      console.log('Species details:', characterData.species);
      console.log('Class details:', characterData.characterClass);
      console.log('Background details:', characterData.background);
      console.log('Authentication token present:', !!token);

      // Validate that we have proper objects with IDs
      if (!characterData.species?.id) {
        console.error('Species object missing ID:', characterData.species);
        setError('Species data is invalid. Please reselect your species.');
        return;
      }
      if (!characterData.characterClass?.id) {
        console.error('Class object missing ID:', characterData.characterClass);
        setError('Class data is invalid. Please reselect your class.');
        return;
      }
      if (!characterData.background?.id) {
        console.error('Background object missing ID:', characterData.background);
        setError('Background data is invalid. Please reselect your background.');
        return;
      }

      // MINIMAL PAYLOAD - only required fields
      const characterPayload = {
        name: characterData.name.trim(),
        species: characterData.species.id,  // String ID like 'elf'
        character_class: characterData.characterClass.id,  // String ID like 'wizard'  
        background: characterData.background.id,  // String ID like 'acolyte'
        strength: characterData.abilityScores.strength,
        dexterity: characterData.abilityScores.dexterity,
        constitution: characterData.abilityScores.constitution,
        intelligence: characterData.abilityScores.intelligence,
        wisdom: characterData.abilityScores.wisdom,
        charisma: characterData.abilityScores.charisma,
        // Empty optional fields
        personality_traits: '',
        ideals: '',
        bonds: '',
        flaws: '',
        backstory: '',
      };
      
      console.log('Creating character with payload:', characterPayload);
      const response = await characterAPI.create(characterPayload);
      console.log('Character created successfully:', response);
      navigate(`/characters/${response.id}`);
    } catch (err: any) {
      console.error('Character creation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create character';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else {
          // Try to extract field-specific errors
          const fieldErrors = Object.entries(err.response.data)
            .filter(([key, value]) => Array.isArray(value))
            .map(([key, value]) => `${key}: ${(value as string[])[0]}`)
            .join(', ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: return characterData.name.trim() !== '';
      case 1: return characterData.species !== null;
      case 2: return characterData.characterClass !== null;
      case 3: return characterData.background !== null;
      case 4: return true; // Ability scores always have default values
      case 5: return true; // Review step is always complete if we reach it
      default: return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case 'name':
        return (
          <div className="step-content">
            <h2>Character Name</h2>
            <div className="form-group">
              <input
                id="characterName"
                type="text"
                value={characterData.name}
                onChange={(e) => setCharacterData({ ...characterData, name: e.target.value })}
                placeholder="Enter character name"
                className="form-control"
              />
            </div>
          </div>
        );
      case 'species':
        return (
          <SpeciesSelector
            selectedSpecies={characterData.species}
            onSpeciesSelect={handleSpeciesSelect}
          />
        );
      case 'class':
        return (
          <ClassSelector
            selectedClass={characterData.characterClass}
            selectedSkills={characterData.selectedSkills}
            selectedEquipment={characterData.selectedEquipment}
            onClassSelect={handleClassSelect}
          />
        );
      case 'background':
        return (
          <BackgroundSelector
            selectedBackground={characterData.background}
            abilityPointDistribution={characterData.backgroundAbilityDistribution}
            selectedLanguage={characterData.backgroundLanguage}
            selectedEquipmentOption={characterData.backgroundEquipmentOption}
            onBackgroundSelect={handleBackgroundSelect}
          />
        );
      case 'abilities':
        return (
          <AbilityScores
            abilityScores={characterData.abilityScores}
            method={characterData.abilityScoresMethod}
            rolledValues={characterData.rolledValues}
            rollAssignments={characterData.rollAssignments}
            arrayAssignments={characterData.arrayAssignments}
            pointBuyScores={characterData.pointBuyScores}
            onAbilityScoresChange={handleAbilityScoresChange}
          />
        );
      case 'review':
        // Calculate final ability scores including background bonuses
        const getFinalAbilityScores = () => {
          const baseScores = characterData.abilityScores;
          const backgroundDistribution = characterData.backgroundAbilityDistribution || {};
          
          return {
            strength: baseScores.strength + (backgroundDistribution.Strength || 0),
            dexterity: baseScores.dexterity + (backgroundDistribution.Dexterity || 0),
            constitution: baseScores.constitution + (backgroundDistribution.Constitution || 0),
            intelligence: baseScores.intelligence + (backgroundDistribution.Intelligence || 0),
            wisdom: baseScores.wisdom + (backgroundDistribution.Wisdom || 0),
            charisma: baseScores.charisma + (backgroundDistribution.Charisma || 0),
          };
        };
        
        const finalAbilityScores = getFinalAbilityScores();
        
        const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);
        const getModifierString = (score: number): string => {
          const mod = getAbilityModifier(score);
          return mod >= 0 ? `+${mod}` : `${mod}`;
        };
        
        const proficiencyBonus = 2; // Level 1 proficiency bonus
        const hitDie = characterData.characterClass?.hitPointDie === 'D6' ? 6 : 
                      characterData.characterClass?.hitPointDie === 'D8' ? 8 :
                      characterData.characterClass?.hitPointDie === 'D10' ? 10 :
                      characterData.characterClass?.hitPointDie === 'D12' ? 12 : 8;
        const hitPointsMax = hitDie + getAbilityModifier(finalAbilityScores.constitution);
        const armorClass = 10 + getAbilityModifier(finalAbilityScores.dexterity);
        
        // Current level class features
        const currentLevelFeatures = characterData.characterClass?.classFeatures?.["1"]?.features || [];
        
        // Get saving throws from class proficiencies
        const classSavingThrows = characterData.characterClass?.proficiencies?.savingThrows || [];
        
        // Skill mappings based on character-sheet.json
        const skillMappings = {
          'Acrobatics': { ability: 'dexterity', proficient: false },
          'Animal Handling': { ability: 'wisdom', proficient: false },
          'Arcana': { ability: 'intelligence', proficient: false },
          'Athletics': { ability: 'strength', proficient: false },
          'Deception': { ability: 'charisma', proficient: false },
          'History': { ability: 'intelligence', proficient: false },
          'Insight': { ability: 'wisdom', proficient: false },
          'Intimidation': { ability: 'charisma', proficient: false },
          'Investigation': { ability: 'intelligence', proficient: false },
          'Medicine': { ability: 'wisdom', proficient: false },
          'Nature': { ability: 'intelligence', proficient: false },
          'Perception': { ability: 'wisdom', proficient: false },
          'Performance': { ability: 'charisma', proficient: false },
          'Persuasion': { ability: 'charisma', proficient: false },
          'Religion': { ability: 'intelligence', proficient: false },
          'Sleight of Hand': { ability: 'dexterity', proficient: false },
          'Stealth': { ability: 'dexterity', proficient: false },
          'Survival': { ability: 'wisdom', proficient: false }
        };
        
        // Mark skills as proficient based on class and background
        const allSkillProficiencies = [
          ...(characterData.selectedSkills || []),
          ...(characterData.background?.skillProficiencies || [])
        ];
        
        allSkillProficiencies.forEach((skill: string) => {
          const skillKey = skill as keyof typeof skillMappings;
          if (skillMappings[skillKey]) {
            skillMappings[skillKey].proficient = true;
          }
        });
        
        return (
          <div className="step-content character-sheet-layout">
            <h2>D&D 5e Character Sheet Preview</h2>
            
            <div className="character-sheet">
              {/* Header Section */}
              <div className="sheet-header">
                <div className="header-row-1">
                  <div className="field-group character-name-group">
                    <label>CHARACTER NAME</label>
                    <input type="text" value={characterData.name} readOnly className="sheet-field large" />
                  </div>
                  <div className="header-stats">
                    <div className="stat-circle">
                      <div className="stat-value">1</div>
                      <div className="stat-label">LEVEL</div>
                    </div>
                  </div>
                </div>
                
                <div className="header-row-2">
                  <div className="field-group">
                    <label>BACKGROUND</label>
                    <input type="text" value={characterData.background?.name || ''} readOnly className="sheet-field" />
                  </div>
                  <div className="field-group">
                    <label>CLASS</label>
                    <input type="text" value={characterData.characterClass?.name || ''} readOnly className="sheet-field" />
                  </div>
                  <div className="field-group">
                    <label>SPECIES</label>
                    <input type="text" value={characterData.species?.name || ''} readOnly className="sheet-field" />
                  </div>
                  <div className="field-group">
                    <label>SUBCLASS</label>
                    <input type="text" value="" readOnly className="sheet-field" />
                  </div>
                </div>
              </div>

              {/* Core Stats Bar */}
              <div className="core-stats-bar">
                <div className="stat-box">
                  <div className="stat-circle">
                    <div className="stat-value">+{proficiencyBonus}</div>
                  </div>
                  <div className="stat-label">PROFICIENCY BONUS</div>
                </div>
                <div className="stat-box">
                  <div className="stat-circle">
                    <div className="stat-value">{getModifierString(finalAbilityScores.dexterity)}</div>
                  </div>
                  <div className="stat-label">INITIATIVE</div>
                </div>
                <div className="stat-box">
                  <div className="stat-circle">
                    <div className="stat-value">{characterData.species?.speed || 30}</div>
                  </div>
                  <div className="stat-label">SPEED</div>
                </div>
                <div className="stat-box">
                  <div className="stat-circle">
                    <input 
                      type="text" 
                      value={characterData.customSize || (
                        typeof characterData.species?.size === 'object' ? 
                          characterData.species?.size?.category || 'M' : 
                          characterData.species?.size || 'M'
                      )}
                      onChange={(e) => setCharacterData(prev => ({ ...prev, customSize: e.target.value }))}
                      className="size-input"
                      placeholder="Size"
                      maxLength={10}
                    />
                  </div>
                  <div className="stat-label">SIZE</div>
                </div>
                <div className="stat-box">
                  <div className="stat-circle">
                    <div className="stat-value">{10 + getAbilityModifier(finalAbilityScores.wisdom) + (skillMappings['Perception']?.proficient ? proficiencyBonus : 0)}</div>
                  </div>
                  <div className="stat-label">PASSIVE PERCEPTION</div>
                </div>
              </div>

              <div className="sheet-main">
                {/* Left Column */}
                <div className="left-column">
                  {/* Ability Scores */}
                  <div className="ability-scores-section">
                    {Object.entries(finalAbilityScores).map(([ability, finalScore]) => {
                      const baseScore = characterData.abilityScores[ability as keyof typeof characterData.abilityScores];
                      const backgroundBonus = (characterData.backgroundAbilityDistribution && characterData.backgroundAbilityDistribution[ability.charAt(0).toUpperCase() + ability.slice(1)]) || 0;
                      const isProficient = classSavingThrows.includes(ability.charAt(0).toUpperCase() + ability.slice(1));
                      const saveBonus = getAbilityModifier(finalScore) + (isProficient ? proficiencyBonus : 0);
                      
                      return (
                        <div key={ability} className="ability-score-block">
                          <div className="ability-header">
                            <div className="ability-name">{ability.toUpperCase()}</div>
                            <div className="ability-score">
                              {baseScore}
                              {backgroundBonus > 0 && (
                                <span className="background-bonus"> (+{backgroundBonus})</span>
                              )}
                              {backgroundBonus > 0 && (
                                <div className="final-score">= {finalScore}</div>
                              )}
                            </div>
                            <div className="ability-modifier">{getModifierString(finalScore)}</div>
                          </div>
                          <div className="saving-throw">
                            <input type="checkbox" checked={isProficient} readOnly />
                            <span className="save-bonus">{saveBonus >= 0 ? '+' : ''}{saveBonus}</span>
                            <span className="save-label">Saving Throw</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Heroic Inspiration */}
                  <div className="heroic-inspiration">
                    <input type="checkbox" />
                    <label>HEROIC INSPIRATION</label>
                  </div>

                  {/* Equipment & Proficiencies */}
                  <div className="equipment-proficiencies">
                    <h4>EQUIPMENT TRAINING & PROFICIENCIES</h4>
                    <div className="proficiency-section">
                      <strong>Armor:</strong> {characterData.characterClass?.armor_proficiencies?.join(', ') || 'None'}
                    </div>
                    <div className="proficiency-section">
                      <strong>Weapons:</strong> {characterData.characterClass?.weapon_proficiencies?.join(', ') || 'None'}
                    </div>
                    <div className="proficiency-section">
                      <strong>Tools:</strong> {characterData.background?.toolProficiency?.fixed || 'Choice available'}
                    </div>
                  </div>
                </div>

                {/* Center Column */}
                <div className="center-column">
                  {/* Skills */}
                  <div className="skills-section">
                    <h4>SKILLS</h4>
                    <div className="skills-list">
                      {Object.entries(skillMappings).map(([skillName, skillData]) => {
                        const abilityScore = finalAbilityScores[skillData.ability as keyof typeof finalAbilityScores];
                        const skillBonus = getAbilityModifier(abilityScore) + (skillData.proficient ? proficiencyBonus : 0);
                        
                        return (
                          <div key={skillName} className="skill-row">
                            <input type="checkbox" checked={skillData.proficient} readOnly />
                            <span className="skill-bonus">{skillBonus >= 0 ? '+' : ''}{skillBonus}</span>
                            <span className="skill-name">{skillName}</span>
                            <span className="skill-ability">({skillData.ability.substring(0, 3)})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vital Stats */}
                  <div className="vital-stats">
                    <div className="vital-stat">
                      <div className="stat-value">{armorClass}</div>
                      <div className="stat-label">ARMOR CLASS</div>
                    </div>
                    <div className="vital-stat">
                      <div className="stat-display">
                        <input type="number" value={hitPointsMax} readOnly className="hp-current" />
                        <span className="hp-separator">/</span>
                        <span className="hp-max">{hitPointsMax}</span>
                      </div>
                      <div className="stat-label">HIT POINTS</div>
                    </div>
                    <div className="vital-stat">
                      <div className="stat-display">
                        <span className="hd-current">{characterData.characterClass?.name?.charAt(0) || '?'}</span>
                        <span className="hd-total">1d{hitDie}</span>
                      </div>
                      <div className="stat-label">HIT DICE</div>
                    </div>
                    <div className="vital-stat death-saves">
                      <div className="save-section">
                        <span>SUCCESSES:</span>
                        <div className="save-boxes">
                          {[1,2,3].map(i => <div key={`s${i}`} className="save-box"></div>)}
                        </div>
                      </div>
                      <div className="save-section">
                        <span>FAILURES:</span>
                        <div className="save-boxes">
                          {[1,2,3].map(i => <div key={`f${i}`} className="save-box"></div>)}
                        </div>
                      </div>
                      <div className="stat-label">DEATH SAVES</div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                  {/* Weapons & Cantrips */}
                  <div className="weapons-section">
                    <h4>WEAPONS & DAMAGE CANTRIPS</h4>
                    <div className="weapon-headers">
                      <span>Name</span>
                      <span>Atk Bonus/DC</span>
                      <span>Damage/Type</span>
                      <span>Notes</span>
                    </div>
                    <div className="weapon-row">
                      <span>Unarmed Strike</span>
                      <span>+{getAbilityModifier(finalAbilityScores.strength) + proficiencyBonus}</span>
                      <span>1 + {getModifierString(finalAbilityScores.strength)} bludgeoning</span>
                      <span>Melee</span>
                    </div>
                    {/* Add more weapon rows based on starting equipment */}
                  </div>

                  {/* Features & Traits */}
                  <div className="features-section">
                    <h4>CLASS FEATURES</h4>
                    <div className="features-content">
                      {currentLevelFeatures.length > 0 ? currentLevelFeatures.map((feature: any, index: number) => (
                        <div key={index} className="feature-item">
                          <strong>
                            {typeof feature.name === 'object' ? JSON.stringify(feature.name) : feature.name}:
                          </strong> {typeof feature.description === 'object' ? JSON.stringify(feature.description) : feature.description}
                        </div>
                      )) : <div>No class features available.</div>}
                    </div>
                  </div>

                  <div className="traits-section">
                    <h4>SPECIES TRAITS</h4>
                    <div className="traits-content">
                      {characterData.species?.traits?.map((trait: any, index: number) => (
                        <div key={index} className="trait-item">
                          <strong>
                            {typeof trait.name === 'object' ? JSON.stringify(trait.name) : trait.name}:
                          </strong> {typeof trait.description === 'object' ? JSON.stringify(trait.description) : trait.description}
                        </div>
                      )) || <div>No species traits available.</div>}
                    </div>
                  </div>

                  <div className="feats-section">
                    <h4>FEATS</h4>
                    <div className="feats-content">
                      {characterData.background?.feat && (
                        <div className="feat-item">
                          <strong>
                            {typeof characterData.background.feat.name === 'object' ? 
                              JSON.stringify(characterData.background.feat.name) : 
                              characterData.background.feat.name}:
                          </strong> {typeof characterData.background.feat.description === 'object' ? 
                            JSON.stringify(characterData.background.feat.description) : 
                            characterData.background.feat.description}
                        </div>
                      )}
                      {!characterData.background?.feat && <div>No background feat available.</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepSelection = (stepIndex: number): string => {
    switch (stepIndex) {
      case 0: return characterData.name || '';
      case 1: return characterData.species?.name || '';
      case 2: return characterData.characterClass?.name || '';
      case 3: return characterData.background?.name || '';
      case 4: return 'Configured';
      case 5: return 'Ready to Create';
      default: return '';
    }
  };

  return (
    <div className="character-wizard">
      <div className="wizard-header">
        <h1>Create New Character</h1>
        
        {/* Authentication Status Check */}
        {!localStorage.getItem('access_token') && (
          <div className="auth-warning" style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px',
            margin: '16px 0',
            color: '#dc2626'
          }}>
            ⚠️ <strong>Authentication Required:</strong> You must be logged in to create a character. 
            Please <a href="/login" style={{textDecoration: 'underline'}}>login</a> before proceeding.
          </div>
        )}

        <div className="wizard-progress">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step ${
                index < currentStep ? 'completed' : 
                index === currentStep ? 'current' : 'upcoming'
              }`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                {(index <= currentStep || isStepComplete(index)) && getStepSelection(index) && (
                  <div className="step-selection">{getStepSelection(index)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {renderStepContent()}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="wizard-navigation">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || loading}
          className="btn btn-primary"
        >
          {loading ? 'Creating...' : currentStep === steps.length - 1 ? 'Create Character' : 'Next'}
        </button>
      </div>
    </div>
  );
};