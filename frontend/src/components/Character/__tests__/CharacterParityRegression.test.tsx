import { getCanonicalDerivedStats, shouldShowSpellsTab } from '../../../utils/characterMathParity';
import { normalizeFeatureViewModels } from '../../../utils/featureNormalization';
import { parityCharacterFixture } from '../../../utils/fixtures/characterParityFixtures';

describe('Character parity regression (creation-to-sheet pipeline)', () => {
  it('prefers the canonical derived_stats snapshot over local recomputation', () => {
    const derived = getCanonicalDerivedStats(parityCharacterFixture);

    expect(derived.armor_class).toBe(15);
    expect((derived as any).armor_source_key).toBe('species:dragonborn');
    expect(derived.proficiency_bonus).toBe(3);
    expect(derived.ability_modifiers.dexterity).toBe(2);
  });

  it('exposes natural attack rows consistent with the canonical snapshot', () => {
    const derived = getCanonicalDerivedStats(parityCharacterFixture) as any;
    const rows = derived.natural_attack_rows;

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Breath Weapon');
    expect(rows[0].to_hit).toBe(5);
  });

  it('normalizes features from canonical normalized_features without duplication', () => {
    const features = normalizeFeatureViewModels(parityCharacterFixture);
    const names = features.map((f) => f.name);

    expect(names).toContain('Second Wind');
    expect(names).toContain('Draconic Ancestry');
    expect(new Set(names).size).toBe(names.length);
  });

  it('hides the Spells tab for a non-spellcasting class with no granted or known spells', () => {
    expect(shouldShowSpellsTab(parityCharacterFixture, false)).toBe(false);
  });

  it('shows the Spells tab when granted_spells are present even for non-caster classes', () => {
    const withGrantedSpell = {
      ...parityCharacterFixture,
      granted_spells: [{ spell_slug: 'produce-flame', source_type: 'lineage', free_cast_max: 1 }],
    };
    expect(shouldShowSpellsTab(withGrantedSpell, false)).toBe(true);
  });

  it('produces identical derived stats across repeated calls (deterministic)', () => {
    const first = getCanonicalDerivedStats(parityCharacterFixture);
    const second = getCanonicalDerivedStats(parityCharacterFixture);
    expect(first).toEqual(second);
  });
});
