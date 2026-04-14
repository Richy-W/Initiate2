import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { characterAPI } from '../services/apiClient';
import { LevelUp } from '../components/Character/LevelUp';
import { Character } from '../types';

export const CharacterList: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await characterAPI.getAll();
      setCharacters(response.results || response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load characters');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      await characterAPI.delete(characterId);
      setCharacters(characters.filter(char => char.id !== characterId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete character');
    }
  };

  const handleLevelUp = (character: Character) => {
    setSelectedCharacter(character);
    setShowLevelUp(true);
  };

  const handleLevelUpComplete = (updatedCharacter: Character) => {
    setCharacters(characters.map(char => 
      char.id === updatedCharacter.id ? updatedCharacter : char
    ));
    setShowLevelUp(false);
    setSelectedCharacter(null);
  };

  const getExperienceForNextLevel = (currentLevel: number): number => {
    const xpTable: Record<number, number> = {
      1: 300, 2: 900, 3: 2700, 4: 6500, 5: 14000,
      6: 23000, 7: 34000, 8: 48000, 9: 64000, 10: 85000,
      11: 100000, 12: 120000, 13: 140000, 14: 165000, 15: 195000,
      16: 225000, 17: 265000, 18: 305000, 19: 355000, 20: 405000
    };
    return xpTable[currentLevel + 1] || 405000;
  };

  const canLevelUp = (character: Character): boolean => {
    const nextLevelXP = getExperienceForNextLevel(character.level);
    return character.experience_points >= nextLevelXP && character.level < 20;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="character-list-page">
        <div className="loading">Loading characters...</div>
      </div>
    );
  }

  return (
    <div className="character-list-page">
      <div className="page-header">
        <h1>My Characters</h1>
        <Link to="/characters/create" className="btn btn-primary">
          Create New Character
        </Link>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {characters.length === 0 ? (
        <div className="empty-state">
          <h3>No Characters Yet</h3>
          <p>Create your first D&D character to get started!</p>
          <Link to="/characters/create" className="btn btn-primary">
            Create Your First Character
          </Link>
        </div>
      ) : (
        <div className="characters-grid">
          {characters.map((character) => (
            <div key={character.id} className="character-card">
              <div className="character-card-header">
                <h3 className="character-name">{character.name}</h3>
                <div className="character-level">
                  Level {character.level}
                  {canLevelUp(character) && (
                    <span className="level-up-indicator">⬆️ Ready to level up!</span>
                  )}
                </div>
              </div>

              <div className="character-card-content">
                <div className="character-details">
                  <p className="character-class">
                    {character.species?.name} {character.class_primary?.name}
                  </p>
                  <p className="character-background">
                    {character.background?.name}
                  </p>
                </div>

                <div className="character-stats">
                  <div className="stat-group">
                    <div className="stat">
                      <span className="stat-label">HP</span>
                      <span className="stat-value">
                        {character.hit_points_current}/{character.hit_points_maximum}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">AC</span>
                      <span className="stat-value">{character.armor_class}</span>
                    </div>
                  </div>

                  <div className="experience-progress">
                    <div className="xp-label">
                      XP: {character.experience_points.toLocaleString()} / {getExperienceForNextLevel(character.level).toLocaleString()}
                    </div>
                    <div className="xp-bar">
                      <div 
                        className="xp-progress" 
                        style={{ 
                          width: `${Math.min(100, (character.experience_points / getExperienceForNextLevel(character.level)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="character-meta">
                  <span className="created-date">Created: {formatDate(character.created_at)}</span>
                  <span className="updated-date">Updated: {formatDate(character.updated_at)}</span>
                </div>
              </div>

              <div className="character-card-actions">
                <Link 
                  to={`/characters/${character.id}`} 
                  className="btn btn-primary"
                >
                  View Sheet
                </Link>
                
                <Link 
                  to={`/characters/${character.id}/edit`} 
                  className="btn btn-secondary"
                >
                  Edit
                </Link>

                {canLevelUp(character) && (
                  <button 
                    onClick={() => handleLevelUp(character)} 
                    className="btn btn-success"
                  >
                    Level Up
                  </button>
                )}

                <div className="dropdown">
                  <button className="btn btn-secondary dropdown-toggle">
                    ⋯
                  </button>
                  <div className="dropdown-menu">
                    <button 
                      onClick={() => {
                        // Add XP functionality
                        const xp = prompt('Enter experience points to add:');
                        if (xp && !isNaN(Number(xp))) {
                          // Handle XP update
                        }
                      }}
                      className="dropdown-item"
                    >
                      Add Experience
                    </button>
                    <button 
                      onClick={() => {
                        // Rest functionality
                        characterAPI.update(character.id, {
                          hit_points_current: character.hit_points_maximum
                        }).then(() => fetchCharacters());
                      }}
                      className="dropdown-item"
                    >
                      Long Rest
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={() => setDeleteConfirm(character.id)}
                      className="dropdown-item danger"
                    >
                      Delete Character
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Character</h3>
            <p>Are you sure you want to delete this character? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={() => handleDeleteCharacter(deleteConfirm)}
                className="btn btn-danger"
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Modal */}
      {showLevelUp && selectedCharacter && (
        <LevelUp 
          character={selectedCharacter}
          onLevelUp={handleLevelUpComplete}
          onClose={() => {
            setShowLevelUp(false);
            setSelectedCharacter(null);
          }}
        />
      )}
    </div>
  );
};