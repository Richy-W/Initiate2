import React, { useState } from 'react';

interface Character {
  ability_scores: Record<string, number>;
  proficiency_bonus: number;
  equipment: any[];
  class_primary: any;
  level: number;
}

interface AttackRollsProps {
  character: Character;
}

interface AttackResult {
  weapon: string;
  attackRoll: number;
  attackBonus: number;
  attackTotal: number;
  damageRolls: number[];
  damageBonus: number;
  damageTotal: number;
  damageType: string;
  isCritical: boolean;
  timestamp: number;
}

export const AttackRolls: React.FC<AttackRollsProps> = ({ character }) => {
  const [attackResults, setAttackResults] = useState<AttackResult[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<any>(null);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const rollD20 = (): number => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const rollDie = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const parseDamage = (damageString: string): { dice: number; sides: number; count: number } => {
    // Parse damage like "1d8" or "2d6"
    const match = damageString.match(/(\d+)d(\d+)/);
    if (match) {
      return {
        count: parseInt(match[1]),
        sides: parseInt(match[2]),
        dice: parseInt(match[2])
      };
    }
    return { dice: 6, sides: 6, count: 1 }; // Default
  };

  const getWeaponAttackBonus = (weapon: any): number => {
    // Determine if weapon uses STR or DEX
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.weapon_type === 'ranged';
    const isThrownMelee = weapon.properties?.includes('thrown') && weapon.weapon_type === 'melee';
    
    let abilityModifier: number;
    
    if (isFinesse) {
      // Finesse weapons can use STR or DEX (use higher)
      const strMod = getAbilityModifier(character.ability_scores.strength || 10);
      const dexMod = getAbilityModifier(character.ability_scores.dexterity || 10);
      abilityModifier = Math.max(strMod, dexMod);
    } else if (isRanged || isThrownMelee) {
      abilityModifier = getAbilityModifier(character.ability_scores.dexterity || 10);
    } else {
      abilityModifier = getAbilityModifier(character.ability_scores.strength || 10);
    }
    
    // Check if proficient with this weapon
    const isProficient = character.class_primary?.weapon_proficiencies?.some((prof: string) => 
      weapon.name.toLowerCase().includes(prof.toLowerCase()) ||
      weapon.weapon_type === prof ||
      prof === 'all'
    ) || false;
    
    const proficiencyBonus = isProficient ? character.proficiency_bonus : 0;
    
    return abilityModifier + proficiencyBonus;
  };

  const getWeaponDamageBonus = (weapon: any): number => {
    // Same ability modifier logic as attack
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.weapon_type === 'ranged';
    const isThrownMelee = weapon.properties?.includes('thrown') && weapon.weapon_type === 'melee';
    
    if (isFinesse) {
      const strMod = getAbilityModifier(character.ability_scores.strength || 10);
      const dexMod = getAbilityModifier(character.ability_scores.dexterity || 10);
      return Math.max(strMod, dexMod);
    } else if (isRanged || isThrownMelee) {
      return getAbilityModifier(character.ability_scores.dexterity || 10);
    } else {
      return getAbilityModifier(character.ability_scores.strength || 10);
    }
  };

  const makeAttack = (weapon: any) => {
    const attackBonus = getWeaponAttackBonus(weapon);
    
    // Roll attack
    let attackRoll: number;
    if (advantage) {
      const roll1 = rollD20();
      const roll2 = rollD20();
      attackRoll = Math.max(roll1, roll2);
    } else if (disadvantage) {
      const roll1 = rollD20();
      const roll2 = rollD20();
      attackRoll = Math.min(roll1, roll2);
    } else {
      attackRoll = rollD20();
    }
    
    const attackTotal = attackRoll + attackBonus;
    const isCritical = attackRoll === 20;
    
    // Roll damage
    const damageInfo = parseDamage(weapon.damage || '1d6');
    const damageBonus = getWeaponDamageBonus(weapon);
    
    let damageRolls: number[] = [];
    const rollCount = isCritical ? damageInfo.count * 2 : damageInfo.count;
    
    for (let i = 0; i < rollCount; i++) {
      damageRolls.push(rollDie(damageInfo.sides));
    }
    
    const damageTotal = damageRolls.reduce((sum, roll) => sum + roll, 0) + damageBonus;
    
    const result: AttackResult = {
      weapon: weapon.name,
      attackRoll,
      attackBonus,
      attackTotal,
      damageRolls,
      damageBonus,
      damageTotal,
      damageType: weapon.damage_type || 'slashing',
      isCritical,
      timestamp: Date.now(),
    };
    
    setAttackResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    
    // Reset advantage/disadvantage
    setAdvantage(false);
    setDisadvantage(false);
  };

  // Get weapons from equipment
  const weapons = character.equipment?.filter(item => 
    item.item_type === 'weapon' || 
    item.weapon_type ||
    ['sword', 'dagger', 'bow', 'axe', 'mace', 'spear'].some(weaponType => 
      item.name?.toLowerCase().includes(weaponType)
    )
  ) || [];

  // Add basic unarmed attack
  const unarmedAttack = {
    name: 'Unarmed Strike',
    damage: '1d1',
    damage_type: 'bludgeoning',
    weapon_type: 'melee',
    properties: []
  };

  const allWeapons = [unarmedAttack, ...weapons];

  return (
    <div className="attack-rolls">
      <h3>Combat</h3>
      
      <div className="attack-modifiers">
        <h4>Attack Modifiers</h4>
        <div className="modifier-buttons">
          <button
            className={`btn btn-small ${advantage ? 'active' : ''}`}
            onClick={() => {
              setAdvantage(!advantage);
              setDisadvantage(false);
            }}
          >
            Advantage
          </button>
          <button
            className={`btn btn-small ${disadvantage ? 'active' : ''}`}
            onClick={() => {
              setDisadvantage(!disadvantage);
              setAdvantage(false);
            }}
          >
            Disadvantage
          </button>
        </div>
      </div>

      <div className="weapons-list">
        <h4>Weapons</h4>
        {allWeapons.map((weapon, index) => {
          const attackBonus = getWeaponAttackBonus(weapon);
          const damageBonus = getWeaponDamageBonus(weapon);
          
          return (
            <div key={index} className="weapon-row">
              <div className="weapon-info">
                <span className="weapon-name">{weapon.name}</span>
                <span className="weapon-stats">
                  Attack: {attackBonus >= 0 ? '+' : ''}{attackBonus} | 
                  Damage: {weapon.damage || '1d1'}{damageBonus >= 0 ? '+' : ''}{damageBonus} {weapon.damage_type}
                </span>
              </div>
              
              <button
                className={`btn btn-attack ${
                  advantage ? 'advantage' :
                  disadvantage ? 'disadvantage' : ''
                }`}
                onClick={() => makeAttack(weapon)}
              >
                Attack
              </button>
            </div>
          );
        })}
      </div>

      {attackResults.length > 0 && (
        <div className="attack-history">
          <h4>Recent Attacks</h4>
          <div className="attack-results">
            {attackResults.map((result, index) => (
              <div key={`${result.weapon}-${result.timestamp}`} className="attack-result">
                <div className="attack-header">
                  <span className="weapon-name">{result.weapon}</span>
                  {result.isCritical && <span className="critical">CRITICAL!</span>}
                </div>
                
                <div className="attack-details">
                  <div className="attack-roll">
                    Attack: d20({result.attackRoll}) + {result.attackBonus} = {result.attackTotal}
                  </div>
                  
                  <div className="damage-roll">
                    Damage: {result.damageRolls.map(roll => `d${roll}`).join(' + ')}
                    {result.damageBonus !== 0 && ` + ${result.damageBonus}`}
                    = {result.damageTotal} {result.damageType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="spell-attacks">
        <h4>Spell Attacks</h4>
        <div className="spell-attack-stats">
          <div className="spell-attack-bonus">
            <strong>Spell Attack Bonus:</strong> +{character.proficiency_bonus + getAbilityModifier(character.ability_scores.charisma || 10)}
          </div>
          <div className="spell-save-dc">
            <strong>Spell Save DC:</strong> {8 + character.proficiency_bonus + getAbilityModifier(character.ability_scores.charisma || 10)}
          </div>
        </div>
      </div>
    </div>
  );
};