import React, { useState, useEffect } from 'react';

interface AbilityScoresType {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface AbilityScoresProps {
  abilityScores: AbilityScoresType;
  method?: 'standard-array' | 'point-buy' | 'roll';
  rolledValues?: number[];
  rollAssignments?: Record<string, number>;
  arrayAssignments?: Record<string, number>;
  pointBuyScores?: AbilityScoresType;
  onAbilityScoresChange: (
    abilityScores: AbilityScoresType, 
    method?: 'standard-array' | 'point-buy' | 'roll',
    additionalData?: {
      rolledValues?: number[];
      rollAssignments?: Record<string, number>;
      arrayAssignments?: Record<string, number>;
      pointBuyScores?: AbilityScoresType;
    }
  ) => void;
}

type AssignmentMethod = 'standard-array' | 'point-buy' | 'roll';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_TOTAL = 27;

// Point buy costs: 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9
const POINT_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

export const AbilityScores: React.FC<AbilityScoresProps> = ({
  abilityScores,
  method: propMethod,
  rolledValues: propRolledValues,
  rollAssignments: propRollAssignments,
  arrayAssignments: propArrayAssignments,
  pointBuyScores: propPointBuyScores,
  onAbilityScoresChange,
}) => {
  const [method, setMethod] = useState<AssignmentMethod>(propMethod || 'standard-array');
  const arrayValues = STANDARD_ARRAY;
  const [assignments, setAssignments] = useState<Record<string, number>>(propArrayAssignments || {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  });
  const [pointBuyScores, setPointBuyScores] = useState<AbilityScoresType>(propPointBuyScores || {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  });
  const [rolledValues, setRolledValues] = useState<number[]>(propRolledValues || [10, 10, 10, 10, 10, 10]);
  const [rollAssignments, setRollAssignments] = useState<Record<string, number>>(propRollAssignments || {
    strength: -1,
    dexterity: -1,
    constitution: -1,
    intelligence: -1,
    wisdom: -1,
    charisma: -1,
  });

  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

  // Calculate point buy total spent
  const pointsSpent = Object.values(pointBuyScores).reduce((total, score) => {
    return total + (POINT_COSTS[score] || 0);
  }, 0);

  const remainingPoints = POINT_BUY_TOTAL - pointsSpent;

  // Separate useEffects for different triggers to avoid infinite loops
  useEffect(() => {
    if (method === 'standard-array') {
      const newScores: AbilityScoresType = {
        strength: arrayValues[assignments.strength] || 10,
        dexterity: arrayValues[assignments.dexterity] || 10,
        constitution: arrayValues[assignments.constitution] || 10,
        intelligence: arrayValues[assignments.intelligence] || 10,
        wisdom: arrayValues[assignments.wisdom] || 10,
        charisma: arrayValues[assignments.charisma] || 10,
      };
      onAbilityScoresChange(newScores, method, {
        arrayAssignments: assignments,
      });
    }
  }, [method, assignments, arrayValues, onAbilityScoresChange]);

  useEffect(() => {
    if (method === 'point-buy') {
      onAbilityScoresChange(pointBuyScores, method, {
        pointBuyScores: pointBuyScores,
      });
    }
  }, [method, pointBuyScores, onAbilityScoresChange]);

  useEffect(() => {
    if (method === 'roll') {
      const rolledNewScores: AbilityScoresType = {
        strength: rollAssignments.strength >= 0 ? rolledValues[rollAssignments.strength] : 10,
        dexterity: rollAssignments.dexterity >= 0 ? rolledValues[rollAssignments.dexterity] : 10,
        constitution: rollAssignments.constitution >= 0 ? rolledValues[rollAssignments.constitution] : 10,
        intelligence: rollAssignments.intelligence >= 0 ? rolledValues[rollAssignments.intelligence] : 10,
        wisdom: rollAssignments.wisdom >= 0 ? rolledValues[rollAssignments.wisdom] : 10,
        charisma: rollAssignments.charisma >= 0 ? rolledValues[rollAssignments.charisma] : 10,
      };
      onAbilityScoresChange(rolledNewScores, method, {
        rolledValues: rolledValues,
        rollAssignments: rollAssignments,
      });
    }
  }, [method, rolledValues, rollAssignments, onAbilityScoresChange]);

  const rollAbilityScore = (): number => {
    // Roll 4d6, drop lowest
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
  };

  const rollAllAbilities = () => {
    const newValues = Array.from({ length: 6 }, () => rollAbilityScore())
      .sort((a, b) => b - a); // Sort highest to lowest for easier optimization
    setRolledValues(newValues);
  };

  const handleRollAssignment = (ability: string, valueIndex: number) => {
    setRollAssignments(prev => {
      // Remove previous assignment if any
      const newAssignments = { ...prev };
      Object.keys(newAssignments).forEach(key => {
        if (newAssignments[key] === valueIndex) {
          newAssignments[key] = -1;
        }
      });
      // Set new assignment
      newAssignments[ability] = valueIndex;
      return newAssignments;
    });
  };

  const handleEditRolledValue = (index: number, raw: string) => {
    const parsed = parseInt(raw, 10);
    if (raw === '' || isNaN(parsed)) {
      // Allow clearing while typing
      setRolledValues(prev => { const n = [...prev]; n[index] = 0; return n; });
      return;
    }
    const clamped = Math.max(3, Math.min(18, parsed));
    setRolledValues(prev => { const n = [...prev]; n[index] = clamped; return n; });
  };

  const handleMethodChange = (newMethod: AssignmentMethod) => {
    setMethod(newMethod);
    if (newMethod === 'roll') {
      // Initialize with a default roll when switching to roll method
      const initialValues = Array.from({ length: 6 }, () => rollAbilityScore())
        .sort((a, b) => b - a);
      setRolledValues(initialValues);
    }
  };

  const handleArrayAssignment = (ability: string, arrayIndex: number) => {
    // Check if this array value is already assigned
    const currentAssignments = Object.entries(assignments);
    const alreadyAssigned = currentAssignments.find(
      ([otherAbility, index]) => otherAbility !== ability && index === arrayIndex
    );
    
    if (alreadyAssigned) {
      // Swap assignments
      const [otherAbility] = alreadyAssigned;
      setAssignments({
        ...assignments,
        [ability]: arrayIndex,
        [otherAbility]: assignments[ability as keyof typeof assignments],
      });
    } else {
      setAssignments({ ...assignments, [ability]: arrayIndex });
    }
  };

  const handlePointBuyChange = (ability: keyof AbilityScoresType, delta: number) => {
    const currentScore = pointBuyScores[ability];
    const newScore = Math.max(8, Math.min(15, currentScore + delta));
    
    const newCost = POINT_COSTS[newScore] || 0;
    const oldCost = POINT_COSTS[currentScore] || 0;
    const costDifference = newCost - oldCost;
    
    if (remainingPoints - costDifference >= 0) {
      setPointBuyScores({ ...pointBuyScores, [ability]: newScore });
    }
  };

  const getModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="ability-scores">
      <h2>Ability Scores</h2>
      
      <div className="ability-method-selection">
        <h3>Choose Assignment Method</h3>
        <div className="method-options">
          <label className="method-option">
            <input
              type="radio"
              value="standard-array"
              checked={method === 'standard-array'}
              onChange={(e) => handleMethodChange(e.target.value as AssignmentMethod)}
            />
            <div className="method-info">
              <strong>Standard Array</strong>
              <p>Use the standard array: 15, 14, 13, 12, 10, 8</p>
            </div>
          </label>
          
          <label className="method-option">
            <input
              type="radio"
              value="point-buy"
              checked={method === 'point-buy'}
              onChange={(e) => handleMethodChange(e.target.value as AssignmentMethod)}
            />
            <div className="method-info">
              <strong>Point Buy</strong>
              <p>Customize your scores with 27 points</p>
            </div>
          </label>
          
          <label className="method-option">
            <input
              type="radio"
              value="roll"
              checked={method === 'roll'}
              onChange={(e) => handleMethodChange(e.target.value as AssignmentMethod)}
            />
            <div className="method-info">
              <strong>Roll Dice</strong>
              <p>Roll 4d6, drop lowest for each ability</p>
            </div>
          </label>
        </div>
      </div>

      <div className="ability-assignment">
        {method === 'standard-array' && (
          <div className="ability-details">
            <div className="standard-array-section">
              <div className="available-scores-card">
                <h4>Available Scores</h4>
                <div className="scores-grid">
                  {arrayValues.map((score, index) => {
                    const assignedTo = Object.entries(assignments).find(([, arrIndex]) => arrIndex === index)?.[0];
                    return (
                      <div key={index} className={`score-badge ${assignedTo ? 'assigned' : 'available'}`}>
                        <span className="score">{score}</span>
                        {assignedTo && <span className="assigned-to">{assignedTo.charAt(0).toUpperCase() + assignedTo.slice(1)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="ability-assignments-card">
                <h4>Assign to Abilities</h4>
                <div className="assignments-grid">
                  {abilities.map((ability) => (
                    <div key={ability} className="ability-assignment-row">
                      <label className="ability-label">{ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                      <select
                        value={assignments[ability] || ''}
                        onChange={(e) => handleArrayAssignment(ability, parseInt(e.target.value))}
                        className="score-select"
                      >
                        <option value="">Select...</option>
                        {arrayValues.map((score, index) => (
                          <option key={index} value={index}>
                            {score}
                          </option>
                        ))}
                      </select>
                      <div className="final-score-display">
                        <span className="score">{arrayValues[assignments[ability]] || '—'}</span>
                        <span className="modifier">({getModifier(arrayValues[assignments[ability]] || 10)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {method === 'point-buy' && (
          <div className="ability-details">
            <div className="point-buy-section">
              <div className="points-tracker">
                <h4>Point Buy Budget</h4>
                <div className="points-remaining">
                  <span className="points-number">{remainingPoints}</span>
                  <span className="points-label">/ {POINT_BUY_TOTAL} points remaining</span>
                </div>
              </div>
              
              <div className="point-assignments-card">
                <h4>Adjust Ability Scores</h4>
                <div className="point-buy-grid">
                  {abilities.map((ability) => (
                    <div key={ability} className="point-buy-row">
                      <label className="ability-label">{ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                      <div className="point-buy-controls">
                        <button
                          type="button"
                          onClick={() => handlePointBuyChange(ability, -1)}
                          disabled={pointBuyScores[ability] <= 8}
                          className="point-btn decrease"
                        >
                          −
                        </button>
                        <div className="score-display">
                          <span className="score">{pointBuyScores[ability]}</span>
                          <span className="modifier">({getModifier(pointBuyScores[ability])})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePointBuyChange(ability, 1)}
                          disabled={
                            pointBuyScores[ability] >= 15 || 
                            remainingPoints - ((POINT_COSTS[pointBuyScores[ability] + 1] || 0) - (POINT_COSTS[pointBuyScores[ability]] || 0)) < 0
                          }
                          className="point-btn increase"
                        >
                          +
                        </button>
                        <span className="cost-display">Cost: {POINT_COSTS[pointBuyScores[ability]] || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {method === 'roll' && (
          <div className="ability-details">
            <div className="roll-section">
              <div className="roll-controls">
                <h4>Roll for Abilities</h4>
                <button
                  type="button"
                  onClick={rollAllAbilities}
                  className="roll-all-btn"
                >
                  🎲 Roll 6 Scores (4d6 drop lowest)
                </button>
              </div>
              
              <div className="rolled-values-card">
                <h4>Rolled Values <span className="rolled-values-hint">(or enter your own)</span></h4>
                <div className="rolled-values-display">
                  {rolledValues.map((value, index) => (
                    <div key={index} className="rolled-value-badge">
                      <input
                        type="number"
                        min={3}
                        max={18}
                        value={value || ''}
                        onChange={(e) => handleEditRolledValue(index, e.target.value)}
                        className="rolled-value-input"
                        aria-label={`Rolled value ${index + 1}`}
                      />
                      <span className="modifier">({getModifier(value || 10)})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="roll-assignments-card">
                <h4>Assign Rolled Values</h4>
                <div className="roll-assignments-grid">
                  {abilities.map((ability) => (
                    <div key={ability} className="assignment-row">
                      <label className="ability-label">{ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                      <select
                        value={rollAssignments[ability]}
                        onChange={(e) => handleRollAssignment(ability, parseInt(e.target.value))}
                        className="assignment-select"
                      >
                        <option value={-1}>Select a value</option>
                        {rolledValues.map((value, index) => (
                          <option
                            key={index}
                            value={index}
                            disabled={Object.values(rollAssignments).includes(index) && rollAssignments[ability] !== index}
                          >
                            {value} ({getModifier(value)})
                          </option>
                        ))}
                      </select>
                      <div className="final-score-display">
                        <span className="score">{rollAssignments[ability] >= 0 ? rolledValues[rollAssignments[ability]] : '—'}</span>
                        <span className="modifier">({getModifier(rollAssignments[ability] >= 0 ? rolledValues[rollAssignments[ability]] : 10)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="final-scores-summary">
        <h3>Final Ability Scores</h3>
        <div className="final-scores-grid">
          {abilities.map((ability) => (
            <div key={ability} className="final-score-card">
              <div className="ability-name">{ability.charAt(0).toUpperCase() + ability.slice(1)}</div>
              <div className="ability-score">{abilityScores[ability]}</div>
              <div className="ability-modifier">{getModifier(abilityScores[ability])}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};