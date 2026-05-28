import React, { useState, useEffect } from 'react';
import styles from './CharacterSheet.module.css';
import { getSpellAttacks, AttackRow } from '../../utils/spellUtils';
import { spellSlotsAPI, contentAPI } from '../../services/apiClient';

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
  class_detail?: any;
  level: number;
  character_spells?: any[];
  spell_slot_states?: any[];
  /** Slot → { equipment: { name, equipment_type, damage?: {dice,type}, properties?, ... }, slot, id } */
  equipped_items_details?: Record<string, { equipment: any; slot: string; id: string }>;
  id?: number | string;
  features?: any[];
  species_detail?: { name?: string; traits?: any[] };
}

interface AttackRollsProps {
  character: Character;
  onRefresh?: () => void;
}

interface SpellResult {
  spellName: string;
  kind: 'attack' | 'damage';
  attackRoll?: number;
  attackBonus?: number;
  attackTotal?: number;
  isCritical?: boolean;
  damageRolls?: number[];
  damageTotal?: number;
  damageType?: string;
  slotUsed?: number;
  noSlotAvailable?: boolean;
  timestamp: number;
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

export const AttackRolls: React.FC<AttackRollsProps> = ({ character, onRefresh }) => {
  const [attackResults, setAttackResults] = useState<AttackResult[]>([]);
  const [spellResults, setSpellResults] = useState<SpellResult[]>([]);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);
  const [activeWeaponTooltipIdx, setActiveWeaponTooltipIdx] = useState<number | null>(null);
  // Map of lowercase weapon name → normalised weapon record fetched from Equipment DB
  const [dbWeaponMap, setDbWeaponMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    contentAPI.equipment.list({ limit: 500 })
      .then((data: any) => {
        const items: any[] = Array.isArray(data) ? data : (data?.results ?? []);
        const map = new Map<string, any>();
        items.forEach(eq => {
          const key = (eq.name as string).toLowerCase();
          map.set(key, {
            id: eq.id,
            name: eq.name,
            equipment_type: eq.equipment_type ?? '',
            damage: eq.damage?.dice ?? '1d4',
            damage_type: eq.damage?.type ?? '',
            weapon_type: (eq.category ?? '').toLowerCase().includes('ranged') ? 'ranged' : 'melee',
            properties: Array.isArray(eq.properties) ? eq.properties : [],
            description: eq.description ?? '',
          });
        });
        setDbWeaponMap(map);
      })
      .catch(() => { /* silently ignore — fallback to defaults */ });
  }, []);

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

  // Monk weapons = Simple Melee + Light Martial Melee (Monks can use DEX for these)
  const isMonkWeapon = (weapon: any): boolean => {
    if (!isMonk) return false;
    const cat = (weapon.weapon_type ?? weapon.category ?? '').toLowerCase();
    const props: string[] = Array.isArray(weapon.properties) ? weapon.properties : [];
    // Unarmed strike always qualifies
    if (weapon.name === 'Unarmed Strike') return true;
    // Simple melee weapons
    if (cat.includes('simple') && cat.includes('melee')) return true;
    // Light martial melee weapons
    if (cat.includes('martial') && cat.includes('melee') && props.includes('light')) return true;
    return false;
  };

  const getWeaponAttackBonus = (weapon: any): number => {
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.weapon_type === 'ranged';
    const isThrownMelee = weapon.properties?.includes('thrown') && weapon.weapon_type === 'melee';
    const monkWeapon = isMonkWeapon(weapon);

    let abilityModifier: number;

    if (isFinesse || monkWeapon) {
      // Finesse / Monk weapons can use STR or DEX (use higher)
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
    const isFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.weapon_type === 'ranged';
    const isThrownMelee = weapon.properties?.includes('thrown') && weapon.weapon_type === 'melee';
    const monkWeapon = isMonkWeapon(weapon);

    if (isFinesse || monkWeapon) {
      const strMod = getAbilityModifier(character.strength || 10);
      const dexMod = getAbilityModifier(character.dexterity || 10);
      return Math.max(strMod, dexMod);
    } else if (isRanged || isThrownMelee) {
      return getAbilityModifier(character.dexterity || 10);
    } else {
      return getAbilityModifier(character.strength || 10);
    }
  };

  const makeWeaponAttackRoll = (weapon: any) => {
    const attackBonus = getWeaponAttackBonus(weapon);
    let attackRoll: number;
    if (advantage) {
      attackRoll = Math.max(rollD20(), rollD20());
    } else if (disadvantage) {
      attackRoll = Math.min(rollD20(), rollD20());
    } else {
      attackRoll = rollD20();
    }
    const attackTotal = attackRoll + attackBonus;
    const isCritical = attackRoll === 20;
    const result: AttackResult = {
      weapon: weapon.name,
      attackRoll,
      attackBonus,
      attackTotal,
      damageRolls: [],
      damageBonus: 0,
      damageTotal: 0,
      damageType: weapon.damage_type || 'slashing',
      isCritical,
      timestamp: Date.now(),
    };
    setAttackResults(prev => [result, ...prev.slice(0, 4)]);
    setAdvantage(false);
    setDisadvantage(false);
  };

  const makeWeaponDamageRoll = (weapon: any) => {
    const damageInfo = parseDamage(weapon.damage || '1d6');
    const damageBonus = getWeaponDamageBonus(weapon);
    // Check if last attack was a crit for this weapon
    const lastAttack = attackResults.find(r => r.weapon === weapon.name);
    const isCrit = lastAttack?.isCritical ?? false;
    const rollCount = isCrit ? damageInfo.count * 2 : damageInfo.count;
    const damageRolls: number[] = [];
    for (let i = 0; i < rollCount; i++) {
      damageRolls.push(rollDie(damageInfo.sides));
    }
    const damageTotal = damageRolls.reduce((sum, r) => sum + r, 0) + damageBonus;
    const result: AttackResult = {
      weapon: weapon.name,
      attackRoll: 0,
      attackBonus: 0,
      attackTotal: 0,
      damageRolls,
      damageBonus,
      damageTotal,
      damageType: weapon.damage_type || 'slashing',
      isCritical: isCrit,
      timestamp: Date.now(),
    };
    setAttackResults(prev => [result, ...prev.slice(0, 4)]);
  };

  // ── Spell roll helpers ───────────────────────────────────────────────────

  /** Parse all XdY groups from a damage string; handle critical hits. */
  const parseSpellDamage = (dmgString: string, isCrit: boolean = false) => {
    const rolls: number[] = [];
    const regex = /(\d+)d(\d+)/gi;
    let match;
    while ((match = regex.exec(dmgString)) !== null) {
      const count = parseInt(match[1]) * (isCrit ? 2 : 1);
      const sides = parseInt(match[2]);
      for (let i = 0; i < count; i++) {
        rolls.push(rollDie(sides));
      }
    }
    // Flat numeric bonus/penalty after the last dice term, e.g. "+3" in "1d4+3"
    const flatMatch = dmgString.match(/[+-]\s*(\d+)\s*$/);
    const flat = flatMatch ? parseInt(flatMatch[0].replace(/\s/g, '')) : 0;
    const total = rolls.reduce((s, r) => s + r, 0) + flat;
    return { rolls, flat, total };
  };

  const makeSpellAttackRoll = (row: AttackRow) => {
    const bonus = parseInt(row.toHit.replace('+', '')) || 0;
    let d20: number;
    if (advantage) {
      d20 = Math.max(rollD20(), rollD20());
    } else if (disadvantage) {
      d20 = Math.min(rollD20(), rollD20());
    } else {
      d20 = rollD20();
    }
    const total = d20 + bonus;
    const isCritical = d20 === 20;
    setSpellResults(prev => [{
      spellName: row.name,
      kind: 'attack',
      attackRoll: d20,
      attackBonus: bonus,
      attackTotal: total,
      isCritical,
      timestamp: Date.now(),
    }, ...prev.slice(0, 4)]);
    setAdvantage(false);
    setDisadvantage(false);
  };

  const makeSpellDamageRoll = async (row: AttackRow, isCrit: boolean = false) => {
    const { rolls, total } = parseSpellDamage(row.damage, isCrit);
    let slotUsed: number | undefined;
    let noSlotAvailable = false;

    if (row.spellLevel && row.spellLevel >= 1) {
      const slots = (character.spell_slot_states ?? []) as any[];
      const available = slots
        .filter(s => s.slot_level >= row.spellLevel! && s.used < s.total)
        .sort((a: any, b: any) => a.slot_level - b.slot_level);
      if (available.length > 0) {
        const slot = available[0];
        slotUsed = slot.slot_level;
        try {
          await spellSlotsAPI.update(slot.id, { used: slot.used + 1 });
          onRefresh?.();
        } catch (e) {
          console.warn('Failed to consume spell slot:', e);
        }
      } else {
        noSlotAvailable = true;
      }
    }

    setSpellResults(prev => [{
      spellName: row.name,
      kind: 'damage',
      damageRolls: rolls,
      damageTotal: total,
      damageType: row.damageType,
      slotUsed,
      noSlotAvailable,
      timestamp: Date.now(),
    }, ...prev.slice(0, 4)]);
  };

  /** Returns only weapons that are currently equipped in a slot */
  const buildWeaponList = (): any[] => {
    return Object.entries(character.equipped_items_details ?? {})
      .filter(([, slotData]) => slotData?.equipment?.equipment_type === 'weapon')
      .map(([slot, slotData]) => {
        const eq = slotData.equipment;
        const dbRecord = dbWeaponMap.get((eq.name as string).toLowerCase());
        return {
          name: eq.name,
          damage: dbRecord?.damage ?? eq.damage?.dice ?? '1d4',
          damage_type: dbRecord?.damage_type ?? eq.damage?.type ?? '',
          weapon_type: dbRecord?.weapon_type ?? ((eq.category ?? '').toLowerCase().includes('ranged') ? 'ranged' : 'melee'),
          properties: dbRecord?.properties ?? (Array.isArray(eq.properties) ? eq.properties : []),
          description: dbRecord?.description ?? eq.description ?? '',
          slot,
        };
      });
  };

  // Determine if this character is a Monk and get their Martial Arts die
  const classDetail = (character as any).class_detail ?? character.character_class;
  const className = (classDetail?.name ?? '').toLowerCase();
  const isMonk = className.includes('monk');
  const level = character.level ?? 1;

  const getMartialArtsDie = (): string => {
    // Try classFeatures keyed by level first (JSON-based class detail)
    const levelFeatures = classDetail?.classFeatures?.[String(level)];
    if (levelFeatures?.martialArtsDie) return levelFeatures.martialArtsDie;
    // Fallback: derive from level thresholds (5e 2024)
    if (level >= 17) return '1d12';
    if (level >= 11) return '1d10';
    if (level >= 5) return '1d8';
    return '1d6';
  };

  // Unarmed strike: Monks use Martial Arts die + DEX; everyone else uses 1+STR (unarmed = 1 damage)
  const unarmedDamage = isMonk ? getMartialArtsDie() : '1';
  const unarmedProps = isMonk ? ['finesse'] : [];
  const unarmedAttack = {
    name: 'Unarmed Strike',
    damage: unarmedDamage,
    damage_type: 'bludgeoning',
    weapon_type: 'melee',
    properties: unarmedProps,
  };

  const allWeapons = [unarmedAttack, ...buildWeaponList()];

  // ── Special Attacks (Breath Weapon, etc.) ──────────────────────────────────
  const getSpecialAttacks = () => {
    const specials: Array<{
      name: string; damageDice: string; damageType: string;
      saveDC: number; saveType: string; range: string; description?: string;
    }> = [];

    const features: any[] = Array.isArray((character as any).features) ? (character as any).features : [];
    const breathFeature = features.find(
      (f: any) => typeof f?.name === 'string' && f.name.toLowerCase().includes('breath weapon')
    );

    if (breathFeature) {
      const searchText = `${breathFeature.name ?? ''} ${breathFeature.description ?? ''}`.toLowerCase();
      const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'poison'];
      const damageType = damageTypes.find(dt => searchText.includes(dt)) ?? 'magic';
      const damageDice = level >= 17 ? '4d10' : level >= 11 ? '3d10' : level >= 5 ? '2d10' : '1d10';
      const conMod = getAbilityModifier(character.constitution || 10);
      const saveDC = 8 + conMod + (character.proficiency_bonus || 2);
      specials.push({
        name: 'Breath Weapon',
        damageDice,
        damageType,
        saveDC,
        saveType: 'DEX',
        range: '15 ft. Cone or 30 ft. Line',
        description: breathFeature.description,
      });
    }

    return specials;
  };

  const specialAttacks = getSpecialAttacks();

  const makeSpecialDamageRoll = (attack: { name: string; damageDice: string; damageType: string }) => {
    const { sides, count } = parseDamage(attack.damageDice);
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) rolls.push(rollDie(sides));
    const total = rolls.reduce((s, r) => s + r, 0);
    setAttackResults(prev => [{
      weapon: attack.name,
      attackRoll: 0, attackBonus: 0, attackTotal: 0,
      damageRolls: rolls, damageBonus: 0,
      damageTotal: total, damageType: attack.damageType,
      isCritical: false, timestamp: Date.now(),
    }, ...prev.slice(0, 4)]);
  };

  const spellAttacks: AttackRow[] = getSpellAttacks(character as any, classDetail);

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
        <h4>Equipped Weapons</h4>
        <div className={styles['spell-attacks-grid']}>
          {allWeapons.map((weapon, index) => {
            const attackBonus = getWeaponAttackBonus(weapon);
            const damageBonus = getWeaponDamageBonus(weapon);
            const damageDisplay = `${weapon.damage || '1d1'}${damageBonus >= 0 ? '+' : ''}${damageBonus}`;
            const isWepActive = activeWeaponTooltipIdx === index;
            const propsArr: string[] = Array.isArray(weapon.properties) ? weapon.properties : [];
            const props = propsArr.length ? propsArr.join(', ') : null;

            return (
              <div key={index} className={styles['spell-row']}>
                {/* Left: weapon name with tooltip */}
                <span
                  className={[styles['spell-name-cell'], isWepActive ? styles['spell-name-cell-active'] : ''].filter(Boolean).join(' ')}
                  onClick={() => setActiveWeaponTooltipIdx(i => i === index ? null : index)}
                >
                  {weapon.name}
                  <span className={styles['spell-tooltip-combat']}>
                    <span className={styles['sptName']}>{weapon.name}</span>
                    <span className={styles['sptMeta']}>
                      {weapon.weapon_type ?? 'Melee'}{weapon.damage_type ? ` · ${weapon.damage_type}` : ''}
                    </span>
                    <span className={styles['sptRow']}>
                      <span className={styles['sptLabel']}>Attack:</span> {attackBonus >= 0 ? '+' : ''}{attackBonus}
                    </span>
                    <span className={styles['sptRow']}>
                      <span className={styles['sptLabel']}>Damage:</span> {damageDisplay} {weapon.damage_type ?? ''}
                    </span>
                    {weapon.range && (
                      <span className={styles['sptRow']}>
                        <span className={styles['sptLabel']}>Range:</span> {weapon.range}
                      </span>
                    )}
                    {props && (
                      <span className={styles['sptRow']}>
                        <span className={styles['sptLabel']}>Properties:</span> {props}
                      </span>
                    )}
                    {weapon.description && (
                      <span className={styles['sptDesc']}>{weapon.description}</span>
                    )}
                  </span>
                </span>

                {/* Middle: attack roll button */}
                <button
                  className={[
                    styles['spell-atk-btn'],
                    advantage ? styles['advantage'] : '',
                    disadvantage ? styles['disadvantage'] : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => makeWeaponAttackRoll(weapon)}
                  title="Roll attack"
                >
                  {attackBonus >= 0 ? '+' : ''}{attackBonus} ATK
                </button>

                {/* Right: damage roll button */}
                <button
                  className={styles['spell-dmg-btn']}
                  onClick={() => makeWeaponDamageRoll(weapon)}
                  title="Roll damage"
                >
                  {damageDisplay} <span className={styles['spell-dmg-type']}>{weapon.damage_type ?? ''}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {specialAttacks.length > 0 && (
        <div className={styles['weapons-list']}>
          <h4>Special Attacks</h4>
          <div className={styles['spell-attacks-grid']}>
            {specialAttacks.map((attack, index) => (
              <div key={index} className={styles['spell-row']}>
                <span
                  className={[styles['spell-name-cell'], activeWeaponTooltipIdx === (index + 1000) ? styles['spell-name-cell-active'] : ''].filter(Boolean).join(' ')}
                  onClick={() => setActiveWeaponTooltipIdx(i => i === (index + 1000) ? null : (index + 1000))}
                >
                  {attack.name}
                  <span className={styles['spell-tooltip-combat']}>
                    <span className={styles['sptName']}>{attack.name}</span>
                    <span className={styles['sptMeta']}>{attack.range} · {attack.damageType}</span>
                    <span className={styles['sptRow']}><span className={styles['sptLabel']}>Save:</span> DC {attack.saveDC} {attack.saveType}</span>
                    <span className={styles['sptRow']}><span className={styles['sptLabel']}>Damage:</span> {attack.damageDice} {attack.damageType}</span>
                    {attack.description && <span className={styles['sptDesc']}>{attack.description}</span>}
                  </span>
                </span>
                <span className={styles['spell-dc-badge']}>DC {attack.saveDC} {attack.saveType}</span>
                <button
                  className={styles['spell-dmg-btn']}
                  onClick={() => makeSpecialDamageRoll(attack)}
                  title="Roll damage"
                >
                  {attack.damageDice} <span className={styles['spell-dmg-type']}>{attack.damageType}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {spellAttacks.length > 0 && (
        <div className={styles['weapons-list']}>
          <h4>Spell Attacks</h4>
          <div className={styles['spell-attacks-grid']}>
            {spellAttacks.map((row, index) => {
              const sd = row.spellData ?? {};
              const compObj = sd.components ?? {};
              const compParts = [
                compObj.verbal && 'V',
                compObj.somatic && 'S',
                compObj.material && 'M',
              ].filter(Boolean).join(', ');
              const isActive = activeTooltipId === index;

              return (
                <div key={index} className={styles['spell-row']}>
                  {/* Left: spell name with tooltip */}
                  <span
                    className={[styles['spell-name-cell'], isActive ? styles['spell-name-cell-active'] : ''].filter(Boolean).join(' ')}
                    onClick={() => setActiveTooltipId(id => id === index ? null : index)}
                  >
                    {row.name}
                    <span className={styles['spell-tooltip-combat']}>
                      <span className={styles['sptName']}>{row.name}</span>
                      <span className={styles['sptMeta']}>
                        {(row.spellLevel ?? 0) === 0 ? 'Cantrip' : `Level ${row.spellLevel}`}
                        {sd.school ? ` · ${sd.school}` : ''}
                        {sd.ritual ? ' · Ritual' : ''}
                      </span>
                      <span className={styles['sptRow']}>
                        <span className={styles['sptLabel']}>Cast:</span> {sd.casting_time ?? '—'}
                      </span>
                      <span className={styles['sptRow']}>
                        <span className={styles['sptLabel']}>Range:</span> {sd.range ?? '—'}
                      </span>
                      <span className={styles['sptRow']}>
                        <span className={styles['sptLabel']}>Duration:</span> {sd.duration ?? '—'}
                        {sd.concentration ? ' (Conc.)' : ''}
                      </span>
                      {compParts && (
                        <span className={styles['sptRow']}>
                          <span className={styles['sptLabel']}>Components:</span> {compParts}
                          {compObj.materials_needed ? ` (${compObj.materials_needed})` : ''}
                        </span>
                      )}
                      {sd.description && (
                        <span className={styles['sptDesc']}>{sd.description}</span>
                      )}
                      {sd.higher_levels && (
                        <span className={styles['sptHigher']}>
                          <span className={styles['sptLabel']}>At Higher Levels:</span> {sd.higher_levels}
                        </span>
                      )}
                    </span>
                  </span>

                  {/* Middle: attack roll button or save DC badge */}
                  {!row.isSaveSpell ? (
                    <button
                      className={[
                        styles['spell-atk-btn'],
                        advantage ? styles['advantage'] : '',
                        disadvantage ? styles['disadvantage'] : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => makeSpellAttackRoll(row)}
                      title="Roll spell attack"
                    >
                      {row.toHit} ATK
                    </button>
                  ) : (
                    <span className={styles['spell-dc-badge']}>{row.toHit}</span>
                  )}

                  {/* Right: damage roll button */}
                  <button
                    className={styles['spell-dmg-btn']}
                    onClick={() => makeSpellDamageRoll(row)}
                    title={row.spellLevel && row.spellLevel >= 1 ? `Roll damage · expends a level ${row.spellLevel} slot` : 'Roll damage'}
                  >
                    {row.damage} <span className={styles['spell-dmg-type']}>{row.damageType}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {spellResults.length > 0 && (
        <div className={styles['attack-history']}>
          <h4>Recent Spell Rolls</h4>
          <div className={styles['attack-results']}>
            {spellResults.map((result) => (
              <div key={result.timestamp} className={styles['attack-result']}>
                <div className={styles['attack-header']}>
                  <span className={styles['weapon-name']}>{result.spellName}</span>
                  {result.isCritical && <span className={styles['critical']}>CRITICAL!</span>}
                  {result.noSlotAvailable && (
                    <span className={styles['spell-no-slot']}>No slot available</span>
                  )}
                </div>
                <div className={styles['attack-details']}>
                  {result.kind === 'attack' && (
                    <div className={styles['attack-roll']}>
                      Attack: d20({result.attackRoll}) {result.attackBonus! >= 0 ? '+' : ''}{result.attackBonus} = <strong>{result.attackTotal}</strong>
                    </div>
                  )}
                  {result.kind === 'damage' && result.damageRolls && (
                    <div className={styles['damage-roll']}>
                      Damage: [{result.damageRolls.join(', ')}] = <strong>{result.damageTotal}</strong> {result.damageType}
                      {result.slotUsed !== undefined && (
                        <span className={styles['slot-used-tag']}> · used lvl {result.slotUsed} slot</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attackResults.length > 0 && (
        <div className={styles['attack-history']}>
          <h4>Recent Weapon Rolls</h4>
          <div className={styles['attack-results']}>
            {attackResults.map((result) => (
              <div key={`${result.weapon}-${result.timestamp}`} className={styles['attack-result']}>
                <div className={styles['attack-header']}>
                  <span className={styles['weapon-name']}>{result.weapon}</span>
                  {result.isCritical && <span className={styles['critical']}>CRITICAL!</span>}
                </div>
                <div className={styles['attack-details']}>
                  {result.attackTotal > 0 && (
                    <div className={styles['attack-roll']}>
                      Attack: d20({result.attackRoll}) {result.attackBonus >= 0 ? '+' : ''}{result.attackBonus} = <strong>{result.attackTotal}</strong>
                    </div>
                  )}
                  {result.damageRolls.length > 0 && (
                    <div className={styles['damage-roll']}>
                      Damage: [{result.damageRolls.join(', ')}]{result.damageBonus !== 0 ? ` ${result.damageBonus >= 0 ? '+' : ''}${result.damageBonus}` : ''} = <strong>{result.damageTotal}</strong> {result.damageType}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};