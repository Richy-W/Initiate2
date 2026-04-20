import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpeciesSelector } from './SpeciesSelector';
import { ClassSelector } from './ClassSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { AbilityScores } from './AbilityScores';
import { characterAPI } from '../../services/apiClient';
import HomebrewBrowser from '../Homebrew/HomebrewBrowser';
import { HomebrewContent } from '../../types';
import '../../styles/CharacterCreation.css';

export interface CharacterData {
  name: string;
  species: any;
  selectedSpeciesOptions?: {
    variant?: string;
    skillChoice?: string;
    spellcastingAbility?: string;
    sizeCategory?: string;
    featChoice?: string;
  };
  characterClass: any;
  selectedSkills?: string[];
  selectedEquipment?: { choice: string; items: string[]; gold: number };
  weaponMasteryChoices?: string[];
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
  selectedHomebrew?: HomebrewContent[];
}

export const CharacterWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData>({
    name: '',
    species: null,
    selectedSpeciesOptions: {},
    characterClass: null,
    selectedSkills: [],
    selectedEquipment: undefined,
    weaponMasteryChoices: [],
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
    selectedHomebrew: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable callback functions to prevent infinite re-renders
  const handleSpeciesSelect = useCallback((species: any) => {
    const variantOptions = species?.variants?.map((variant: any) => variant?.name).filter(Boolean) || [];
    const defaultVariant = variantOptions[0] || '';
    const defaultVariantData = species?.variants?.find((variant: any) => variant?.name === defaultVariant);
    const spellcastingOptions = defaultVariantData?.spellProgression?.spellcastingAbility || [];
    const skillOptions = species?.proficiencies?.skills || [];
    const sizeOptions = (species?.size?.canChoose ? species?.size?.options : []) || [];

    setCharacterData(prev => ({
      ...prev,
      species,
      selectedSpeciesOptions: {
        variant: defaultVariant,
        skillChoice: skillOptions[0] || '',
        spellcastingAbility: spellcastingOptions[0] || '',
        sizeCategory: sizeOptions[0]?.category || species?.size?.category || '',
        featChoice: '',
      },
    }));
  }, []);

  const handleSpeciesOptionsChange = useCallback(
    (options: {
      variant?: string;
      skillChoice?: string;
      spellcastingAbility?: string;
      sizeCategory?: string;
      featChoice?: string;
    }) => {
      setCharacterData((prev) => ({ ...prev, selectedSpeciesOptions: options }));
    },
    []
  );

  const handleClassSelect = useCallback((characterClass: any, skills?: string[], equipment?: { choice: string; items: string[]; gold: number }) => {
    setCharacterData(prev => ({ 
      ...prev, 
      characterClass,
      selectedSkills: skills || [],
      selectedEquipment: equipment,
      weaponMasteryChoices: [],
    }));
  }, []);

  const handleWeaponMasteryChange = useCallback((choices: string[]) => {
    setCharacterData(prev => ({ ...prev, weaponMasteryChoices: choices }));
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
    { title: 'Homebrew Content', component: 'homebrew' },
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
      // Validate that we have proper objects with IDs
      if (!characterData.species?.pk) {
        setError('Species data is invalid. Please reselect your species.');
        return;
      }
      if (!characterData.characterClass?.pk) {
        setError('Class data is invalid. Please reselect your class.');
        return;
      }
      if (!characterData.background?.pk) {
        setError('Background data is invalid. Please reselect your background.');
        return;
      }

      const backgroundDistribution = characterData.backgroundAbilityDistribution || {};
      const finalAbilityScores = {
        strength: characterData.abilityScores.strength + (backgroundDistribution.Strength || backgroundDistribution.strength || 0),
        dexterity: characterData.abilityScores.dexterity + (backgroundDistribution.Dexterity || backgroundDistribution.dexterity || 0),
        constitution: characterData.abilityScores.constitution + (backgroundDistribution.Constitution || backgroundDistribution.constitution || 0),
        intelligence: characterData.abilityScores.intelligence + (backgroundDistribution.Intelligence || backgroundDistribution.intelligence || 0),
        wisdom: characterData.abilityScores.wisdom + (backgroundDistribution.Wisdom || backgroundDistribution.wisdom || 0),
        charisma: characterData.abilityScores.charisma + (backgroundDistribution.Charisma || backgroundDistribution.charisma || 0),
      };

      const backgroundEquipmentContainer =
        characterData.background?.startingEquipment ||
        characterData.background?.starting_equipment ||
        characterData.background?.equipment ||
        null;

      const selectedBackgroundEquipment =
        backgroundEquipmentContainer?.options?.find(
          (option: { choice: string }) => option.choice === characterData.backgroundEquipmentOption
        ) ||
        (Array.isArray(backgroundEquipmentContainer)
          ? {
              choice: characterData.backgroundEquipmentOption || 'A',
              items: backgroundEquipmentContainer,
              gold: Number(characterData.background?.starting_gold || 0),
            }
          : null);

      // Payload with numeric primary keys and selected background ability bonuses applied.
      const characterPayload = {
        name: characterData.name.trim(),
        species: characterData.species.pk,  // Use numeric primary key
        character_class: characterData.characterClass.pk,  // Use numeric primary key  
        background: characterData.background.pk,  // Use numeric primary key
        strength: finalAbilityScores.strength,
        dexterity: finalAbilityScores.dexterity,
        constitution: finalAbilityScores.constitution,
        intelligence: finalAbilityScores.intelligence,
        wisdom: finalAbilityScores.wisdom,
        charisma: finalAbilityScores.charisma,
        selected_skills: characterData.selectedSkills || [],
        selected_class_equipment: characterData.selectedEquipment || null,
        selected_class_equipment_option: characterData.selectedEquipment?.choice || null,
        selected_background_equipment: selectedBackgroundEquipment,
        selected_background_equipment_option: characterData.backgroundEquipmentOption || null,
        selected_species_options: {
          ...(characterData.selectedSpeciesOptions || {}),
          homebrew_content_ids: (characterData.selectedHomebrew || []).map((item) => item.id),
        },
        // Starting gold from selected equipment options
        currency: (() => {
          const classGold = Number(characterData.selectedEquipment?.gold || 0);
          const bgOpt = characterData.backgroundEquipmentOption || 'A';
          const bgOpts: Array<{ choice: string; items: string[]; gold: number }> =
            characterData.background?.startingEquipment?.options ||
            characterData.background?.starting_equipment?.options ||
            [];
          const bgEquipItem = bgOpts.find((o) => o.choice === bgOpt) || bgOpts[0];
          const bgGold = Number(bgEquipItem?.gold || 0);
          return { cp: 0, sp: 0, ep: 0, gp: classGold + bgGold, pp: 0 };
        })(),
        // Empty optional fields
        personality_traits: '',
        ideals: '',
        bonds: '',
        flaws: '',
        backstory: '',
      };

      const response = await characterAPI.create(characterPayload);

      const createdCharacterId =
        response?.id ||
        response?.pk ||
        response?.character?.id ||
        response?.data?.id;

      if (!createdCharacterId) {
        throw new Error('Character was created but no id was returned by the API.');
      }

      navigate(`/characters/${createdCharacterId}`);
    } catch (err: any) {
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
            .filter(([_key, value]) => Array.isArray(value))
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
      case 1: return true; // Homebrew step is optional
      case 2: return characterData.species !== null;
      case 3: return characterData.characterClass !== null;
      case 4: return characterData.background !== null;
      case 5: return true; // Ability scores always have default values
      case 6: return true; // Review step is always complete if we reach it
      default: return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case 'name':
        return (
          <div className="step-content">
            <h2 id="step-name-heading">Character Name</h2>
            <div className="form-group">
              <label htmlFor="characterName" className="form-label">
                Character Name <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="characterName"
                type="text"
                value={characterData.name}
                onChange={(e) => setCharacterData({ ...characterData, name: e.target.value })}
                placeholder="Enter character name"
                className="form-control"
                aria-required="true"
                aria-describedby={error && currentStep === 0 ? 'wizard-error' : undefined}
                autoFocus
              />
            </div>
          </div>
        );
      case 'species':
        return (
          <SpeciesSelector
            selectedSpecies={characterData.species}
            onSpeciesSelect={handleSpeciesSelect}
            speciesOptions={characterData.selectedSpeciesOptions}
            onSpeciesOptionsChange={handleSpeciesOptionsChange}
          />
        );
      case 'class':
        return (
          <ClassSelector
            selectedClass={characterData.characterClass}
            selectedSkills={characterData.selectedSkills}
            selectedEquipment={characterData.selectedEquipment}
            selectedWeaponMasteryChoices={characterData.weaponMasteryChoices || []}
            onClassSelect={handleClassSelect}
            onWeaponMasteryChange={handleWeaponMasteryChange}
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
      case 'homebrew':
        return (
          <div className="step-content">
            <h2>Homebrew Content <span className="homebrew-optional-tag">(Optional)</span></h2>
            <p className="homebrew-intro">Select custom homebrew content to unlock additional species, classes, spells, or other options in the steps ahead.</p>
            <HomebrewBrowser
              onSelect={(item) => {
                setCharacterData((prev) => {
                  const selected = prev.selectedHomebrew || [];
                  if (selected.some((x) => x.id === item.id)) {
                    return prev;
                  }
                  return { ...prev, selectedHomebrew: [...selected, item] };
                });
              }}
            />
            {(characterData.selectedHomebrew || []).length > 0 && (
              <div className="homebrew-selected-list">
                <h4>Selected Homebrew</h4>
                <div>
                  {(characterData.selectedHomebrew || []).map((item) => (
                    <div key={item.id} className="homebrew-selected-row">
                      <span>{item.name} <span className="homebrew-type-badge">{item.content_type}</span></span>
                      <button
                        type="button"
                        onClick={() => setCharacterData((prev) => ({
                          ...prev,
                          selectedHomebrew: (prev.selectedHomebrew || []).filter((x) => x.id !== item.id),
                        }))}
                        className="homebrew-remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
        // Check for Tough feat (from background), which adds level+1 HP (+2 at level 1)
        const backgroundFeat = characterData.background?.feat;
        const hasTough = (backgroundFeat?.name || '').toLowerCase() === 'tough';
        const toughBonus = hasTough ? 2 : 0; // level 1 = +2
        const hitPointsMax = hitDie + getAbilityModifier(finalAbilityScores.constitution) + toughBonus;
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
            <div className="sheet-preview-toolbar">
              <h2>D&D 5e Character Sheet Preview</h2>
              <button
                type="button"
                className="btn-print-sheet"
                onClick={() => window.print()}
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
            
            <div className="official-sheet">
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
                      const isProficient = classSavingThrows.includes(ability.charAt(0).toUpperCase() + ability.slice(1));
                      const saveBonus = getAbilityModifier(finalScore) + (isProficient ? proficiencyBonus : 0);
                      
                      return (
                        <div key={ability} className="ability-score-block">
                          <div className="ability-header">
                            <div className="ability-name">{ability.toUpperCase()}</div>
                            <div className="ability-score">{finalScore}</div>
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

                  {/* Equipment & Proficiencies */}
                  <div className="equipment-proficiencies">
                    <h4>EQUIPMENT TRAINING & PROFICIENCIES</h4>
                    <div className="proficiency-section">
                      <strong>Armor:</strong> {(characterData.characterClass?.proficiencies?.armor || []).join(', ') || 'None'}
                    </div>
                    <div className="proficiency-section">
                      <strong>Weapons:</strong> {(characterData.characterClass?.proficiencies?.weapons || []).join(', ') || 'None'}
                    </div>
                    <div className="proficiency-section">
                      <strong>Tools:</strong> {characterData.background?.toolProficiency?.fixed || 'Choice available'}
                    </div>
                  </div>
                </div>

                {/* Center Column */}
                <div className="center-column">
                  {/* Combat Stats Row: AC, HP, Hit Dice + Heroic Inspiration, Death Saves */}
                  <div className="combat-stats-row">
                    <div className="vital-stat">
                      <div className="stat-value">{armorClass}</div>
                      <div className="stat-label">ARMOR CLASS</div>
                    </div>
                    <div className="vital-stat">
                      <div className="stat-value">{hitPointsMax} / {hitPointsMax}</div>
                      <div className="stat-label">HIT POINTS</div>
                    </div>
                    <div className="vital-stat">
                      <div className="stat-display">
                        <span className="hd-current">{characterData.characterClass?.name?.charAt(0) || '?'}</span>
                        <span className="hd-total">1d{hitDie}</span>
                      </div>
                      <div className="stat-label">HIT DICE</div>
                    </div>
                    <div className="vital-stat heroic-inspiration-stat">
                      <input type="checkbox" id="heroic-insp" />
                      <label htmlFor="heroic-insp">HEROIC INSPIRATION</label>
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

                  {/* Equipment Section */}
                  {(() => {
                    // Class equipment
                    const classEquip = characterData.selectedEquipment;
                    const classItems: string[] = classEquip?.items || [];
                    const classGold: number = classEquip?.gold || 0;

                    // Fallback: show all options if none selected
                    const classOptions: Array<{ choice: string; items: string[]; gold: number }> =
                      characterData.characterClass?.startingEquipment?.options || [];

                    // Background equipment
                    const bgOption = characterData.backgroundEquipmentOption || 'A';
                    const bgEquipOptions: Array<{ choice: string; items: string[]; gold: number }> =
                      characterData.background?.startingEquipment?.options || [];
                    const bgEquip = bgEquipOptions.find((o) => o.choice === bgOption) || bgEquipOptions[0];
                    const bgItems: string[] = bgEquip?.items || [];
                    const bgGold: number = bgEquip?.gold || 0;

                    const allItems: string[] = [...classItems, ...bgItems];
                    const totalGold: number = classGold + bgGold;

                    return (
                      <div className="equipment-summary-section">
                        <h4>STARTING EQUIPMENT</h4>

                        {allItems.length === 0 && classOptions.length === 0 ? (
                          <p className="equip-empty">No equipment data available.</p>
                        ) : (
                          <>
                            {/* Class equipment */}
                            {classItems.length > 0 ? (
                              <div className="equip-group">
                                <ul className="equip-list">
                                  {classItems.map((item, i) => (
                                    <li key={i} className="equip-item">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : classOptions.length > 0 ? (
                              <div className="equip-group">
                                <span className="equip-group-label">No class equipment option selected</span>
                              </div>
                            ) : null}

                            {/* Background equipment */}
                            {bgItems.length > 0 && (
                              <div className="equip-group">
                                <ul className="equip-list">
                                  {bgItems.map((item, i) => (
                                    <li key={i} className="equip-item">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Gold summary */}
                            <div className="equip-gold-row">
                              <span className="equip-gold-label">Starting Gold:</span>
                              <span className="equip-gold-value">{totalGold} gp</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
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
                          {feature.name === 'Weapon Mastery' && (characterData.weaponMasteryChoices || []).some(Boolean) && (
                            <div className="weapon-mastery-summary">
                              Chosen: {(characterData.weaponMasteryChoices || []).filter(Boolean).join(', ')}
                            </div>
                          )}
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
      case 4: return `${(characterData.selectedHomebrew || []).length} selected`;
      case 5: return 'Configured';
      case 6: return 'Ready to Create';
      default: return '';
    }
  };

  return (
    <div className="character-wizard" role="main" aria-label="Character Creation Wizard">
      <div className="wizard-header">
        <h1>Create New Character</h1>
        
        {/* Authentication Status Check */}
        {!localStorage.getItem('access_token') && (
          <div
            className="auth-warning"
            role="alert"
            aria-live="assertive"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              margin: '16px 0',
              color: '#dc2626'
            }}
          >
            ⚠️ <strong>Authentication Required:</strong> You must be logged in to create a character. 
            Please <a href="/login" style={{textDecoration: 'underline'}}>login</a> before proceeding.
          </div>
        )}

        <nav aria-label="Character creation steps">
          <ol className="wizard-progress" aria-label="Progress">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <li
                  key={index}
                  className={`step ${
                    isCompleted ? 'completed' : 
                    isCurrent ? 'current' : 'upcoming'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="step-number" aria-hidden="true">{index + 1}</div>
                  <div className="step-info">
                    <div className="step-title">{step.title}</div>
                    {(index <= currentStep || isStepComplete(index)) && getStepSelection(index) && (
                      <div className="step-selection" aria-label={`${step.title}: ${getStepSelection(index)}`}>
                        {getStepSelection(index)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="wizard-content" role="region" aria-label={`Step ${currentStep + 1}: ${steps[currentStep]?.title ?? ''}`}>
        {renderStepContent()}
      </div>

      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <div className="wizard-navigation" role="navigation" aria-label="Wizard navigation">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="btn btn-secondary"
          aria-label="Go to previous step"
        >
          Previous
        </button>
        
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || loading}
          className="btn btn-primary"
          aria-label={
            loading
              ? 'Creating character, please wait'
              : currentStep === steps.length - 1
              ? 'Create Character'
              : `Go to next step: ${steps[currentStep + 1]?.title ?? ''}`
          }
          aria-busy={loading}
        >
          {loading ? 'Creating...' : currentStep === steps.length - 1 ? 'Create Character' : 'Next'}
        </button>
      </div>
    </div>
  );
};