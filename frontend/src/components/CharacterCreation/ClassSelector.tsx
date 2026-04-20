import React, { useState, useEffect } from 'react';
import styles from './CharacterWizard.module.css';import { contentAPI } from '../../services/apiClient';

// Complete list of D&D 5e skills
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

const SIMPLE_WEAPONS = [
  'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer',
  'Mace', 'Quarterstaff', 'Sickle', 'Spear', 'Dart', 'Light Crossbow',
  'Shortbow', 'Sling'
];

const MARTIAL_WEAPONS = [
  'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd',
  'Lance', 'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier', 'Scimitar',
  'Shortsword', 'Trident', 'Warhammer', 'War Pick', 'Whip', 'Blowgun',
  'Hand Crossbow', 'Heavy Crossbow', 'Longbow', 'Musket', 'Pistol'
];

function getWeaponMasteryPool(weaponProficiencies: string[]): string[] {
  const hasMartial = weaponProficiencies.some(w => w.toLowerCase().includes('martial'));
  const hasSimple = weaponProficiencies.some(w => w.toLowerCase().includes('simple'));
  if (hasMartial) return [...SIMPLE_WEAPONS, ...MARTIAL_WEAPONS];
  if (hasSimple) return SIMPLE_WEAPONS;
  return weaponProficiencies;
}

interface CharacterClass {
  id: string;
  name: string;
  description: string;
  primaryAbility: string[];
  hitPointDie: string;
  proficiencies: {
    savingThrows: string[];
    skills: {
      choose: number;
      from: string[];
    };
    weapons: string[];
    armor: string[];
    tools?: string[];
  };
  startingEquipment?: {
    options: Array<{
      choice: string;
      items: string[];
      gold: number;
    }>;
  };
  classFeatures?: {
    [level: string]: {
      proficiencyBonus: number;
      features: Array<{
        name: string;
        description: string;
        type: string;
      }>;
    };
  };
}

