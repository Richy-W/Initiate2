import React, { useState, useEffect } from 'react';
import { contentAPI } from '../../services/apiClient';

interface Species {
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
}

interface SpeciesSelectorProps {
  selectedSpecies: Species | null;
  onSpeciesSelect: (species: Species) => void;
}

export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  selectedSpecies,
  onSpeciesSelect,
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

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selectedSpecies = species.find(sp => sp.id === selectedId);
      if (selectedSpecies) {
        onSpeciesSelect(selectedSpecies);
      }
    }
  };

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};