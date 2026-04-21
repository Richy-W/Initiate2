import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { characterAPI } from '../../services/apiClient';
import { SkillRolls } from './SkillRolls';
import { AttackRolls } from './AttackRolls';
import { SavingThrows } from './SavingThrows';
import { OfficialIdentityHeader } from './OfficialIdentityHeader';
import styles from './CharacterSheet.module.css';

interface Character {
  id: string;
  name: string;
  level: number;
  experience_points: number;
  species: any;
  character_class: any;
  background: any;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  total_strength?: number;
  total_dexterity?: number;
  total_constitution?: number;
  total_intelligence?: number;
  total_wisdom?: number;
  total_charisma?: number;
  dexterity_modifier?: number;
  current_hit_points: number;
  max_hit_points: number;
  temporary_hit_points?: number;
  armor_class: number;
  proficiency_bonus: number;
  skills?: Record<string, any>;
  skill_proficiencies?: any[] | Record<string, any> | string | null;
  skill_expertises?: any[] | Record<string, any> | string | null;
  features?: any[] | Record<string, any> | string | null;
  saving_throw_proficiencies?: string[] | Record<string, any> | string | null;
  skill_proficiencies_detail?: Array<{ id?: string; name?: string }> | Record<string, any> | string | null;
  skill_expertises_detail?: Array<{ id?: string; name?: string }>;
  class_detail?: {
    hit_die?: number;
    saving_throw_proficiencies?: string[];
    armor_proficiencies?: unknown;
    weapon_proficiencies?: unknown;
    tool_proficiencies?: unknown;
    starting_equipment?: any[] | Record<string, any> | string | null;
    starting_wealth?: Record<string, number>;
    features_by_level?: Record<string, any[]>;
  };
  species_detail?: {
    ability_score_increases?: Record<string, number>;
    languages?: unknown;
    darkvision?: number;
    has_darkvision?: boolean;
    movement_summary?: string;
    traits?: Array<{ name?: string; description?: string } | string>;
  };
  background_detail?: {
    ability_score_increases?: Record<string, number>;
    skill_proficiency_list?: Array<{ id?: string; name?: string }>;
    languages?: unknown;
    tool_proficiencies?: unknown;
    equipment?: any[] | Record<string, any> | string | null;
    starting_gold?: number;
  };
  background_ability_distribution?: Record<string, number>;
  equipment?: any[] | Record<string, any> | string | null;
  currency?: Record<string, number>;
  notes?: string;
}

type InfoTab = 'features' | 'proficiencies';
type FeatureFilter = 'all' | 'class' | 'species' | 'feats' | 'background';
type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

type CharacterFeature = {
  key: string;
  name: string;
  description?: string;
  source?: string;
};

const ABILITY_KEYS: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const ABILITY_NAME_MAP: Record<string, AbilityKey> = {
  str: 'strength',
  strength: 'strength',
  dex: 'dexterity',
  dexterity: 'dexterity',
  con: 'constitution',
  constitution: 'constitution',
  int: 'intelligence',
  intelligence: 'intelligence',
  wis: 'wisdom',
  wisdom: 'wisdom',
  cha: 'charisma',
  charisma: 'charisma',
};

