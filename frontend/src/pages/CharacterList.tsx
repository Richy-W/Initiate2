import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { characterAPI } from '../services/apiClient';
import { LevelUp } from '../components/Character/LevelUp';
import { OfficialIdentityHeader } from '../components/Character/OfficialIdentityHeader';
import { Character } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUserFriendlyErrorMessage } from '../utils/errorHandling';
import styles from './CharacterList.module.css';

export const CharacterList: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenuCharacterId, setOpenMenuCharacterId] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch characters if auth is complete and user is authenticated
    if (!authLoading && isAuthenticated && user) {
      fetchCharacters();
    }
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown')) {
        setOpenMenuCharacterId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuCharacterId(null);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Redirect to login if not authenticated and not loading
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Don't render anything while auth is loading
  if (authLoading) {
    return (
      <div className={styles['character-list-page']}>
        <div className={styles['loading']}>Checking authentication...</div>
      </div>
    );
  }

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await characterAPI.getAll({ skipGlobalErrorHandler: true });
      
      setCharacters(response.results || response);
    } catch (err: unknown) {
      const parsedMessage = getUserFriendlyErrorMessage(err, 'Failed to load characters.');
      const errorMessage = parsedMessage.toLowerCase().includes('network')
        ? 'Cannot reach the backend service. Make sure the backend server is running on localhost:8000, then retry.'
        : parsedMessage;
      setError(errorMessage);
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
      <div className={styles['character-list-page']}>
        <div className={styles['loading']}>Loading characters...</div>
      </div>
    );
  }

  return (
    <div className={styles['character-list-page']}>
      <div className={styles['page-header']}>
        <h1>My Characters</h1>
        <Link to="/characters/create" className={[styles['btn'], styles['btn-primary']].filter(Boolean).join(' ')}>
          Create New Character
        </Link>
      </div>

      {error && (
        <div className={styles['error-message']}>
          <span className={styles['error-message-text']}>{error}</span>
          <div className={styles['error-message-actions']}>
            <button onClick={fetchCharacters} className={styles['error-retry-button']}>
              Retry
            </button>
            <button onClick={() => setError(null)} aria-label="Dismiss error">&times;</button>
          </div>
        </div>
      )}

      {characters.length === 0 ? (
        <div className={styles['empty-state']}>
          <h3>No Characters Yet</h3>
          <p>Create your first D&D character to get started!</p>
          <Link to="/characters/create" className={[styles['btn'], styles['btn-primary']].filter(Boolean).join(' ')}>
            Create Your First Character
          </Link>
        </div>
      ) : (
        <div className={styles['characters-grid']}>
          {characters.map((character) => (
            <div key={character.id} className={styles['character-card']}>
              <OfficialIdentityHeader
                compact
                name={character.name}
                level={character.level}
                background={character.background?.name || (character as any).background_name}
                characterClass={character.character_class?.name || (character as any).class_name}
                species={character.species?.name || (character as any).species_name}
              />

              {canLevelUp(character) && (
                <div className={styles['character-level-up-row']}>
                  <span className={styles['level-up-indicator']}>Ready to level up</span>
                </div>
              )}

              <div className={styles['character-card-content']}>
                <div className={styles['character-stats']}>
                  <div className={styles['stat-group']}>
                    <div className={styles['stat']}>
                      <span className={styles['stat-label']}>HP</span>
                      <span className={styles['stat-value']}>
                        {character.current_hit_points}/{character.max_hit_points}
                      </span>
                    </div>
                    <div className={styles['stat']}>
                      <span className={styles['stat-label']}>AC</span>
                      <span className={styles['stat-value']}>{character.armor_class}</span>
                    </div>
                  </div>

                  <div className={styles['experience-progress']}>
                    <div className={styles['xp-label']}>
                      XP: {character.experience_points.toLocaleString()} / {getExperienceForNextLevel(character.level).toLocaleString()}
                    </div>
                    <div className={styles['xp-bar']}>
                      <div 
                        className={styles['xp-progress']} 
                        style={{ 
                          width: `${Math.min(100, (character.experience_points / getExperienceForNextLevel(character.level)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className={styles['character-meta']}>
                  <span className={styles['created-date']}>Created: {formatDate(character.created_at)}</span>
                  <span className={styles['updated-date']}>Updated: {formatDate(character.updated_at)}</span>
                </div>
              </div>

              <div className={styles['character-card-actions']}>
                <Link 
                  to={`/characters/${character.id}`} 
                  className={[styles['btn'], styles['btn-primary']].filter(Boolean).join(' ')}
                >
                  View Sheet
                </Link>
                
                <Link 
                  to={`/characters/${character.id}/edit`} 
                  className={[styles['btn'], styles['btn-secondary']].filter(Boolean).join(' ')}
                >
                  Edit
                </Link>

                {canLevelUp(character) && (
                  <button 
                    onClick={() => handleLevelUp(character)} 
                    className={[styles['btn'], styles['btn-success']].filter(Boolean).join(' ')}
                  >
                    Level Up
                  </button>
                )}

                <div className={[styles['dropdown'], openMenuCharacterId === character.id ? styles['open'] : ''].filter(Boolean).join(' ')}>
                  <button
                    className={[styles['btn'], styles['btn-secondary'], styles['dropdown-toggle']].filter(Boolean).join(' ')}
                    aria-expanded={openMenuCharacterId === character.id}
                    aria-haspopup="menu"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuCharacterId((prev) => (prev === character.id ? null : character.id));
                    }}
                  >
                    ⋯
                  </button>
                  <div className={styles['dropdown-menu']}>
                    <button 
                      onClick={() => {
                        setOpenMenuCharacterId(null);
                        // Add XP functionality
                        const xp = prompt('Enter experience points to add:');
                        if (xp && !isNaN(Number(xp))) {
                          // Handle XP update
                        }
                      }}
                      className={styles['dropdown-item']}
                    >
                      Add Experience
                    </button>
                    <button 
                      onClick={() => {
                        setOpenMenuCharacterId(null);
                        // Rest functionality
                        characterAPI.update(character.id, {
                          current_hit_points: character.max_hit_points
                        }).then(() => fetchCharacters());
                      }}
                      className={styles['dropdown-item']}
                    >
                      Long Rest
                    </button>
                    <div className={styles['dropdown-divider']}></div>
                    <button 
                      onClick={() => {
                        setOpenMenuCharacterId(null);
                        setDeleteConfirm(character.id);
                      }}
                      className={[styles['dropdown-item'], styles['danger']].filter(Boolean).join(' ')}
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
        <div className={styles['modal-overlay']}>
          <div className={styles['modal']}>
            <h3>Delete Character</h3>
            <p>Are you sure you want to delete this character? This action cannot be undone.</p>
            <div className={styles['modal-actions']}>
              <button 
                onClick={() => handleDeleteCharacter(deleteConfirm)}
                className={[styles['btn'], styles['btn-danger']].filter(Boolean).join(' ')}
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className={[styles['btn'], styles['btn-secondary']].filter(Boolean).join(' ')}
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