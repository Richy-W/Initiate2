export interface CharacterSubclassState {
  class_slug: string;
  subclass_slug: string | null;
  class_content_version: string;
  subclass_content_version: string;
  warning_state: boolean;
}

export interface DerivedStats {
  ability_totals: Record<string, number>;
  ability_modifiers: Record<string, number>;
  proficiency_bonus: number;
  armor_class: number;
  max_hit_points: number;
}

export interface FeatureUsage {
  feature_key: string;
  source_type: 'species' | 'class' | 'subclass' | 'feat' | 'lineage_spell';
  current_uses: number;
  max_uses: number;
  recharge_type: 'short_rest' | 'long_rest' | 'day' | 'custom';
}

export interface GrantedSpell {
  spell_slug: string;
  source_type: 'lineage' | 'class_feature' | 'subclass_feature' | 'feat';
  unlock_level: number;
  free_cast_max: number;
  free_cast_used: number;
}

export interface NaturalAttackProfile {
  attack_key: string;
  name: string;
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  proficiency_policy: 'proficient' | 'conditional' | 'none';
  damage_dice: string;
  damage_type: string;
  source_key: string;
}

export interface NaturalArmorProfile {
  armor_key: string;
  formula: string;
  applies_when_wearing_armor: boolean;
  shield_allowed: boolean;
  precedence_rank: number;
  source_key: string;
  dm_override_value: number | null;
}

export interface CharacterMechanicsPayload {
  subclass_state: CharacterSubclassState;
  derived_stats: DerivedStats;
  feature_usage: FeatureUsage[];
  granted_spells: GrantedSpell[];
  natural_attacks: NaturalAttackProfile[];
  natural_armor_profiles: NaturalArmorProfile[];
}

export type FeatureSourceCategory =
  | 'class'
  | 'species'
  | 'feat'
  | 'background'
  | 'system'
  | 'unknown';

export interface CharacterFeatureViewModel {
  key: string;
  name: string;
  description?: string;
  source: string;
  sourceCategory: FeatureSourceCategory;
}
