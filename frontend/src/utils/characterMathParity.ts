import { DerivedStats, GrantedSpell } from '../types/characterMechanics';

const mod = (score: number): number => Math.floor((score - 10) / 2);

export const getCanonicalDerivedStats = (character: any): DerivedStats => {
  const snapshot = character?.derived_stats;
  if (snapshot && typeof snapshot === 'object') {
    return snapshot as DerivedStats;
  }

  const abilityTotals = {
    strength: Number(character?.total_strength ?? character?.strength ?? 10),
    dexterity: Number(character?.total_dexterity ?? character?.dexterity ?? 10),
    constitution: Number(character?.total_constitution ?? character?.constitution ?? 10),
    intelligence: Number(character?.total_intelligence ?? character?.intelligence ?? 10),
    wisdom: Number(character?.total_wisdom ?? character?.wisdom ?? 10),
    charisma: Number(character?.total_charisma ?? character?.charisma ?? 10),
  };

  return {
    ability_totals: abilityTotals,
    ability_modifiers: {
      strength: mod(abilityTotals.strength),
      dexterity: mod(abilityTotals.dexterity),
      constitution: mod(abilityTotals.constitution),
      intelligence: mod(abilityTotals.intelligence),
      wisdom: mod(abilityTotals.wisdom),
      charisma: mod(abilityTotals.charisma),
    },
    proficiency_bonus: Number(character?.proficiency_bonus ?? 2),
    armor_class: Number(character?.calculated_armor_class ?? character?.armor_class ?? 10),
    max_hit_points: Number(character?.max_hit_points ?? 0),
  };
};

export const shouldShowSpellsTab = (character: any, isClassSpellcaster: boolean): boolean => {
  if (isClassSpellcaster) return true;

  const grantedSpells = (character?.granted_spells ?? []) as GrantedSpell[];
  if (grantedSpells.length > 0) return true;

  const knownSpells = character?.character_spells ?? [];
  return Array.isArray(knownSpells) && knownSpells.length > 0;
};
