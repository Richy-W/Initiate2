import React, { useState } from 'react';
import styles from './CharacterSheet.module.css';
import { getSpellAttacks, AttackRow } from '../../utils/spellUtils';

interface Character {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiency_bonus: number;
  equipment?: any[] | Record<string, any> | string | null;
  character_class: any;
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
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);

  // Don't render if character data isn't ready
  if (!character) {
    return <div className={styles['attack-rolls']}>Loading attack rolls...</div>;
  }

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const rollD20 = (): number => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const rollDie = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const parseDamage = (damageString: string): { sides: number; count: number } => {
    // Parse damage like "1d8" or "2d6"
    const match = damageString.match(/(\d+)d(\d+)/);
    if (match) {
      return {
        count: parseInt(match[1]),
        sides: parseInt(match[2]),
      };
    }
    return { sides: 6, count: 1 }; // Default
  };

  const getWeaponAttackBonus = (weapon: any): number => {
    // Determine if weapon uses STR or DEX
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.weapon_type === 'ranged';
    const isThrownMelee = weapon.properties?.includes('thrown') && weapon.weapon_type === 'melee';
    
    let abilityModifier: number;
    
    if (isFinesse) {
      // Finesse weapons can use STR or DEX (use higher)
      const strMod = getAbilityModifier(character.strength || 10);
      const dexMod = getAbilityModifier(character.dexterity || 10);
      abilityModifier = Math.max(strMod, dexMod);
    } else if (isRanged || isThrownMelee) {
      abilityModifier = getAbilityModifier(character.dexterity || 10);
    } else {
      abilityModifier = getAbilityModifier(character.strength || 10);
    }
    
    // Check if proficient with this weapon
    const isProficient = character.character_class?.weapon_proficiencies?.some((prof: string) => 
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
      const strMod = getAbilityModifier(character.strength || 10);
      const dexMod = getAbilityModifier(character.dexterity || 10);
      return Math.max(strMod, dexMod);
    } else if (isRanged || isThrownMelee) {
      return getAbilityModifier(character.dexterity || 10);
    } else {
      return getAbilityModifier(character.strength || 10);
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
    
    const damageRolls: number[] = [];
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

  const normalizeEquipment = (equipment: Character['equipment']): any[] => {
    if (Array.isArray(equipment)) {
      return equipment;
    }

    if (typeof equipment === 'string') {
      try {
        return normalizeEquipment(JSON.parse(equipment));
      } catch {
        return [];
      }
    }

    if (equipment && typeof equipment === 'object') {
      const equipmentObj = equipment as Record<string, any>;

      if (Array.isArray(equipmentObj.items)) {
        return equipmentObj.items;
      }

      return Object.values(equipmentObj);
    }

    return [];
  };

  // Get weapons from equipment
  const weapons = normalizeEquipment(character.equipment).filter(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    return (
      item.item_type === 'weapon' ||
      item.weapon_type ||
      ['sword', 'dagger', 'bow', 'axe', 'mace', 'spear'].some(weaponType =>
        item.name?.toLowerCase().includes(weaponType)
      )
    );
  });

  // Add basic unarmed attack
  const unarmedAttack = {
    name: 'Unarmed Strike',
    damage: '1d1',
    damage_type: 'bludgeoning',
    weapon_type: 'melee',
    properties: []
  };

  const allWeapons = [unarmedAttack, ...weapons];

  const spellAttacks: AttackRow[] = getSpellAttacks(character as any, character.character_class);

  return (
    <div className={styles['attack-rolls']}>
      <h3>Combat</h3>
      
      <div className={styles['attack-modifiers']}>
        <h4>Attack Modifiers</h4>
        <div className={styles['modifier-buttons']}>
          <button
            className={['btn', styles['btn-small'], advantage ? styles['active'] : ''].filter(Boolean).join(' ')}
            onClick={() => {
              setAdvantage(!advantage);
              setDisadvantage(false);
            }}
          >
            Advantage
          </button>
          <button
            className={['btn', styles['btn-small'], disadvantage ? styles['active'] : ''].filter(Boolean).join(' ')}
            onClick={() => {
              setDisadvantage(!disadvantage);
              setAdvantage(false);
            }}
          >
            Disadvantage
          </button>
        </div>
      </div>

      <div className={styles['weapons-list']}>
        <h4>Weapons</h4>
        {allWeapons.map((weapon, index) => {
          const attackBonus = getWeaponAttackBonus(weapon);
          const damageBonus = getWeaponDamageBonus(weapon);
          
          return (
            <div key={index} className={styles['weapon-row']}>
              <div className={styles['weapon-info']}>
                <span className={styles['weapon-name']}>{weapon.name}</span>
                <span className={styles['weapon-stats']}>
                  Attack: {attackBonus >= 0 ? '+' : ''}{attackBonus} | 
                  Damage: {weapon.damage || '1d1'}{damageBonus >= 0 ? '+' : ''}{damageBonus} {weapon.damage_type}
                </span>
              </div>
              
              <button
                className={['btn', styles['btn-attack'], advantage ? styles['advantage'] : disadvantage ? styles['disadvantage'] : ''].filter(Boolean).join(' ')}
                onClick={() => makeAttack(weapon)}
              >
                Attack
              </button>
            </div>
          );
        })}
      </div>

      {spellAttacks.length > 0 && (
        <div className={styles['weapons-list']}>
          <h4>Spell Attacks</h4>
          {spellAttacks.map((row, index) => (
            <div key={index} className={styles['weapon-row']}>
              <div className={styles['weapon-info']}>
                <span className={styles['weapon-name']}>{row.name}</span>
                <span className={styles['weapon-stats']}>
                  Attack: {row.attackBonus >= 0 ? '+' : ''}{row.attackBonus}
                  {row.damage ? ` | Damage: ${row.damage} ${row.damageType ?? ''}` : ''}
                  {row.saveDC ? ` | Save DC ${row.saveDC} ${row.saveAbility ?? ''}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {attackResults.length > 0 && (
        <div className={styles['attack-history']}>
          <h4>Recent Attacks</h4>
          <div className={styles['attack-results']}>
            {attackResults.map((result) => (
              <div key={`${result.weapon}-${result.timestamp}`} className={styles['attack-result']}>
                <div className={styles['attack-header']}>
                  <span className={styles['weapon-name']}>{result.weapon}</span>
                  {result.isCritical && <span className={styles['critical']}>CRITICAL!</span>}
                </div>
                
                <div className={styles['attack-details']}>
                  <div className={styles['attack-roll']}>
                    Attack: d20({result.attackRoll}) + {result.attackBonus} = {result.attackTotal}
                  </div>
                  
                  <div className={styles['damage-roll']}>
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
      
      <div className={styles['spell-attacks']}>
        <h4>Spell Attacks</h4>
        <div className={styles['spell-attack-stats']}>
          <div className={styles['spell-attack-bonus']}>
            <strong>Spell Attack Bonus:</strong> +{character.proficiency_bonus + getAbilityModifier(character.charisma || 10)}
          </div>
          <div className={styles['spell-save-dc']}>
            <strong>Spell Save DC:</strong> {8 + character.proficiency_bonus + getAbilityModifier(character.charisma || 10)}
          </div>
        </div>
      </div>
    </div>
  );
};