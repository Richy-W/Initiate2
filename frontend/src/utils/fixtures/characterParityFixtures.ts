/**
 * Shared frontend fixture mirroring the backend creation-to-sheet regression
 * fixture (`backend/apps/characters/tests/parity_fixtures.py`). Used to lock
 * cross-layer parity for derived stats, normalized features, and mechanics
 * state exposed by the character detail API.
 *
 * NOTE: This file intentionally lives outside any `__tests__` directory so
 * Jest's default testMatch globs do not pick it up as a test suite (it has
 * no test cases of its own).
 */

export const parityCharacterFixture: any = {
  id: 1,
  name: 'ParityHero',
  level: 5,
  strength: 16,
  dexterity: 14,
  constitution: 15,
  intelligence: 10,
  wisdom: 10,
  charisma: 8,
  max_hit_points: 44,
  current_hit_points: 44,
  character_class: {
    name: 'Fighter',
    subclass_level: 3,
    hit_die: 10,
  },
  features: [{ name: 'Second Wind', source: 'class' }],
  normalized_features: [
    { name: 'Second Wind', source: 'class', description: '' },
    { name: 'Draconic Ancestry', source: 'species', description: 'Breath weapon lineage trait.' },
  ],
  derived_stats: {
    ability_totals: {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 10,
      charisma: 8,
    },
    ability_modifiers: {
      strength: 3,
      dexterity: 2,
      constitution: 2,
      intelligence: 0,
      wisdom: 0,
      charisma: -1,
    },
    proficiency_bonus: 3,
    armor_class: 15,
    armor_source_key: 'species:dragonborn',
    max_hit_points: 44,
    spellcasting: { type: 'none', ability: '' },
    natural_attack_rows: [
      {
        attack_key: 'breath-weapon',
        name: 'Breath Weapon',
        to_hit: 5,
        ability_modifier: 2,
        proficiency_applied: true,
        damage_dice: '2d6',
        damage_bonus: 2,
        damage_type: 'fire',
        source_key: 'species:dragonborn',
      },
    ],
  },
  feature_usage: [
    {
      feature_key: 'species:breath_weapon',
      source_type: 'species',
      current_uses: 1,
      recharge_type: 'long_rest',
      override_payload: { max_uses: 1 },
    },
  ],
  subclass_state: {
    class_slug: 'fighter',
    subclass_slug: 'champion',
    class_content_version: '2024.1',
    subclass_content_version: '2024.1',
    warning_state: false,
  },
  granted_spells: [],
  character_spells: [],
};
