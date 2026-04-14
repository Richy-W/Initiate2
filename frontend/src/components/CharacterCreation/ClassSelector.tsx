import React, { useState, useEffect } from 'react';
import { contentAPI } from '../../services/apiClient';

// Complete list of D&D 5e skills
const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

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
  onClassSelect: (characterClass: CharacterClass, skills?: string[], equipment?: { choice: string; items: string[]; gold: number }) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  selectedClass,
  selectedSkills: propSelectedSkills = [],
  selectedEquipment: propSelectedEquipment,
  onClassSelect,
}) => {
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(propSelectedSkills);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    propSelectedEquipment?.choice || null
  );

  // Sync with incoming props
  useEffect(() => {
    setSelectedSkills(propSelectedSkills);
  }, [propSelectedSkills]);

  useEffect(() => {
    setSelectedEquipment(propSelectedEquipment?.choice || null);
  }, [propSelectedEquipment]);

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
        setSelectedSkills(resetSkills);
        setSelectedEquipment(null);
        onClassSelect(selectedClass, resetSkills, undefined);
      }
    }
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
    return <div className="loading">Loading classes...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="class-selector">
      <h2>Choose Your Class</h2>
      
      <div className="class-dropdown">
        <label htmlFor="class-select">Select a class:</label>
        <select
          id="class-select"
          value={selectedClass?.id || ''}
          onChange={handleClassChange}
          className="class-select"
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
        <div className="class-details">
          <div className="class-card selected">
            <h3>{selectedClass.name}</h3>
            <p className="description">{selectedClass.description}</p>
            
            <div className="class-info">
              <div className="hit-die">
                <strong>Hit Die:</strong> {selectedClass.hitPointDie || 'Unknown'}
              </div>
              
              <div className="primary-abilities">
                <strong>Primary Ability:</strong> {
                  (selectedClass.primaryAbility || []).join(', ') || 'None specified'
                }
              </div>
              
              <div className="proficiencies">
                <div className="saving-throws">
                  <strong>Saving Throw Proficiencies:</strong>
                  <p>{(selectedClass.proficiencies?.savingThrows || []).join(', ') || 'None'}</p>
                </div>
                
                <div className="skills">
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
                      <div className="skill-selection">
                        <p className="skill-instruction">
                          Choose {selectedClass.proficiencies.skills.choose} from {isAnySkill ? 'any skills' : 'the following skills'}:
                          <span className="skill-counter">
                            ({selectedSkills.length}/{selectedClass.proficiencies.skills.choose} selected)
                          </span>
                        </p>
                        <div className="skill-options">
                          {availableSkills.map(skill => (
                            <button
                              key={skill}
                              type="button"
                              className={`skill-option ${
                                selectedSkills.includes(skill) ? 'selected' : ''
                              } ${
                                !selectedSkills.includes(skill) && 
                                selectedSkills.length >= selectedClass.proficiencies.skills.choose 
                                  ? 'disabled' : ''
                              }`}
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
                
                <div className="armor">
                  <strong>Armor Proficiencies:</strong>
                  <p>{(selectedClass.proficiencies?.armor || []).join(', ') || 'None'}</p>
                </div>
                
                <div className="weapons">
                  <strong>Weapon Proficiencies:</strong>
                  <p>{(selectedClass.proficiencies?.weapons || []).join(', ') || 'None'}</p>
                </div>
                
                {selectedClass.proficiencies?.tools && selectedClass.proficiencies.tools.length > 0 && (
                  <div className="tools">
                    <strong>Tool Proficiencies:</strong>
                    <p>{selectedClass.proficiencies.tools.join(', ')}</p>
                  </div>
                )}
              </div>
              
              {selectedClass.startingEquipment && selectedClass.startingEquipment.options.length > 0 && (
                <div className="starting-equipment">
                  <h4>Starting Equipment</h4>
                  <p className="equipment-instruction">Choose your starting equipment package:</p>
                  <div className="equipment-options">
                    {selectedClass.startingEquipment.options.map((option) => (
                      <label key={option.choice} className={`equipment-option ${
                        selectedEquipment === option.choice ? 'selected' : ''
                      }`}>
                        <input
                          type="radio"
                          name="starting-equipment"
                          value={option.choice}
                          checked={selectedEquipment === option.choice}
                          onChange={(e) => handleEquipmentSelect(e.target.value)}
                        />
                        <div className="equipment-details">
                          <div className="equipment-header">
                            <strong>Choice {option.choice}</strong>
                            <span className="equipment-gold">+ {option.gold} GP</span>
                          </div>
                          {option.items.length > 0 ? (
                            <div className="equipment-items">
                              <ul>
                                {option.items.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="equipment-gold-only">
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
                <div className="first-level-features">
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

              {selectedClass.classFeatures && 
               selectedClass.classFeatures['1'] && 
               selectedClass.classFeatures['1'].features.some(f => f.type === 'spell') && (
                <div className="spellcasting">
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