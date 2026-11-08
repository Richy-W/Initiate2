import {
  filterFeaturesByCategory,
  normalizeFeatureViewModels,
} from '../featureNormalization';

describe('featureNormalization', () => {
  it('uses canonical normalized_features when present and preserves source labels', () => {
    const character = {
      level: 3,
      normalized_features: [
        { key: 'second wind', name: 'Second Wind', description: 'Heal yourself', source: 'Class' },
        { key: 'darkvision', name: 'Darkvision', description: 'See in darkness', source: 'Species' },
      ],
      features: [{ name: 'Ignored', source: 'Feat' }],
    };

    const normalized = normalizeFeatureViewModels(character);

    expect(normalized).toHaveLength(2);
    expect(normalized.find((f) => f.key === 'second wind')?.source).toBe('Class');
    expect(normalized.find((f) => f.key === 'darkvision')?.sourceCategory).toBe('species');
  });

  it('deduplicates by key keeping longest description', () => {
    const character = {
      level: 2,
      features: [
        { name: 'Second Wind', description: 'short', source: 'Class' },
        { name: 'Second Wind', description: 'A much longer and richer description.', source: 'Class' },
      ],
    };

    const normalized = normalizeFeatureViewModels(character);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].description).toContain('much longer');
  });

  it('filters by explicit source category', () => {
    const features = [
      { key: 'a', name: 'A', source: 'Class', sourceCategory: 'class' as const },
      { key: 'b', name: 'B', source: 'Species', sourceCategory: 'species' as const },
      { key: 'c', name: 'C', source: 'Feat', sourceCategory: 'feat' as const },
    ];

    expect(filterFeaturesByCategory(features, 'class')).toHaveLength(1);
    expect(filterFeaturesByCategory(features, 'species')).toHaveLength(1);
    expect(filterFeaturesByCategory(features, 'feats')).toHaveLength(1);
  });
});
