import { getCanonicalDerivedStats, shouldShowSpellsTab } from '../characterMathParity';

describe('characterMathParity', () => {
  it('prefers backend derived_stats snapshot when present', () => {
    const derived = {
      ability_totals: { strength: 12, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 8, charisma: 10 },
      ability_modifiers: { strength: 1, dexterity: 3, constitution: 2, intelligence: 0, wisdom: -1, charisma: 0 },
      proficiency_bonus: 3,
      armor_class: 17,
      max_hit_points: 38,
    };

    const result = getCanonicalDerivedStats({ derived_stats: derived, armor_class: 11 });
    expect(result.armor_class).toBe(17);
    expect(result.proficiency_bonus).toBe(3);
  });

  it('falls back to local derivation when snapshot absent', () => {
    const result = getCanonicalDerivedStats({
      strength: 10,
      dexterity: 14,
      constitution: 12,
      intelligence: 10,
      wisdom: 8,
      charisma: 16,
      proficiency_bonus: 2,
      armor_class: 13,
      max_hit_points: 20,
    });

    expect(result.ability_modifiers.dexterity).toBe(2);
    expect(result.armor_class).toBe(13);
  });

  it('shows spells tab for lineage-only non-casters with granted spells', () => {
    expect(shouldShowSpellsTab({ granted_spells: [{ spell_slug: 'shield', source_type: 'lineage' }] }, false)).toBe(true);
    expect(shouldShowSpellsTab({ granted_spells: [] }, false)).toBe(false);
  });
});
