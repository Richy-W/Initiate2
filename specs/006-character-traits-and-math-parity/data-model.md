# Data Model: Character Traits and Math Parity

## Entity: CharacterSubclassState
- Purpose: Persist selected subclass and rules-version metadata.
- Fields:
  - character_id (FK -> Character, unique for single-class scope)
  - class_slug (string, normalized class identifier)
  - subclass_slug (string, nullable)
  - class_content_version (string)
  - subclass_content_version (string)
  - selected_at (datetime, nullable)
  - selected_by_user_id (FK -> User, nullable)
  - warning_state (boolean; true when level requires subclass but none selected)
- Validation:
  - subclass_slug must belong to class_slug declared subclass set.
  - subclass selection disallowed before class-configured subclass level.
  - malformed subclass definition cannot be selected.
- State transitions:
  - Unset -> Selected (on save)
  - Selected -> Selected (change allowed with warning + audit)
  - Any -> WarningState (if rules require subclass and none is present)

## Entity: FeatureUsageState
- Purpose: Track current usage for limited-use features/resources.
- Fields:
  - character_id (FK -> Character)
  - feature_key (string, stable unique key)
  - source_type (enum: species, class, subclass, feat, lineage_spell)
  - current_uses (integer)
  - recharge_type (enum: short_rest, long_rest, day, custom)
  - last_reset_at (datetime, nullable)
  - override_payload (json, nullable)
- Derived values (not persisted as authority):
  - max_uses computed from canonical rules/content + level/PB/ability context
- Validation:
  - current_uses >= 0
  - current_uses <= computed max_uses unless explicit override exists

## Entity: GrantedSpellState
- Purpose: Represent auto-granted lineage/class/subclass spells and free-cast metadata.
- Fields:
  - character_id (FK -> Character)
  - spell_slug (string)
  - source_type (enum: lineage, class_feature, subclass_feature, feat)
  - source_key (string)
  - unlock_level (integer)
  - grant_version (string)
  - free_cast_max (integer, default 0)
  - free_cast_used (integer, default 0)
  - uses_slots_when_free_cast_empty (boolean)
- Validation:
  - unique(character_id, spell_slug, source_key)
  - free_cast_used between 0 and free_cast_max
  - grants are idempotent on level-up and load-time backfill

## Entity: NaturalAttackProfile
- Purpose: Normalize natural weapon attacks for Combat panel and rolls.
- Fields:
  - character_id (FK -> Character)
  - attack_key (string)
  - name (string)
  - ability (enum: str, dex, con, int, wis, cha)
  - proficiency_policy (enum: proficient, conditional, none)
  - damage_dice (string)
  - damage_type (string)
  - source_key (string)

## Entity: NaturalArmorProfile
- Purpose: Normalize natural armor formulas and precedence.
- Fields:
  - character_id (FK -> Character)
  - armor_key (string)
  - formula (string; for example 13 + DEX)
  - applies_when_wearing_armor (boolean; usually false)
  - shield_allowed (boolean)
  - precedence_rank (integer)
  - source_key (string)
  - dm_override_value (integer, nullable)
- Validation:
  - if worn armor equipped and no explicit override, natural armor is not selected

## Entity: SubclassChangeAuditEvent
- Purpose: Notify and audit subclass changes.
- Fields:
  - character_id (FK -> Character)
  - actor_user_id (FK -> User)
  - previous_subclass_slug (string, nullable)
  - new_subclass_slug (string)
  - changed_at (datetime)
  - reason (string, nullable)
  - notified_dm (boolean)

## Relationships
- Character 1:1 CharacterSubclassState
- Character 1:N FeatureUsageState
- Character 1:N GrantedSpellState
- Character 1:N NaturalAttackProfile
- Character 1:N NaturalArmorProfile
- Character 1:N SubclassChangeAuditEvent

## Notes
- Existing feature JSON fields on Character can be retained during transition, but canonical mechanics should resolve through normalized state + content metadata pipelines.
- Current scope assumes single-class characters; multiclass expansion can generalize CharacterSubclassState uniqueness to (character_id, class_slug).
