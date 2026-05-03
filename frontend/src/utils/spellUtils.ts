import { Character, SpellcastingProfile } from '../types';

/** Maps ability key to the matching Character field returning the numeric score. */
const ABILITY_KEYS: Record<string, string> = {
  strength: 'strength',
  dexterity: 'dexterity',
  constitution: 'constitution',
  intelligence: 'intelligence',
  wisdom: 'wisdom',
  charisma: 'charisma',
};

const ABILITY_DISPLAY: Record<string, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

/**
 * Level → max prepared spell level table for full/half/third casters.
 * Pact magic (Warlock) uses a separate logic — same as full for max level mapping.
 */
const FULL_CASTER_MAX_SPELL_LEVEL: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5,
  10: 5, 11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8, 17: 9, 18: 9, 19: 9, 20: 9,
};

const HALF_CASTER_MAX_SPELL_LEVEL: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3,
  11: 4, 12: 4, 13: 4, 14: 4, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5,
};

const THIRD_CASTER_MAX_SPELL_LEVEL: Record<number, number> = {
  1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 2, 9: 2, 10: 2,
  11: 2, 12: 2, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 4, 20: 4,
};

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Compute the spellcasting profile for a character.
 *
 * @param character - The Character object (must have `proficiency_bonus` and ability scores).
 * @param classJson - The character's class data object (character.character_class).
 *                    Expected shape: `{ spellcasting: { ability: string; type: string } }`.
 * @returns SpellcastingProfile, or a profile with spellcastingType='none' for non-casters.
 */
export function computeSpellcastingProfile(
  character: Character,
  classJson: any,
): SpellcastingProfile {
  const noneProfile: SpellcastingProfile = {
    ability: '',
    abilityKey: '',
    modifier: 0,
    saveDC: 0,
    attackBonus: 0,
    spellcastingType: 'none',
    maxSpellLevel: 0,
  };

  const spellcasting = classJson?.spellcasting;
  if (!spellcasting || !spellcasting.ability) {
    return noneProfile;
  }

  const abilityKey = (spellcasting.ability as string).toLowerCase();
  const abilityScore = (character as any)[ABILITY_KEYS[abilityKey] ?? abilityKey] as number | undefined;
  if (abilityScore === undefined) {
    return noneProfile;
  }

  const abilityMod = abilityModifier(abilityScore);
  const profBonus = character.proficiency_bonus ?? 2;
  const modifier = abilityMod + profBonus;
  const saveDC = 8 + modifier;
  const attackBonus = modifier;

  const type = (spellcasting.type as string | undefined)?.toLowerCase() ?? 'full';
  let spellcastingType: SpellcastingProfile['spellcastingType'];
  let maxSpellLevel: number;
  const level = character.level;

  switch (type) {
    case 'pact':
      spellcastingType = 'pact';
      maxSpellLevel = FULL_CASTER_MAX_SPELL_LEVEL[level] ?? 9;
      break;
    case 'half':
      spellcastingType = 'half';
      maxSpellLevel = HALF_CASTER_MAX_SPELL_LEVEL[level] ?? 0;
      break;
    case 'third':
      spellcastingType = 'third';
      maxSpellLevel = THIRD_CASTER_MAX_SPELL_LEVEL[level] ?? 0;
      break;
    default:
      spellcastingType = 'full';
      maxSpellLevel = FULL_CASTER_MAX_SPELL_LEVEL[level] ?? 9;
      break;
  }

  // For non-casters with empty spellcasting object
  if (maxSpellLevel === 0 && type !== 'half' && type !== 'third') {
    // Check if the type was explicitly set to empty/none
    if (!spellcasting.type) {
      return noneProfile;
    }
  }

  const profile: SpellcastingProfile = {
    ability: ABILITY_DISPLAY[abilityKey] ?? abilityKey,
    abilityKey,
    modifier,
    saveDC,
    attackBonus,
    spellcastingType,
    maxSpellLevel,
  };

  return profile;
}

/**
 * Returns true if the character has any spellcasting capability
 * (either from their class OR from a Magic Initiate feat spell).
 */
export function isSpellcaster(character: Character, classJson: any): boolean {
  const profile = computeSpellcastingProfile(character, classJson);
  if (profile.spellcastingType !== 'none') return true;
  // Also true if character has any Magic Initiate spells
  return (character.character_spells ?? []).some(s => s.source === 'magic_initiate');
}

export interface AttackRow {
  name: string;
  toHit: string;
  damage: string;
  damageType: string;
  range: string;
  notes: string;
  isSpell: boolean;
}

/**
 * Return attack rows for all spells with damage data.
 */
export function getSpellAttacks(character: Character, classJson: any): AttackRow[] {
  const profile = computeSpellcastingProfile(character, classJson);
  const spells = character.character_spells ?? [];

  return spells
    .filter(cs => {
      const spellData = (cs as any).spell_data ?? cs;
      return spellData?.damage && Object.keys(spellData.damage).length > 0;
    })
    .map(cs => {
      const spellData = (cs as any).spell_data ?? cs;
      const damage = spellData?.damage ?? {};
      const damageString = Object.entries(damage)
        .map(([dice]) => dice)
        .join(' + ');
      const damageType = Object.values(damage as Record<string, string>).join(', ');
      const toHit = profile.attackBonus >= 0
        ? `+${profile.attackBonus}`
        : `${profile.attackBonus}`;

      return {
        name: cs.spell_name,
        toHit,
        damage: damageString,
        damageType,
        range: spellData?.range ?? '',
        notes: cs.notes ?? '',
        isSpell: true,
      };
    });
}
