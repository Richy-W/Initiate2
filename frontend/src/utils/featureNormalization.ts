import { CharacterFeatureViewModel, FeatureSourceCategory } from '../types/characterMechanics';

export type FeatureFilter = 'all' | 'class' | 'species' | 'feats' | 'background';

const toArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, any>;
  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.features)) return obj.features;
  return [];
};

const inferCategory = (source: string): FeatureSourceCategory => {
  const normalized = source.toLowerCase();
  if (normalized.includes('class') || normalized.includes('subclass')) return 'class';
  if (normalized.includes('species') || normalized.includes('lineage') || normalized.includes('ancestry')) return 'species';
  if (normalized.includes('feat')) return 'feat';
  if (normalized.includes('background') || normalized.includes('origin')) return 'background';
  if (normalized.includes('system')) return 'system';
  return 'unknown';
};

const normalizeEntry = (entry: any, defaultSource = ''): CharacterFeatureViewModel | null => {
  if (typeof entry === 'string') {
    const name = entry.trim();
    if (!name) return null;
    const source = defaultSource || 'Unknown';
    return {
      key: name.toLowerCase(),
      name,
      description: '',
      source,
      sourceCategory: inferCategory(source),
    };
  }

  if (!entry || typeof entry !== 'object') return null;

  const rawName = entry.name || entry.title || entry.feature_name || entry.id;
  const name = String(rawName || '').trim();
  if (!name) return null;

  const description = String(entry.description || entry.details || entry.text || '').trim();
  const source = String(entry.source || defaultSource || 'Unknown').trim();

  return {
    key: name.toLowerCase(),
    name,
    description,
    source,
    sourceCategory: inferCategory(source),
  };
};

export const normalizeFeatureViewModels = (character: any): CharacterFeatureViewModel[] => {
  if (!character) return [];

  const fromCanonical = toArray(character.normalized_features)
    .map((entry) => normalizeEntry(entry))
    .filter(Boolean) as CharacterFeatureViewModel[];

  if (fromCanonical.length > 0) {
    return dedupeFeatureViewModels(fromCanonical);
  }

  const fromCharacterFeatures = toArray(character.features)
    .map((entry) => normalizeEntry(entry))
    .filter(Boolean) as CharacterFeatureViewModel[];

  const byLevel = character.class_detail?.features_by_level;
  const fromClassProgression = (byLevel && typeof byLevel === 'object'
    ? Object.entries(byLevel)
        .filter(([level]) => Number(level) <= Number(character.level || 0))
        .flatMap(([, feats]) => toArray(feats))
        .map((entry) => normalizeEntry(entry, 'Class'))
    : []
  ).filter(Boolean) as CharacterFeatureViewModel[];

  const fromSpeciesTraits = toArray(character.species_detail?.traits)
    .map((entry) => normalizeEntry(entry, 'Species'))
    .filter(Boolean) as CharacterFeatureViewModel[];

  return dedupeFeatureViewModels([
    ...fromCharacterFeatures,
    ...fromClassProgression,
    ...fromSpeciesTraits,
  ]);
};

export const dedupeFeatureViewModels = (
  features: CharacterFeatureViewModel[]
): CharacterFeatureViewModel[] => {
  const deduped = new Map<string, CharacterFeatureViewModel>();

  features.forEach((feature) => {
    if (feature.sourceCategory === 'system' || feature.source.toLowerCase() === 'species choice') {
      return;
    }

    const existing = deduped.get(feature.key);
    if (!existing) {
      deduped.set(feature.key, feature);
      return;
    }

    const existingDescLength = existing.description?.length || 0;
    const nextDescLength = feature.description?.length || 0;
    if (nextDescLength > existingDescLength) {
      deduped.set(feature.key, { ...existing, ...feature });
    }
  });

  return Array.from(deduped.values());
};

export const filterFeaturesByCategory = (
  features: CharacterFeatureViewModel[],
  activeFilter: FeatureFilter
): CharacterFeatureViewModel[] => {
  if (activeFilter === 'all') return features;

  if (activeFilter === 'class') {
    return features.filter((feature) => feature.sourceCategory === 'class');
  }

  if (activeFilter === 'species') {
    return features.filter((feature) => feature.sourceCategory === 'species');
  }

  if (activeFilter === 'feats') {
    return features.filter((feature) => feature.sourceCategory === 'feat');
  }

  if (activeFilter === 'background') {
    return features.filter((feature) => feature.sourceCategory === 'background');
  }

  return features;
};
