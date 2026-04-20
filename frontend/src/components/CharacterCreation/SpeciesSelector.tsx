import React, { useState, useEffect } from 'react';
import { contentAPI } from '../../services/apiClient';

interface Species {
  pk?: number;
  id: string;
  name: string;
  description: string;
  traits?: any[];
  abilityScoreIncrease?: Record<string, number>;
  size: {
    category: string;
    height: string;
    canChoose?: boolean;
    options?: any[];
  };
  speed: number;
  languages?: string[];
  proficiencies?: {
    skills?: string[];
  };
  senses?: {
    darkvision?: number;
  };
  variants?: Array<{
    name: string;
    description?: string;
    traits?: Array<{ name?: string; description?: string; type?: string }>;
    spellProgression?: {
      spellcastingAbility?: string[];
    };
  }>;
}

interface SpeciesOptions {
  variant?: string;
  skillChoice?: string;
  spellcastingAbility?: string;
  sizeCategory?: string;
  featChoice?: string;
}

interface SpeciesSelectorProps {
  selectedSpecies: Species | null;
  onSpeciesSelect: (species: Species) => void;
  speciesOptions?: SpeciesOptions;
  onSpeciesOptionsChange?: (options: SpeciesOptions) => void;
}

export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  selectedSpecies,
  onSpeciesSelect,
  speciesOptions,
  onSpeciesOptionsChange,
}) => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoading(true);
        const response = await contentAPI.species.list();
        setSpecies(response.results || response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load species');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  const buildDefaultSpeciesOptions = (selected: Species): SpeciesOptions => {
    const variantOptions = selected?.variants?.map((variant) => variant?.name).filter(Boolean) || [];
    const selectedVariant = variantOptions[0] || '';
    const selectedVariantData = selected?.variants?.find((variant) => variant?.name === selectedVariant);
    const spellcastingAbilityOptions = selectedVariantData?.spellProgression?.spellcastingAbility || [];
    const skillOptions = selected?.proficiencies?.skills || [];
    const sizeOptions = (selected?.size?.canChoose ? selected?.size?.options : []) || [];

    return {
      variant: selectedVariant,
      skillChoice: skillOptions[0] || '',
      spellcastingAbility: spellcastingAbilityOptions[0] || '',
      sizeCategory: sizeOptions[0]?.category || selected?.size?.category || '',
      featChoice: '',
    };
  };

  const handleSpeciesChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      return;
    }

    const selectedSpecies = species.find((sp) => sp.id === selectedId);
    if (!selectedSpecies) {
      return;
    }

    try {
      setLoading(true);
      const detail = await contentAPI.species.get(selectedId);
      const hydratedSpecies = {
        ...selectedSpecies,
        ...detail,
        pk: selectedSpecies.pk,
      };

      onSpeciesSelect(hydratedSpecies);
      onSpeciesOptionsChange?.(buildDefaultSpeciesOptions(hydratedSpecies));
    } catch {
      // Fallback to list payload if detail fetch fails.
      onSpeciesSelect(selectedSpecies);
      onSpeciesOptionsChange?.(buildDefaultSpeciesOptions(selectedSpecies));
    } finally {
      setLoading(false);
    }
  };

  const variantOptions = selectedSpecies?.variants?.map((variant) => variant.name) || [];
  const skillOptions = selectedSpecies?.proficiencies?.skills || [];
  const selectedVariant = speciesOptions?.variant || variantOptions[0] || '';
  const selectedVariantData = selectedSpecies?.variants?.find((variant) => variant.name === selectedVariant);
  const spellcastingAbilityOptions = selectedVariantData?.spellProgression?.spellcastingAbility || [];
  const sizeOptions = (selectedSpecies?.size?.canChoose ? selectedSpecies?.size?.options : []) || [];
  const offersFeatChoice = (selectedSpecies?.traits || []).some((trait: any) => {
    const description = typeof trait?.description === 'string' ? trait.description.toLowerCase() : '';
    return description.includes('origin feat of your choice');
  });

  if (loading) {
    return <div className="loading">Loading species...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="species-selector">
      <h2>Choose Your Species</h2>
      
      <div className="species-dropdown">
        <label htmlFor="species-select">Select a species:</label>
        <select
          id="species-select"
          value={selectedSpecies?.id || ''}
          onChange={handleSpeciesChange}
          className="species-select"
        >
          <option value="">-- Choose a species --</option>
          {species.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSpecies && (
        <div className="species-details">
          <div className="species-card selected">
            <h3>{selectedSpecies.name}</h3>
            <p className="description">{selectedSpecies.description}</p>
            
            <div className="species-traits">
              {selectedSpecies.abilityScoreIncrease && Object.keys(selectedSpecies.abilityScoreIncrease).length > 0 && (
                <div className="ability-increases">
                  <h4>Ability Score Increases</h4>
                  <div className="ability-increases-list">
                    {Object.entries(selectedSpecies.abilityScoreIncrease).map(([ability, increase]) => (
                      <span key={ability} className="ability-increase">
                        {ability} +{String(increase)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="basic-info">
                <span className="size">
                  Size: {selectedSpecies.size.category}
                  {selectedSpecies.size.height && ` (${selectedSpecies.size.height})`}
                </span>
                <span className="speed">Speed: {selectedSpecies.speed} ft.</span>
              </div>
              
              {selectedSpecies.languages && selectedSpecies.languages.length > 0 && (
                <div className="languages">
                  <h4>Languages</h4>
                  <p>{selectedSpecies.languages.join(', ')}</p>
                </div>
              )}
              
              {selectedSpecies.traits && selectedSpecies.traits.length > 0 && (
                <div className="traits">
                  <h4>Traits</h4>
                  <ul>
                    {selectedSpecies.traits.slice(0, 5).map((trait, index) => (
                      <li key={index}>
                        <strong>{trait.name || 'Trait'}:</strong> {trait.description || String(trait)}
                      </li>
                    ))}
                  </ul>
                  {selectedSpecies.traits.length > 5 && (
                    <p className="more-traits">
                      <em>And {selectedSpecies.traits.length - 5} more trait{selectedSpecies.traits.length - 5 !== 1 ? 's' : ''}...</em>
                    </p>
                  )}
                </div>
              )}

              {onSpeciesOptionsChange && (
                <div className="species-options">
                  <h4>Species Options</h4>

                  {variantOptions.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="species-variant">Lineage / Variant</label>
                      <select
                        id="species-variant"
                        className="species-select"
                        value={selectedVariant}
                        onChange={(e) =>
                          onSpeciesOptionsChange({
                            ...speciesOptions,
                            variant: e.target.value,
                            spellcastingAbility: '',
                          })
                        }
                      >
                        {variantOptions.map((variantName) => (
                          <option key={variantName} value={variantName}>
                            {variantName}
                          </option>
                        ))}
                      </select>

                      {selectedVariantData && (
                        <div className="variant-info-panel">
                          {selectedVariantData.description && (
                            <p className="variant-info-panel__desc">{selectedVariantData.description}</p>
                          )}

                          {selectedVariantData.spellProgression && (
                            <>
                              <p className="variant-info-panel__section-title">Spells by Level</p>
                              <div className="variant-info-panel__spell-table">
                                {(selectedVariantData.spellProgression as any).level1 && (
                                  <>
                                    <span className="variant-info-panel__spell-level">Level 1</span>
                                    <span className="variant-info-panel__spell-name">
                                      {Array.isArray((selectedVariantData.spellProgression as any).level1)
                                        ? (selectedVariantData.spellProgression as any).level1.join(', ')
                                        : (selectedVariantData.spellProgression as any).level1}
                                    </span>
                                  </>
                                )}
                                {(selectedVariantData.spellProgression as any).level3 && (
                                  <>
                                    <span className="variant-info-panel__spell-level">Level 3</span>
                                    <span className="variant-info-panel__spell-name">
                                      {(selectedVariantData.spellProgression as any).level3}
                                    </span>
                                  </>
                                )}
                                {(selectedVariantData.spellProgression as any).level5 && (
                                  <>
                                    <span className="variant-info-panel__spell-level">Level 5</span>
                                    <span className="variant-info-panel__spell-name">
                                      {(selectedVariantData.spellProgression as any).level5}
                                    </span>
                                  </>
                                )}
                              </div>
                            </>
                          )}

                          {selectedVariantData.traits && selectedVariantData.traits.length > 0 && (
                            <>
                              <p className="variant-info-panel__section-title">Variant Traits</p>
                              {selectedVariantData.traits.map((trait, i) => (
                                <p key={i} className="variant-info-panel__trait">
                                  <strong>{trait.name}: </strong>{trait.description}
                                </p>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {skillOptions.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="species-skill-choice">Skill Proficiency Choice</label>
                      <select
                        id="species-skill-choice"
                        className="species-select"
                        value={speciesOptions?.skillChoice || skillOptions[0] || ''}
                        onChange={(e) =>
                          onSpeciesOptionsChange({
                            ...speciesOptions,
                            skillChoice: e.target.value,
                          })
                        }
                      >
                        {skillOptions.map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sizeOptions.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="species-size">Size Choice</label>
                      <select
                        id="species-size"
                        className="species-select"
                        value={speciesOptions?.sizeCategory || sizeOptions[0]?.category || ''}
                        onChange={(e) =>
                          onSpeciesOptionsChange({
                            ...speciesOptions,
                            sizeCategory: e.target.value,
                          })
                        }
                      >
                        {sizeOptions.map((sizeOption, index) => {
                          const label = `${sizeOption?.category || 'Unknown'}${
                            sizeOption?.height ? ` (${sizeOption.height})` : ''
                          }`;
                          return (
                            <option key={`${sizeOption?.category || 'size'}-${index}`} value={sizeOption?.category || ''}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {spellcastingAbilityOptions.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="species-casting-ability">Spellcasting Ability Choice</label>
                      <select
                        id="species-casting-ability"
                        className="species-select"
                        value={speciesOptions?.spellcastingAbility || spellcastingAbilityOptions[0] || ''}
                        onChange={(e) =>
                          onSpeciesOptionsChange({
                            ...speciesOptions,
                            spellcastingAbility: e.target.value,
                          })
                        }
                      >
                        {spellcastingAbilityOptions.map((ability) => (
                          <option key={ability} value={ability}>
                            {ability}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {offersFeatChoice && (
                    <div className="form-group">
                      <label htmlFor="species-feat-choice">Origin Feat Choice</label>
                      <input
                        id="species-feat-choice"
                        type="text"
                        className="form-input"
                        value={speciesOptions?.featChoice || ''}
                        onChange={(e) =>
                          onSpeciesOptionsChange({
                            ...speciesOptions,
                            featChoice: e.target.value,
                          })
                        }
                        placeholder="Enter chosen feat (e.g. Skilled)"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};