interface ClassSelectorProps {
  selectedClass: CharacterClass | null;
  selectedSkills?: string[];
  selectedEquipment?: { choice: string; items: string[]; gold: number };
  selectedWeaponMasteryChoices?: string[];
  onClassSelect: (characterClass: CharacterClass, skills?: string[], equipment?: { choice: string; items: string[]; gold: number }) => void;
  onWeaponMasteryChange?: (choices: string[]) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  selectedClass,
  selectedSkills: propSelectedSkills = [],
  selectedEquipment: propSelectedEquipment,
  selectedWeaponMasteryChoices: propWeaponMasteryChoices = [],
  onClassSelect,
  onWeaponMasteryChange,
}) => {
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(propSelectedSkills);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    propSelectedEquipment?.choice || null
  );
  const [weaponMasteryChoices, setWeaponMasteryChoices] = useState<string[]>(
    propWeaponMasteryChoices.length ? propWeaponMasteryChoices : ['', '']
  );

  // Sync with incoming props
  useEffect(() => {
    setSelectedSkills(propSelectedSkills);
  }, [propSelectedSkills]);

  useEffect(() => {
    setSelectedEquipment(propSelectedEquipment?.choice || null);
  }, [propSelectedEquipment]);

  useEffect(() => {
    setWeaponMasteryChoices(propWeaponMasteryChoices.length ? propWeaponMasteryChoices : ['', '']);
  }, [propWeaponMasteryChoices]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await contentAPI.classes.list();
        setClasses(response.results || response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selectedClass = classes.find(cls => cls.id === selectedId);
      if (selectedClass) {
        const resetSkills: string[] = [];
        const resetMastery = ['', ''];
        setSelectedSkills(resetSkills);
        setSelectedEquipment(null);
        setWeaponMasteryChoices(resetMastery);
        onWeaponMasteryChange?.(resetMastery);
        onClassSelect(selectedClass, resetSkills, undefined);
      }
    }
  };

  const handleWeaponMasterySelect = (index: number, weapon: string) => {
    const updated = [...weaponMasteryChoices];
    updated[index] = weapon;
    setWeaponMasteryChoices(updated);
    onWeaponMasteryChange?.(updated);
  };

  const handleSkillToggle = (skill: string) => {
    if (!selectedClass) return;
    
    const maxSkills = selectedClass.proficiencies?.skills?.choose || 0;
    
    const newSkills = selectedSkills.includes(skill) 
      ? selectedSkills.filter(s => s !== skill)
      : selectedSkills.length < maxSkills 
        ? [...selectedSkills, skill]
        : selectedSkills;
      
    setSelectedSkills(newSkills);
    
    // Get current equipment
    const currentEquipment = selectedEquipment && selectedClass.startingEquipment ? 
      selectedClass.startingEquipment.options.find(opt => opt.choice === selectedEquipment) : undefined;
    
    // Update parent with all current selections
    onClassSelect(selectedClass, newSkills, currentEquipment);
  };

  const handleEquipmentSelect = (choice: string) => {
    if (!selectedClass?.startingEquipment) return;
    
    const equipmentOption = selectedClass.startingEquipment.options.find(opt => opt.choice === choice);
    if (equipmentOption) {
      setSelectedEquipment(choice);
      
      // Update parent with all current selections
      onClassSelect(selectedClass, selectedSkills, equipmentOption);
    }
  };

  if (loading) {
    return <div className={styles['loading']}>Loading classes...</div>;
  }

  if (error) {
    return <div className={styles['error']}>Error: {error}</div>;
  }

  return (
    <div className={styles['class-selector']}>
      <h2>Choose Your Class</h2>
      
      <div className={styles['class-dropdown']}>
        <label htmlFor="class-select">Select a class:</label>
        <select
          id="class-select"
          value={selectedClass?.id || ''}
          onChange={handleClassChange}
          className={styles['class-select']}
        >
          <option value="">-- Choose a class --</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className={styles['class-details']}>
          <div className={[styles['class-card'], styles['selected']].filter(Boolean).join(' ')}>
            <h3>{selectedClass.name}</h3>
            <p className={styles['description']}>{selectedClass.description}</p>
            
            <div className={styles['class-info']}>
              <div className={styles['hit-die']}>
                <strong>Hit Die:</strong> {selectedClass.hitPointDie || 'Unknown'}
              </div>
              
              <div className={styles['primary-abilities']}>
                <strong>Primary Ability:</strong> {
                  (selectedClass.primaryAbility || []).join(', ') || 'None specified'
                }
              </div>
              
              <div className={styles['proficiencies']}>
                <div className={styles['saving-throws']}>
                  <strong>Saving Throw Proficiencies:</strong>
                  <p>{(selectedClass.proficiencies?.savingThrows || []).join(', ') || 'None'}</p>
                </div>
                
                <div className={styles['skills']}>
                  <strong>Skill Proficiencies:</strong>
                  {selectedClass.proficiencies?.skills?.choose ? (() => {
                    const skillsFrom = selectedClass.proficiencies.skills.from || [];
                    const isAnySkill = skillsFrom.some(skill => 
                      skill.toLowerCase().includes('any skill') || 
                      skill.toLowerCase().includes('choice') ||
                      skill.toLowerCase().includes('your choice')
                    );
                    const availableSkills = isAnySkill ? ALL_SKILLS : skillsFrom;
                    
                    return (
                      <div className={styles['skill-selection']}>
                        <p className={styles['skill-instruction']}>
                          Choose {selectedClass.proficiencies.skills.choose} from {isAnySkill ? 'any skills' : 'the following skills'}:
                          <span className={styles['skill-counter']}>
                            ({selectedSkills.length}/{selectedClass.proficiencies.skills.choose} selected)
                          </span>
                        </p>
                        <div className={styles['skill-options']}>
                          {availableSkills.map(skill => (
                            <button
                              key={skill}
                              type="button"
                              className={[styles['skill-option'], selectedSkills.includes(skill) ? styles['selected'] : '', !selectedSkills.includes(skill) && selectedSkills.length >= selectedClass.proficiencies.skills.choose ? styles['disabled'] : ''].filter(Boolean).join(' ')}
                              onClick={() => handleSkillToggle(skill)}
                              disabled={
                                !selectedSkills.includes(skill) && 
                                selectedSkills.length >= selectedClass.proficiencies.skills.choose
                              }
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })() : (
                    <p>None</p>
                  )}
                </div>
                
                <div className={styles['armor']}>
                  <strong>Armor Proficiencies:</strong>
                  <p>{(selectedClass.proficiencies?.armor || []).join(', ') || 'None'}</p>
                </div>
                
                <div className={styles['weapons']}>
                  <strong>Weapon Proficiencies:</strong>
                  <p>{(selectedClass.proficiencies?.weapons || []).join(', ') || 'None'}</p>
                </div>
                
                {selectedClass.proficiencies?.tools && selectedClass.proficiencies.tools.length > 0 && (
                  <div className={styles['tools']}>
                    <strong>Tool Proficiencies:</strong>
                    <p>{selectedClass.proficiencies.tools.join(', ')}</p>
                  </div>
                )}
              </div>
              
              {selectedClass.startingEquipment && selectedClass.startingEquipment.options.length > 0 && (
                <div className={styles['starting-equipment']}>
                  <h4>Starting Equipment</h4>
                  <p className={styles['equipment-instruction']}>Choose your starting equipment package:</p>
                  <div className={styles['equipment-options']}>
                    {selectedClass.startingEquipment.options.map((option) => (
                      <label key={option.choice} className={[styles['equipment-option'], selectedEquipment === option.choice ? styles['selected'] : ''].filter(Boolean).join(' ')}>
                        <input
                          type="radio"
                          name="starting-equipment"
                          value={option.choice}
                          checked={selectedEquipment === option.choice}
                          onChange={(e) => handleEquipmentSelect(e.target.value)}
                        />
                        <div className={styles['equipment-details']}>
                          <div className={styles['equipment-header']}>
                            <strong>Choice {option.choice}</strong>
                            <span className={styles['equipment-gold']}>+ {option.gold} GP</span>
                          </div>
                          {option.items.length > 0 ? (
                            <div className={styles['equipment-items']}>
                              <ul>
                                {option.items.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className={styles['equipment-gold-only']}>
                              <p>Start with {option.gold} gold pieces to buy your own equipment</p>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedClass.classFeatures && selectedClass.classFeatures['1'] && (
                <div className={styles['first-level-features']}>
                  <h4>1st Level Features</h4>
                  <ul>
                    {selectedClass.classFeatures['1'].features
                      .slice(0, 3)
                      .map((feature, index) => (
                        <li key={index}>
                          <strong>{feature.name || 'Feature'}:</strong> {
                            feature.description || String(feature)
                          }
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )}

              {selectedClass.classFeatures?.['1']?.features.some(f => f.name === 'Weapon Mastery') && (() => {
                const pool = getWeaponMasteryPool(selectedClass.proficiencies?.weapons || []);
                return (
                  <div className={styles['weapon-mastery-selection']}>
                    <h4>Weapon Mastery Choices</h4>
                    <p className={styles['weapon-mastery-instruction']}>
                      Choose 2 weapons to apply your Weapon Mastery properties to:
                    </p>
                    <div className={styles['weapon-mastery-dropdowns']}>
                      {[0, 1].map((i) => (
                        <div key={i} className={styles['weapon-mastery-dropdown']}>
                          <label htmlFor={`weapon-mastery-${i}`}>Weapon {i + 1}:</label>
                          <select
                            id={`weapon-mastery-${i}`}
                            value={weaponMasteryChoices[i] || ''}
                            onChange={(e) => handleWeaponMasterySelect(i, e.target.value)}
                            className={styles['weapon-mastery-select']}
                          >
                            <option value="">-- Choose a weapon --</option>
                            {pool
                              .filter(w => w !== weaponMasteryChoices[i === 0 ? 1 : 0])
                              .map(w => (
                                <option key={w} value={w}>{w}</option>
                              ))
                            }
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {selectedClass.classFeatures && 
               selectedClass.classFeatures['1'] && 
               selectedClass.classFeatures['1'].features.some(f => f.type === 'spell') && (
                <div className={styles['spellcasting']}>
                  <h4>Spellcasting</h4>
                  <p>This class has spellcasting abilities.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};