export const CharacterSheet: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>('features');
  const [activeFeatureFilter, setActiveFeatureFilter] = useState<FeatureFilter>('all');
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaveState, setNotesSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isMobile, setIsMobile] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [currencyDraft, setCurrencyDraft] = useState({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
  const [currencySaveState, setCurrencySaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [inventoryActionError, setInventoryActionError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<CharacterFeature | null>(null);
  const [hpAdjustment, setHpAdjustment] = useState(0);
  const [tempHpDraft, setTempHpDraft] = useState(0);
  const [hpActionError, setHpActionError] = useState<string | null>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkIfMobile(); // Initial check
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!characterId) return;
      
      try {
        setLoading(true);
        const response = await characterAPI.get(characterId);
        setCharacter(response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load character');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [characterId]);

  useEffect(() => {
    setNotesDraft(character?.notes || '');
  }, [character?.id, character?.notes]);

  useEffect(() => {
    if (!character) {
      setCurrencyDraft({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
      setTempHpDraft(0);
      return;
    }

    const current = {
      cp: Number(character.currency?.cp || 0),
      sp: Number(character.currency?.sp || 0),
      ep: Number(character.currency?.ep || 0),
      gp: Number(character.currency?.gp || 0),
      pp: Number(character.currency?.pp || 0),
    };

    const hasCurrency = Object.values(current).some((value) => value > 0);
    if (hasCurrency) {
      setCurrencyDraft(current);
      return;
    }

    const classWealthGp = Number(character.class_detail?.starting_wealth?.gp || 0);
    const backgroundGoldGp = Number(character.background_detail?.starting_gold || 0);
    setCurrencyDraft({ ...current, gp: classWealthGp + backgroundGoldGp });
  }, [character]);

  useEffect(() => {
    setTempHpDraft(Number(character?.temporary_hit_points || 0));
  }, [character?.id, character?.temporary_hit_points]);

  const getAbilityModifier = useCallback((score: number): number => {
    return Math.floor((score - 10) / 2);
  }, []);

  const saveNotes = useCallback(
    async (text: string) => {
      if (!character?.id) return;

      setNotesSaveState('saving');
      try {
        await characterAPI.update(character.id, { notes: text });
        setCharacter((prev) => (prev ? { ...prev, notes: text } : prev));
        setNotesSaveState('saved');
        window.setTimeout(() => {
          setNotesSaveState((state) => (state === 'saved' ? 'idle' : state));
        }, 1400);
      } catch {
        setNotesSaveState('error');
      }
    },
    [character?.id]
  );

  useEffect(() => {
    if (!character) return;

    const persistedNotes = character.notes || '';
    if (notesDraft === persistedNotes) return;

    const timer = window.setTimeout(() => {
      void saveNotes(notesDraft);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [notesDraft, character, saveNotes]);

  const handleAddItem = useCallback(async () => {
    if (!character?.id) return;
    const itemName = newItemName.trim();
    if (!itemName) {
      setInventoryActionError('Item name is required.');
      return;
    }

    try {
      const response = await characterAPI.addItem(character.id, {
        name: itemName,
        quantity: Math.max(1, Number(newItemQty) || 1),
      });

      if (response?.character) {
        setCharacter(response.character);
      }

      // Always refresh from API to guarantee the Equipment pane is in sync.
      const fresh = await characterAPI.get(character.id);
      setCharacter(fresh);

      setNewItemName('');
      setNewItemQty(1);
      setInventoryActionError(null);
    } catch (err: any) {
      setInventoryActionError(err?.response?.data?.error || 'Could not add item.');
    }
  }, [character?.id, newItemName, newItemQty]);

  const applyDamage = useCallback(async () => {
    if (!character?.id) return;
    const amount = Math.max(0, Number(hpAdjustment) || 0);
    if (amount <= 0) {
      setHpActionError('Enter a damage amount greater than 0.');
      return;
    }

    try {
      const response = await characterAPI.takeDamage(character.id, { damage: amount });
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              current_hit_points: response?.current_hp ?? prev.current_hit_points,
              temporary_hit_points: response?.temp_hp ?? prev.temporary_hit_points,
            }
          : prev
      );
      setHpAdjustment(0);
      setTempHpDraft((prev) => Number(response?.temp_hp ?? prev));
      setHpActionError(null);
    } catch (err: any) {
      setHpActionError(err?.response?.data?.error || 'Could not apply damage.');
    }
  }, [character?.id, hpAdjustment]);

  const applyHealing = useCallback(async () => {
    if (!character?.id) return;
    const amount = Math.max(0, Number(hpAdjustment) || 0);
    if (amount <= 0) {
      setHpActionError('Enter a healing amount greater than 0.');
      return;
    }

    try {
      const response = await characterAPI.heal(character.id, { healing: amount });
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              current_hit_points: response?.current_hp ?? prev.current_hit_points,
            }
          : prev
      );
      setHpAdjustment(0);
      setHpActionError(null);
    } catch (err: any) {
      setHpActionError(err?.response?.data?.error || 'Could not apply healing.');
    }
  }, [character?.id, hpAdjustment]);

  const saveTempHp = useCallback(async () => {
    if (!character?.id) return;
    const amount = Math.max(0, Number(tempHpDraft) || 0);

    try {
      await characterAPI.update(character.id, { temporary_hit_points: amount });
      setCharacter((prev) => (prev ? { ...prev, temporary_hit_points: amount } : prev));
      setHpActionError(null);
    } catch (err: any) {
      setHpActionError(err?.response?.data?.error || 'Could not update temporary hit points.');
    }
  }, [character?.id, tempHpDraft]);

  useEffect(() => {
    if (!character?.id) return;

    const current = {
      cp: Number(character.currency?.cp || 0),
      sp: Number(character.currency?.sp || 0),
      ep: Number(character.currency?.ep || 0),
      gp: Number(character.currency?.gp || 0),
      pp: Number(character.currency?.pp || 0),
    };

    const unchanged =
      current.cp === currencyDraft.cp &&
      current.sp === currencyDraft.sp &&
      current.ep === currencyDraft.ep &&
      current.gp === currencyDraft.gp &&
      current.pp === currencyDraft.pp;

    if (unchanged) return;

    const timer = window.setTimeout(async () => {
      setCurrencySaveState('saving');
      try {
        const response = await characterAPI.setCurrency(character.id, currencyDraft);
        const savedCurrency = response?.currency || currencyDraft;
        setCharacter((prev) => (prev ? { ...prev, currency: { ...savedCurrency } } : prev));
        setCurrencySaveState('saved');
        window.setTimeout(() => {
          setCurrencySaveState((state) => (state === 'saved' ? 'idle' : state));
        }, 1200);
      } catch {
        setCurrencySaveState('error');
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [character?.id, character?.currency, currencyDraft]);

  const getAbilityModifierString = (score: number): string => {
    const mod = getAbilityModifier(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const normalizeToArray = useCallback((value: unknown): any[] => {
    if (Array.isArray(value)) {
      return value;
    }

    if (value == null) {
      return [];
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          return normalizeToArray(JSON.parse(trimmed));
        } catch {
          return [value];
        }
      }

      return [value];
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, any>;

      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.results)) return obj.results;
      if (Array.isArray(obj.features)) return obj.features;

      return Object.values(obj);
    }

    return [value];
  }, []);

  const abilityTotals = useMemo(
    () => {
      const zeroes: Record<AbilityKey, number> = {
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
      };

      const parseAbilityBonuses = (value: unknown): Record<AbilityKey, number> => {
        const totals = { ...zeroes };

        const addBonus = (abilityRaw: unknown, bonusRaw: unknown) => {
          const abilityKey = ABILITY_NAME_MAP[String(abilityRaw || '').toLowerCase()];
          const bonus = Number(bonusRaw);
          if (!abilityKey || !Number.isFinite(bonus)) return;
          totals[abilityKey] += bonus;
        };

        const walk = (node: unknown) => {
          if (node == null) return;

          if (Array.isArray(node)) {
            node.forEach(walk);
            return;
          }

          if (typeof node === 'string') {
            const trimmed = node.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try {
                walk(JSON.parse(trimmed));
              } catch {
                // Ignore invalid JSON strings.
              }
            }
            return;
          }

          if (typeof node !== 'object') return;

          const record = node as Record<string, unknown>;

          Object.entries(record).forEach(([key, rawValue]) => {
            const mapped = ABILITY_NAME_MAP[key.toLowerCase()];
            if (mapped) {
              addBonus(mapped, rawValue);
            }
          });

          if (record.ability && (record.bonus != null || record.value != null || record.amount != null || record.increase != null)) {
            addBonus(record.ability, record.bonus ?? record.value ?? record.amount ?? record.increase);
          }

          const nestedKeys = [
            'ability_score_increase',
            'ability_score_increases',
            'ability_bonuses',
            'selected_ability_bonuses',
            'selected_ability_distribution',
            'background_ability_distribution',
            'bonuses',
            'asi',
          ];

          nestedKeys.forEach((nestedKey) => {
            if (record[nestedKey] != null) {
              walk(record[nestedKey]);
            }
          });
        };

        walk(value);
        return totals;
      };

      const baseScores: Record<AbilityKey, number> = {
        strength: character?.strength ?? 10,
        dexterity: character?.dexterity ?? 10,
        constitution: character?.constitution ?? 10,
        intelligence: character?.intelligence ?? 10,
        wisdom: character?.wisdom ?? 10,
        charisma: character?.charisma ?? 10,
      };

      const backendTotals: Record<AbilityKey, number> = {
        strength: character?.total_strength ?? baseScores.strength,
        dexterity: character?.total_dexterity ?? baseScores.dexterity,
        constitution: character?.total_constitution ?? baseScores.constitution,
        intelligence: character?.total_intelligence ?? baseScores.intelligence,
        wisdom: character?.total_wisdom ?? baseScores.wisdom,
        charisma: character?.total_charisma ?? baseScores.charisma,
      };

      const speciesBonuses = parseAbilityBonuses(character?.species_detail?.ability_score_increases);
      const backgroundFixedBonuses = parseAbilityBonuses(character?.background_detail?.ability_score_increases);
      const backgroundChosenBonuses = parseAbilityBonuses(
        character?.background_ability_distribution ||
          (character?.background_detail as any)?.selected_ability_distribution ||
          (character?.background_detail as any)?.selected_ability_bonuses
      );

      const featBonuses = normalizeToArray(character?.features).reduce((acc, feature) => {
        const parsed = parseAbilityBonuses(feature);
        ABILITY_KEYS.forEach((ability) => {
          acc[ability] += parsed[ability];
        });
        return acc;
      }, { ...zeroes });

      return ABILITY_KEYS.reduce((acc, ability) => {
        const baseline = baseScores[ability] + speciesBonuses[ability] + backgroundFixedBonuses[ability];
        const derivedWithChoices = baseline + backgroundChosenBonuses[ability] + featBonuses[ability];
        const backendValue = backendTotals[ability];

        acc[ability] = Math.max(baseScores[ability], backendValue, derivedWithChoices);
        return acc;
      }, { ...zeroes });
    },
    [character, normalizeToArray]
  );

  const characterForDerivedTotals = useMemo(
    () =>
      character
        ? {
            ...character,
            total_strength: abilityTotals.strength,
            total_dexterity: abilityTotals.dexterity,
            total_constitution: abilityTotals.constitution,
            total_intelligence: abilityTotals.intelligence,
            total_wisdom: abilityTotals.wisdom,
            total_charisma: abilityTotals.charisma,
          }
        : character,
    [character, abilityTotals]
  );

  const normalizeSkillToken = useCallback(
    (value: unknown): string =>
      String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),
    []
  );

  const proficiencyTokens = useMemo(() => {
    const directProficiencies = normalizeToArray(character?.skill_proficiencies_detail);
    const fallbackProficiencies = directProficiencies.length
      ? directProficiencies
      : normalizeToArray(character?.background_detail?.skill_proficiency_list);

    const fromRaw = normalizeToArray(character?.skill_proficiencies);

    return new Set(
      [...fallbackProficiencies, ...fromRaw]
        .map((entry) => {
          if (typeof entry === 'string') return normalizeSkillToken(entry);
          if ((entry as any)?.name) return normalizeSkillToken((entry as any).name);
          if ((entry as any)?.id) return normalizeSkillToken((entry as any).id);
          return '';
        })
        .filter(Boolean)
    );
  }, [character, normalizeSkillToken, normalizeToArray]);

  const expertiseTokens = useMemo(
    () =>
      new Set(
        [...normalizeToArray(character?.skill_expertises), ...normalizeToArray(character?.skill_expertises_detail)]
          .map((entry) => {
            if (typeof entry === 'string') return normalizeSkillToken(entry);
            if ((entry as any)?.name) return normalizeSkillToken((entry as any).name);
            if ((entry as any)?.id) return normalizeSkillToken((entry as any).id);
            return '';
          })
          .filter(Boolean)
      ),
    [character, normalizeSkillToken, normalizeToArray]
  );

  // Effective max HP accounts for feat bonuses (e.g. Tough) that may not be baked
  // into the DB value for characters created before the backend fix.
  const effectiveMaxHp = useMemo(() => {
    if (!character) return 0;
    const storedMax = character.max_hit_points || 0;
    const level = character.level || 1;
    const hasTough = normalizeToArray(character.features).some((f) => {
      const name = typeof f === 'string' ? f : String((f as any)?.name || '');
      return name.trim().toLowerCase() === 'tough';
    });
    if (!hasTough) return storedMax;
    // Tough gives level+1 bonus. If storedMax already includes it (future chars), don't double-add.
    const toughBonus = level + 1;
    // Heuristic: if storedMax equals the raw base (no tough baked in), add the bonus.
    // Base HP at level 1 = hitDie + conMod.
    const conMod = Math.floor(((character.constitution || 10) - 10) / 2);
    const hitDie = character.class_detail?.hit_die || 8;
    const rawBaseHp = hitDie + conMod;
    if (storedMax <= rawBaseHp) {
      return storedMax + toughBonus;
    }
    return storedMax;
  }, [character, normalizeToArray]);

  const passiveSummary = useMemo(() => {
    const skillMeta = [
      { key: 'perception', label: 'Passive Perception', ability: 'wisdom' as AbilityKey },
      { key: 'investigation', label: 'Passive Investigation', ability: 'intelligence' as AbilityKey },
      { key: 'insight', label: 'Passive Insight', ability: 'wisdom' as AbilityKey },
    ];

    const calcSkillBonus = (skillKey: string, ability: AbilityKey): number => {
      const abilityModifier = getAbilityModifier(abilityTotals[ability] || 10);
      const normalizedSkillKey = normalizeSkillToken(skillKey);

      if (expertiseTokens.has(normalizedSkillKey)) {
        return abilityModifier + (character?.proficiency_bonus || 0) * 2;
      }

      if (proficiencyTokens.has(normalizedSkillKey)) {
        return abilityModifier + (character?.proficiency_bonus || 0);
      }

      return abilityModifier;
    };

    const passives = skillMeta.map((entry) => ({
      key: entry.key,
      label: entry.label,
      value: 10 + calcSkillBonus(entry.key, entry.ability),
    }));

    const senses: string[] = [];

    const extractDarkvisionRange = (text: string): number => {
      const lower = text.toLowerCase();
      if (!lower.includes('darkvision')) return 0;

      const feetPattern = /(\d+)\s*(?:feet|foot|ft\.?)/i;
      const feetMatch = text.match(feetPattern);
      if (feetMatch) {
        return Number(feetMatch[1]) || 0;
      }

      const genericNumberMatch = text.match(/(\d+)/);
      return genericNumberMatch ? Number(genericNumberMatch[1]) || 0 : 0;
    };

    let darkvisionRange = Number(character?.species_detail?.darkvision || 0);

    if (darkvisionRange <= 0) {
      const speciesTraits = normalizeToArray(character?.species_detail?.traits);
      for (const trait of speciesTraits) {
        if (typeof trait === 'string') {
          darkvisionRange = Math.max(darkvisionRange, extractDarkvisionRange(trait));
        } else if (trait && typeof trait === 'object') {
          const name = String((trait as any).name || '');
          const description = String((trait as any).description || '');
          darkvisionRange = Math.max(
            darkvisionRange,
            extractDarkvisionRange(`${name} ${description}`)
          );
        }
      }
    }

    if (darkvisionRange <= 0) {
      const featureEntries = normalizeToArray(character?.features);
      for (const feature of featureEntries) {
        if (typeof feature === 'string') {
          darkvisionRange = Math.max(darkvisionRange, extractDarkvisionRange(feature));
        } else if (feature && typeof feature === 'object') {
          const name = String((feature as any).name || '');
          const description = String((feature as any).description || (feature as any).details || '');
          darkvisionRange = Math.max(
            darkvisionRange,
            extractDarkvisionRange(`${name} ${description}`)
          );
        }
      }
    }

    if (darkvisionRange > 0) {
      senses.push(`Darkvision ${darkvisionRange} ft.`);
    }

    if (!senses.length) {
      senses.push('No special senses listed');
    }

    return { passives, senses };
  }, [abilityTotals, character, expertiseTokens, getAbilityModifier, normalizeSkillToken, normalizeToArray, proficiencyTokens]);

  const classAndBackgroundFeatures = useMemo(() => {
    if (!character) return [] as CharacterFeature[];

    const toFeature = (feature: any): CharacterFeature | null => {
      if (typeof feature === 'string') {
        const cleanName = feature.trim();
        if (!cleanName) return null;
        const key = cleanName.toLowerCase();
        return { key, name: cleanName };
      }

      if (!feature || typeof feature !== 'object') {
        return null;
      }

      const rawName = feature.name || feature.title || feature.feature_name || feature.id;
      const cleanName = String(rawName || '').trim();
      if (!cleanName) return null;

      const descriptionParts = [feature.description, feature.details, feature.text]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);

      const source = typeof feature.source === 'string' ? feature.source.trim() : '';
      const key = cleanName.toLowerCase();

      return {
        key,
        name: cleanName,
        description: descriptionParts[0] || undefined,
        source: source || undefined,
      };
    };

    const fromCharacterFeatures = normalizeToArray(character.features)
      .map((feature) => toFeature(feature))
      .filter(Boolean) as CharacterFeature[];

    const byLevel = character.class_detail?.features_by_level;
    const byLevelEntries = byLevel && typeof byLevel === 'object' ? Object.entries(byLevel) : [];

    const fromClassProgression = byLevelEntries
      .filter(([level]) => Number(level) <= character.level)
      .flatMap(([, feats]) => normalizeToArray(feats))
      .map((feature) => toFeature(feature))
      .filter(Boolean) as CharacterFeature[];

    const fromSpeciesTraits = normalizeToArray(character.species_detail?.traits)
      .map((trait) => {
        const traitFeature = toFeature(trait);
        if (!traitFeature) return null;
        return {
          ...traitFeature,
          source: traitFeature.source || 'Species',
        };
      })
      .filter(Boolean) as CharacterFeature[];

    const merged = [...fromCharacterFeatures, ...fromClassProgression, ...fromSpeciesTraits];
    const deduped = new Map<string, CharacterFeature>();

    merged.forEach((feature) => {
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
  }, [character, normalizeToArray]);

  const filteredFeatures = useMemo(() => {
    if (activeFeatureFilter === 'all') return classAndBackgroundFeatures;

    const includesText = (value: string, terms: string[]): boolean =>
      terms.some((term) => value.includes(term));

    return classAndBackgroundFeatures.filter((feature) => {
      const source = String(feature.source || '').toLowerCase();
      const name = String(feature.name || '').toLowerCase();
      const combined = `${source} ${name}`;

      if (activeFeatureFilter === 'class') {
        return includesText(combined, ['class', 'spellcasting', 'fighting style', 'channel', 'rage']);
      }

      if (activeFeatureFilter === 'species') {
        return includesText(combined, ['species', 'lineage', 'ancestry', 'legacy', 'darkvision', 'trance']);
      }

      if (activeFeatureFilter === 'feats') {
        return includesText(combined, ['feat']);
      }

      if (activeFeatureFilter === 'background') {
        return includesText(combined, ['background', 'origin']);
      }

      return true;
    });
  }, [activeFeatureFilter, classAndBackgroundFeatures]);

  const extractLabels = useCallback(
    (value: unknown): string[] => {
      const parseLooseList = (input: unknown): unknown => {
        if (typeof input !== 'string') return input;

        const trimmed = input.trim();
        if (!trimmed) return [];

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            return JSON.parse(trimmed);
          } catch {
            try {
              const normalized = trimmed
                .replace(/\bNone\b/g, 'null')
                .replace(/\bTrue\b/g, 'true')
                .replace(/\bFalse\b/g, 'false')
                .replace(/'/g, '"');
              return JSON.parse(normalized);
            } catch {
              const inner = trimmed.slice(1, -1).trim();
              if (!inner) return [];
              return inner
                .split(',')
                .map((part) => part.trim().replace(/^['"]+|['"]+$/g, '').trim())
                .filter(Boolean);
            }
          }
        }

        return input;
      };

      const humanize = (text: string) =>
        text
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const collect = (entry: unknown): string[] => {
        const parsedEntry = parseLooseList(entry);

        if (typeof parsedEntry === 'string') {
          const text = parsedEntry.trim();
          return text ? [text] : [];
        }

        if (typeof parsedEntry === 'number') {
          return [String(parsedEntry)];
        }

        if (Array.isArray(parsedEntry)) {
          return parsedEntry.flatMap((item) => collect(item));
        }

        if (!parsedEntry || typeof parsedEntry !== 'object') {
          return [];
        }

        const obj = parsedEntry as Record<string, any>;
        const labels: string[] = [];

        const named = obj.name || obj.label || obj.title || obj.value;
        if (typeof named === 'string' && named.trim()) {
          labels.push(named.trim());
        }

        if (obj.fixed != null) {
          labels.push(...collect(obj.fixed));
        }

        if (obj.choice && typeof obj.choice === 'object') {
          const choiceObj = obj.choice as Record<string, any>;
          const count = Number(choiceObj.count || 1);
          const from = collect(choiceObj.from || choiceObj.options || []);
          const type = typeof choiceObj.type === 'string' ? choiceObj.type.trim() : '';

          if (from.length) {
            labels.push(`Choose ${count}: ${from.join(', ')}`);
          } else if (type) {
            labels.push(`Choose ${count} ${type}`);
          }
        }

        if (obj.choose && (obj.from || obj.options)) {
          const chooseCount = Number(obj.choose || 1);
          const from = collect(obj.from || obj.options || []);
          if (from.length) {
            labels.push(`Choose ${chooseCount}: ${from.join(', ')}`);
          }
        }

        Object.entries(obj).forEach(([key, valueItem]) => {
          if (valueItem === true && !['name', 'label', 'title', 'value'].includes(key)) {
            labels.push(humanize(key));
          }
        });

        // Generic recursive fallback for any nested structures not covered above.
        Object.entries(obj).forEach(([key, valueItem]) => {
          if (['name', 'label', 'title', 'value', 'fixed', 'choice', 'choose', 'from', 'options'].includes(key)) {
            return;
          }
          labels.push(...collect(valueItem));
        });

        return labels;
      };

      return Array.from(new Set(collect(value).filter(Boolean)));
    },
    []
  );

  const proficienciesSummary = useMemo(() => {
    if (!character) {
      return {
        armor: [] as string[],
        weapons: [] as string[],
        tools: [] as string[],
        languages: [] as string[],
      };
    }

    const armor = extractLabels(character.class_detail?.armor_proficiencies);
    const weapons = extractLabels(character.class_detail?.weapon_proficiencies);
    const tools = Array.from(
      new Set([
        ...extractLabels(character.class_detail?.tool_proficiencies),
        ...extractLabels(character.background_detail?.tool_proficiencies),
      ])
    );
    const languages = Array.from(
      new Set([
        ...extractLabels(character.species_detail?.languages),
        ...extractLabels(character.background_detail?.languages),
      ])
    );

    return { armor, weapons, tools, languages };
  }, [character, extractLabels]);

  useEffect(() => {
    if (!selectedFeature) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedFeature(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedFeature]);

  const savingThrowProficiencies = useMemo(() => {
    if (!character) return [] as string[];

    const parsePythonList = (value: unknown): any[] => {
      if (Array.isArray(value)) return value;
      if (value == null) return [];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith('[')) {
          try {
            return JSON.parse(trimmed);
          } catch {
            const inner = trimmed.slice(1, -1).trim();
            if (!inner) return [];
            return inner
              .split(',')
              .map((s) => s.trim().replace(/^['"]+|['"]+$/g, '').trim())
              .filter(Boolean);
          }
        }
        if (trimmed.includes(',')) {
          return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [trimmed];
      }
      if (typeof value === 'object') {
        const obj = value as Record<string, any>;
        return Array.isArray(obj.results) ? obj.results : Object.values(obj);
      }
      return [value];
    };

    const ALIAS_MAP: Record<string, string> = {
      str: 'strength', strength: 'strength',
      dex: 'dexterity', dexterity: 'dexterity',
      con: 'constitution', constitution: 'constitution',
      int: 'intelligence', intelligence: 'intelligence',
      wis: 'wisdom', wisdom: 'wisdom',
      cha: 'charisma', charisma: 'charisma',
    };

    const toCanonical = (raw: unknown): string | null => {
      const s = typeof raw === 'string' ? raw : (raw as any)?.name || (raw as any)?.id || null;
      if (!s) return null;
      return ALIAS_MAP[String(s).trim().toLowerCase()] || String(s).trim().toLowerCase() || null;
    };

    const rawSavingThrows = parsePythonList(character.saving_throw_proficiencies);
    const fallbackSavingThrows = rawSavingThrows.length
      ? rawSavingThrows
      : parsePythonList(character.class_detail?.saving_throw_proficiencies);

    return fallbackSavingThrows
      .map(toCanonical)
      .filter(Boolean) as string[];
  }, [character]);

  const effectiveSkillProficiencies = useMemo(() => {
    if (!character) return [] as Array<{ id?: string; name?: string } | string>;

    const direct = normalizeToArray(character.skill_proficiencies_detail);
    if (direct.length) return direct;

    return normalizeToArray(character.background_detail?.skill_proficiency_list);
  }, [character, normalizeToArray]);

  const normalizeEquipment = (equipment: Character['equipment']): any[] => {
    if (Array.isArray(equipment)) {
      return equipment;
    }

    if (typeof equipment === 'string') {
      const trimmed = equipment.trim();
      if (!trimmed) return [];

      const parseAsPythonJson = (raw: string): any => {
        // Replace Python keywords, then convert only single-quote STRING DELIMITERS to
        // double quotes. Python repr uses '' for strings without apostrophes and "" for
        // strings that contain one — so '([^']*)' safely targets only delimiters.
        const normalized = raw
          .replace(/\bNone\b/g, 'null')
          .replace(/\bTrue\b/g, 'true')
          .replace(/\bFalse\b/g, 'false')
          .replace(/'([^']*)'/g, (_, inner) => '"' + inner.replace(/"/g, '\\"') + '"');
        return JSON.parse(normalized);
      };

      try {
        return normalizeEquipment(JSON.parse(equipment));
      } catch {
        try {
          return normalizeEquipment(parseAsPythonJson(trimmed));
        } catch {
          return [{ name: trimmed, quantity: 1 }];
        }
      }
    }

    if (equipment && typeof equipment === 'object') {
      const equipmentObj = equipment as Record<string, any>;

      if ('name' in equipmentObj || 'equipment_id' in equipmentObj) {
        return [equipmentObj];
      }

      if (Array.isArray(equipmentObj.items)) {
        return equipmentObj.items;
      }

      return Object.entries(equipmentObj).map(([key, value]) => {
        if (value && typeof value === 'object') {
          return value;
        }

        return {
          name: String(key),
          quantity: typeof value === 'number' ? value : undefined,
          value,
        };
      });
    }

    return [];
  };

  if (loading) {
    return <div className="loading">Loading character...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!character) {
    return <div className="error">Character not found</div>;
  }

  const directEquipment = normalizeEquipment(character.equipment);
  const backgroundEquipment = normalizeEquipment(character.background_detail?.equipment);
  const classEquipment = normalizeEquipment(character.class_detail?.starting_equipment);
  const equipmentItems = directEquipment.length > 0 ? directEquipment : [...backgroundEquipment, ...classEquipment];

  const characterForRollPanels = {
    ...(characterForDerivedTotals || character),
    skill_proficiencies: effectiveSkillProficiencies,
    skill_proficiencies_detail: effectiveSkillProficiencies,
    skill_expertises: normalizeToArray(character?.skill_expertises),
    skill_expertises_detail: normalizeToArray(character?.skill_expertises_detail),
    saving_throw_proficiencies: savingThrowProficiencies,
  };

  const headerAbilities = [
    { key: 'strength', label: 'STR', total: abilityTotals.strength },
    { key: 'dexterity', label: 'DEX', total: abilityTotals.dexterity },
    { key: 'constitution', label: 'CON', total: abilityTotals.constitution },
    { key: 'intelligence', label: 'INT', total: abilityTotals.intelligence },
    { key: 'wisdom', label: 'WIS', total: abilityTotals.wisdom },
    { key: 'charisma', label: 'CHA', total: abilityTotals.charisma },
  ];

  return (
    <div className={styles['character-sheet']} role="main" aria-label={`Character sheet for ${character.name}`}>
      {/* Character Header */}
      <header className={styles['character-header']}>
        <div className={styles['character-basic-info']}>
          <OfficialIdentityHeader
            name={character.name}
            level={character.level}
            background={character.background?.name || (character as any).background_name}
            characterClass={character.character_class?.name || (character as any).class_name}
            species={character.species?.name || (character as any).species_name}
          />

          <div className={styles['header-abilities-grid']} role="list" aria-label="Ability scores">
            {headerAbilities.map((ability) => (
              <div key={ability.key} className={styles['header-ability-chip']} role="listitem">
                <span className={styles['header-ability-label']} id={`ability-label-${ability.key}`}>{ability.label}</span>
                <span className={styles['header-ability-score']} aria-labelledby={`ability-label-${ability.key}`}>{ability.total || 10}</span>
                <span className={styles['header-ability-modifier']} aria-label={`Modifier: ${getAbilityModifierString(ability.total || 10)}`}>{getAbilityModifierString(ability.total || 10)}</span>
              </div>
            ))}
          </div>
          
          <div className={styles['character-vital-stats']}>
            <div className={[styles['vital-stat'], styles['hp-stat-card']].filter(Boolean).join(' ')}>
              <div className={styles['vital-stat-label']} id="hp-label">Hit Points</div>
              <div className={styles['vital-stat-value']} aria-labelledby="hp-label" aria-live="polite">{character.current_hit_points}/{effectiveMaxHp}</div>
              <div className={styles['hp-adjustment-panel']}>
                <input
                  type="number"
                  min={0}
                  value={hpAdjustment}
                  onChange={(e) => {
                    setHpAdjustment(Math.max(0, Number(e.target.value) || 0));
                    setHpActionError(null);
                  }}
                  placeholder="Amount"
                />
                <button type="button" onClick={() => void applyDamage()}>Damage</button>
                <button type="button" onClick={() => void applyHealing()}>Heal</button>
              </div>
              <div className={styles['temp-hp-panel']}>
                <span>Temp</span>
                <input
                  type="number"
                  min={0}
                  value={tempHpDraft}
                  onChange={(e) => {
                    setTempHpDraft(Math.max(0, Number(e.target.value) || 0));
                    setHpActionError(null);
                  }}
                />
                <button type="button" onClick={() => void saveTempHp()}>Save</button>
              </div>
              {hpActionError && <div className={styles['vital-stat-feedback']}>{hpActionError}</div>}
            </div>
            <div className={styles['vital-stat']}>
              <div className={styles['vital-stat-label']}>Armor Class</div>
              <div className={styles['vital-stat-value']}>{character.armor_class}</div>
            </div>
            <div className={styles['vital-stat']}>
              <div className={styles['vital-stat-label']}>Initiative</div>
                <div className={styles['vital-stat-value']}>{getAbilityModifierString(abilityTotals.dexterity)}</div>
            </div>
            <div className={styles['vital-stat']}>
              <div className={styles['vital-stat-label']}>Proficiency</div>
              <div className={styles['vital-stat-value']}>+{character.proficiency_bonus || 2}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className={styles['character-tabs']}>
        <button
          className={[styles['tab-button'], activeTab === 'stats' ? styles['active'] : ''].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button
          className={[styles['tab-button'], activeTab === 'combat' ? styles['active'] : ''].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('combat')}
        >
          Combat
        </button>
        <button
          className={[styles['tab-button'], activeTab === 'equipment' ? styles['active'] : ''].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment
        </button>
      </div>

      {/* Main Content - D&D Beyond Layout */}
      <div className={styles['character-content']}>
        {/* Left Sidebar - Always visible on desktop */}
        <div className={styles['character-left-sidebar']}>
          {/* Saving Throws */}
          <div className={[styles['character-section'], styles['saving-throws']].filter(Boolean).join(' ')}>
            <div className={styles['section-header']}>
              <h3 className={styles['section-title']}>Saving Throws</h3>
            </div>
            <SavingThrows character={characterForRollPanels} />
          </div>

          <div className={[styles['character-section'], styles['senses-panel']].filter(Boolean).join(' ')}>
            <div className={styles['passive-list']}>
              {passiveSummary.passives.map((item) => (
                <div key={item.key} className={styles['passive-item']}>
                  <span className={styles['passive-value']}>{item.value}</span>
                  <span className={styles['passive-label']}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className={styles['senses-list']}>
              {passiveSummary.senses.map((sense) => (
                <div key={sense} className={styles['sense-line']}>{sense}</div>
              ))}
            </div>
            <div className={styles['senses-title']}>Senses</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles['character-main-content']}>
          {/* Mobile Content Switching */}
          {(activeTab === 'stats' || !isMobile) && (
            <div className={[styles['character-section'], styles['skills']].filter(Boolean).join(' ')}>
              <div className={styles['section-header']}>
                <h3 className={styles['section-title']}>Skills</h3>
              </div>
              <SkillRolls character={characterForRollPanels} />
            </div>
          )}

          {(activeTab === 'combat' || !isMobile) && (
            <div className={[styles['character-section'], styles['combat']].filter(Boolean).join(' ')}>
              <div className={styles['section-header']}>
                <h3 className={styles['section-title']}>Combat</h3>
              </div>
              <AttackRolls character={characterForRollPanels} />
            </div>
          )}

          {(activeTab === 'equipment' || !isMobile) && (
            <div className={[styles['character-section'], styles['equipment']].filter(Boolean).join(' ')}>
              <div className={styles['section-header']}>
                <h3 className={styles['section-title']}>Equipment</h3>
              </div>
              <div className={styles['currency']}>
                <h4>Currency</h4>
                <div className={styles['currency-display']}>
                  {([
                    ['cp', 'CP'],
                    ['sp', 'SP'],
                    ['gp', 'GP'],
                    ['ep', 'EP'],
                    ['pp', 'PP'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className={[styles['currency-input-box'], styles[`coin-${key}`]].filter(Boolean).join(' ')}>
                      <span className={styles['coin-badge']}>{label}</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={currencyDraft[key]}
                        onChange={(e) => {
                          setCurrencyDraft((prev) => ({
                            ...prev,
                            [key]: Math.max(0, Number(e.target.value) || 0),
                          }));
                          setInventoryActionError(null);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div className={[styles['notes-save-state'], currencySaveState !== 'idle' ? styles[currencySaveState] : ''].filter(Boolean).join(' ')}>
                  {currencySaveState === 'saving' && 'Saving currency...'}
                  {currencySaveState === 'saved' && 'Currency saved'}
                  {currencySaveState === 'error' && 'Could not save currency'}
                </div>
              </div>
              
              <div className={styles['equipment-list']}>
                <h4>Items</h4>
                <div className={styles['equipment-add-controls']}>
                  <h5>Add Item</h5>
                  <div className={styles['equipment-add-row']}>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => {
                        setNewItemName(e.target.value);
                        setInventoryActionError(null);
                      }}
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => {
                        setNewItemQty(Math.max(1, Number(e.target.value) || 1));
                        setInventoryActionError(null);
                      }}
                      placeholder="Qty"
                    />
                    <button type="button" onClick={() => void handleAddItem()}>
                      Add
                    </button>
                  </div>
                </div>
                {equipmentItems.length > 0 ? (
                  <ul>
                    {equipmentItems.map((item, index) => {
                      const isObject = item && typeof item === 'object';
                      const itemName = isObject
                        ? item.name || item.equipment_id || `Item ${index + 1}`
                        : String(item);
                      const quantity = isObject ? item.quantity : undefined;

                      return (
                        <li key={item?.id || item?.equipment_id || index}>
                          {itemName}{typeof quantity === 'number' && quantity > 1 ? ` (${quantity})` : ''}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>No equipment</p>
                )}
                {inventoryActionError && <p className={styles['traits-empty']}>{inventoryActionError}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Desktop only */}
        <div className={styles['character-right-sidebar']}>
          <div className={[styles['character-section'], styles['traits-pane']].filter(Boolean).join(' ')}>
            <div className={styles['section-header']}>
              <h3 className={styles['section-title']}>Features & Traits</h3>
            </div>
            <div className={styles['traits-tabs']}>
              <button
                className={[styles['traits-tab'], activeInfoTab === 'features' ? styles['active'] : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveInfoTab('features')}
              >
                Features
              </button>
              <button
                className={[styles['traits-tab'], activeInfoTab === 'proficiencies' ? styles['active'] : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveInfoTab('proficiencies')}
              >
                Proficiencies
              </button>
            </div>

            {activeInfoTab === 'features' && (
              <div className={styles['traits-content']}>
                <h4>Features Browser</h4>
                <div className={styles['feature-filter-row']}>
                  {([
                    ['all', 'All'],
                    ['class', 'Class'],
                    ['species', 'Species'],
                    ['feats', 'Feats'],
                    ['background', 'Background'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={[styles['feature-filter-pill'], activeFeatureFilter === key ? styles['active'] : ''].filter(Boolean).join(' ')}
                      onClick={() => setActiveFeatureFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filteredFeatures.length > 0 ? (
                  <ul className={styles['traits-list']}>
                    {filteredFeatures.map((feature) => (
                      <li key={feature.key} className={styles['feature-item']}>
                        <button
                          type="button"
                          className={styles['feature-toggle']}
                          onClick={() => {
                            setSelectedFeature(feature);
                          }}
                        >
                          <span>{feature.name}</span>
                          {feature.source ? <small>{feature.source}</small> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles['traits-empty']}>No features found for this section yet.</p>
                )}
              </div>
            )}

            {activeInfoTab === 'proficiencies' && (
              <div className={styles['traits-content']}>
                <h4>Class & Background Proficiencies</h4>
                <div className={styles['proficiency-groups']}>
                  {([
                    ['Armor', proficienciesSummary.armor],
                    ['Weapons', proficienciesSummary.weapons],
                    ['Tools', proficienciesSummary.tools],
                    ['Languages', proficienciesSummary.languages],
                  ] as const).map(([label, values]) => (
                    <div className={styles['proficiency-group']} key={label}>
                      <h5>{label}</h5>
                      <p>{values.length ? values.join(', ') : 'None listed'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={[styles['character-section'], styles['notes']].filter(Boolean).join(' ')}>
            <div className={styles['section-header']}>
              <h3 className={styles['section-title']}>Notes</h3>
            </div>
            <div className={[styles['notes-save-state'], notesSaveState !== 'idle' ? styles[notesSaveState] : ''].filter(Boolean).join(' ')}> 
              {notesSaveState === 'saving' && 'Saving notes...'}
              {notesSaveState === 'saved' && 'Notes saved'}
              {notesSaveState === 'error' && 'Could not save notes'}
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => {
                setNotesDraft(e.target.value);
              }}
              className={styles['notes-textarea']}
              placeholder="Add character notes here..."
            />
          </div>
        </div>
      </div>

      {selectedFeature && (
        <div
          className={styles['feature-modal-overlay']}
          onClick={() => setSelectedFeature(null)}
          role="presentation"
        >
          <div
            className={styles['feature-modal']}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles['feature-modal-header']}>
              <h4 id="feature-modal-title">{selectedFeature.name}</h4>
              <button
                type="button"
                className={styles['feature-modal-close']}
                onClick={() => setSelectedFeature(null)}
                aria-label="Close feature details"
              >
                Close
              </button>
            </div>

            <div className={styles['feature-modal-body']}>
              {selectedFeature.description ? (
                <p>{selectedFeature.description}</p>
              ) : (
                <p>No description available for this feature yet.</p>
              )}
              {selectedFeature.source && <small>Source: {selectedFeature.source}</small>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};