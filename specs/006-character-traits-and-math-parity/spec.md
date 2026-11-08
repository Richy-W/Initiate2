# Feature Specification: Character Traits and Math Parity

**Feature Branch**: `006-character-traits-and-math-parity`  
**Created**: 2026-08-24  
**Status**: Draft  
**Input**: User description: "Explore character creation and make sure all species and class traits/features are functional and appear on the character page, adjusting math where applicable, including species/class granted spells and attacks, natural weapons/armor, and trait use counters."

## Clarifications

### Session 2026-08-24

- Q: Should limited-use counters cover all class resources or only selected traits? → A: Track each class resource as intended by the rules (for example, Bardic Inspiration, Channel Divinity, Disciple/Ki points, Sorcery points, Lay on Hands pool, Wild Shape uses, and equivalent feature resources).
- Q: Should lineage-granted spells be manually added or automatically granted? → A: Automatically grant lineage spells from species/variant progression.
- Q: Should non-casters with only lineage spells get a Spells tab? → A: Yes; they should see lineage spells and their free-cast tracking only.
- Q: How should once-per-day or lineage free-cast resets be handled in this system? → A: Reset on Long Rest for this implementation.
- Q: How should natural armor precedence be handled? → A: Follow rules as written for legal stacking/precedence, with DM override support.
- Q: If a player with natural armor equips armor, what happens? → A: Equipped worn armor negates natural armor calculations; use the worn armor formula instead (plus other legal modifiers such as shield), unless an explicit DM override is applied.
- Q: How should Dragonborn Breath Weapon uses scale? → A: Follow rules as written; maximum uses scale with Proficiency Bonus.
- Q: Should subclass implementation be included in class fixes? → A: Yes. Current data has one subclass per class, but implementation must be modular so additional subclasses can be added later without rewriting core systems.
- Q: How should subclass selection rules be enforced? → A: Follow rules as written per class: subclass selection is only available at the class-configured subclass level, invalid/cross-class subclass values are rejected, and subclass features unlock only at their defined levels.
- Q: How should subclass selection be persisted for future content updates? → A: Persist subclass identity plus version metadata (option 2): subclass identifier with class/subclass content version markers so existing characters remain pinned to their selected rules version until explicitly migrated.
- Q: After subclass selection, should players be allowed to change subclass? → A: Yes. Players may change subclass in the UI with warnings; when a subclass change is saved, emit a DM-facing notification/audit event.
- Q: If a character is at/above subclass level with no subclass selected, should progression be blocked? → A: No hard block. Show warnings and allow play/progression; when a subclass is selected or changed and saved, apply all subclass features/counters/spells/attacks/defenses that should already be active at the character's current level.
- Q: When should subclass features unlock after level changes? → A: Hybrid. Deterministic subclass effects should apply immediately on authoritative backend level state changes, while choice-dependent/interactive grants complete through the explicit level-up confirmation flow.
- Q: What should be the source of truth for class/subclass resource counters? → A: Hybrid. Persist current-use state per resource key in DB, and compute max uses dynamically from canonical rules/content data (including level/PB scaling).
- Q: Should class resource reset cadence be normalized for v1 or follow rules per feature? → A: Follow rules as written per feature (strict short-rest vs long-rest behavior as defined), while keeping prior scope decision that once-per-day and lineage free-cast counters reset on Long Rest.
- Q: How should pooled resources (for example Lay on Hands or Sorcery Points) be adjusted in the UI? → A: Provide both quick increment/decrement controls and a numeric spend input so players can make fast common adjustments and exact larger spends.
- Q: When should lineage spell progression grants be applied at unlock levels? → A: Both. Apply grants during authoritative level-up transactions and run an idempotent load-time backfill check to heal legacy or missed states without duplicate grants.
- Q: How should lineage free casts be consumed in UI? → A: Use explicit controls in the Spells tab so players intentionally choose free-cast usage rather than automatic consumption.
- Q: If subclass content is malformed or missing required mechanics fields, should selection still be allowed? → A: No. Use hard-fail validation and block selection until content is corrected.
- Q: What DM override granularity is required for this scope? → A: Support per-character overrides plus per-feature/resource overrides (no campaign-wide defaults required in this story).
- Q: How should existing pre-migration characters be handled when subclass persistence/version fields are introduced? → A: Run inference-based migration: infer subclass from existing class/feature evidence where confidence is sufficient; otherwise leave subclass null and surface a warning for manual selection.

## Discovery Findings

1. Character-page math currently mixes backend totals and frontend recomputation, creating drift risk for spellcasting stats, AC, and feature-derived modifiers.
2. Class feature access patterns are inconsistent across components (`features_by_level` vs `classFeatures` vs `features`), causing level-up and combat feature behavior gaps.
3. Weapon attack proficiency calculations on the character page rely on a class field path that may not exist in detail payloads, which can undercount attack bonuses.
4. Species and origin-feature selections are partially persisted as metadata-like feature entries; some choices are displayed but not always translated into mechanical effects.
5. Trait aggregation on the character page is broad, but filtering and source labeling can hide or misclassify species/class/feat details.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Character Creation Applies Species/Class Choices Correctly (Priority: P1)

A player creates a character and selects species options, class options, skills, and origin-feat choices. After creation, all selected options are persisted in the character model and reflected as mechanical effects and visible features on the character page.

**Why this priority**: If creation persistence and mechanical translation are wrong, all downstream sheet calculations and displays become unreliable.

**Independent Test**: Create one character each for a species with variant/choice traits and a class with level-1 feature choices; verify persisted payload and detail API output include expected skills, tools, traits, and computed stats.

**Acceptance Scenarios**:

1. **Given** a species with selectable options (variant/skill/size/feat), **When** the character is created, **Then** selected options are persisted and represented on the character detail payload.
2. **Given** selected options that grant proficiency changes, **When** character creation completes, **Then** skill/tool proficiencies are applied without duplication.
3. **Given** origin feat selections (including Magic Initiate and Skilled), **When** creation completes, **Then** feature entries and mechanical outputs are aligned with the selection.
4. **Given** a species variant/lineage with spell progression, **When** character creation completes, **Then** lineage spells are auto-granted at eligible character levels with correct source attribution and free-cast metadata.

---

### User Story 2 - Character Page Shows Complete Traits and Features by Source (Priority: P1)

A player opens the character page and can view all applicable class, species, background, and feat features for the current level with clear source labeling.

**Why this priority**: Missing or misclassified features make the sheet untrustworthy during play.

**Independent Test**: Open a character with class features from multiple levels, species traits, and origin feats; verify feature list completeness and source categorization.

**Acceptance Scenarios**:

1. **Given** a character with class features through current level, **When** the feature panel loads, **Then** all unlocked class features appear once with descriptions.
2. **Given** a character with species traits and origin feats, **When** the feature panel loads, **Then** they appear with correct source labels and are not filtered out incorrectly.
3. **Given** a feature is present from multiple payload paths, **When** merged on the frontend, **Then** it is deduplicated while keeping the richest description.

---

### User Story 3 - Derived Math Is Consistent Across Sheet Panels (Priority: P1)

A player uses the character page (stats, saving throws, attacks, spells) and sees consistent values for ability totals, modifiers, spellcasting profile, AC, HP, and attack bonuses.

**Why this priority**: Mechanical inconsistencies directly impact gameplay outcomes.

**Independent Test**: Compare displayed values against deterministic rule calculations for representative builds (martial, spellcaster, monk/barbarian, species with scaling HP trait).

**Acceptance Scenarios**:

1. **Given** any character, **When** ability totals are shown, **Then** every panel uses a single canonical total set.
2. **Given** a spellcasting character, **When** spell save DC and spell attack bonus are rendered, **Then** they are based on effective ability totals and proficiency bonus.
3. **Given** weapon attacks, **When** attack bonus is computed, **Then** proficiency detection uses normalized class proficiency data from the detail payload.
4. **Given** monk or barbarian with no armor equipped, **When** AC is displayed, **Then** unarmored defense math is applied consistently.
5. **Given** HP-scaling traits/feats (e.g., Tough, species scaling), **When** level changes or sheet loads, **Then** max HP math reflects all active bonuses exactly once.
6. **Given** species natural armor traits, **When** no worn armor is equipped, **Then** natural armor formulas are evaluated and applied according to rules.
7. **Given** a character with natural armor equips worn armor, **When** AC is displayed, **Then** worn armor negates natural armor and AC is computed from worn armor rules.
8. **Given** species or class natural weapon traits, **When** attack and damage rows are displayed, **Then** those attacks appear with correct attack ability, proficiency behavior, damage dice, and damage type.
9. **Given** species or class granted spells (for example, elf lineage spells or dragonborn lineage effects), **When** the character opens Spells and Combat panels, **Then** those granted entries appear with correct source attribution and usable mechanics.
10. **Given** a non-caster with lineage-only spells, **When** they open the character page, **Then** the Spells tab is visible and contains lineage spells and free-cast tracking only.

---

### User Story 4 - Trait Counters and Recharge Rules Are Trackable (Priority: P1)

A player uses limited-use features (for example once per long rest, proficiency bonus per long rest, or once per day) and can track available uses directly on the character page with automatic reset behavior on rest actions.

**Why this priority**: Limited-use tracking is required to make many species and class traits playable without manual bookkeeping.

**Independent Test**: Use a fixture character with multiple limited-use traits and verify counters decrement on use, block at zero, and reset correctly on short or long rest based on each trait rule.

**Acceptance Scenarios**:

1. **Given** a feature with fixed uses per rest/day, **When** the character page loads, **Then** a counter is shown with current and maximum uses.
2. **Given** a feature with a proficiency-based use formula, **When** proficiency bonus changes with level, **Then** maximum uses update automatically.
3. **Given** a once-per-day feature, **When** it is used, **Then** its counter decrements and cannot go below zero.
4. **Given** short-rest and long-rest feature counters, **When** a short or long rest is taken, **Then** only eligible counters reset according to the feature recharge rule.
5. **Given** spell-like species/class features with independent use limits, **When** they are consumed, **Then** they do not incorrectly consume normal spell slots unless explicitly defined by the rule.
6. **Given** Dragonborn Breath Weapon, **When** the character's Proficiency Bonus increases, **Then** maximum Breath Weapon uses increase accordingly and current-use state remains valid.

---

### User Story 5 - Regression Coverage for Creation-to-Sheet Pipeline (Priority: P2)

A developer runs automated tests to confirm trait persistence, feature rendering normalization, and derived math behavior remain stable.

**Why this priority**: This story protects against future regressions in a cross-layer flow.

**Independent Test**: Run backend unit tests and frontend unit tests that validate canonical calculations and feature-source normalization.

**Acceptance Scenarios**:

1. **Given** backend character creation tests, **When** species/class option fixtures are processed, **Then** persisted fields and computed mechanics match expected snapshots.
2. **Given** frontend utility/component tests, **When** mixed payload shapes are provided, **Then** normalized feature and math outputs are deterministic.

---

### User Story 6 - Modular Subclass Framework with Baseline Coverage (Priority: P1)

A player can select and use available subclasses for each class, and the subclass system is modular so newly added subclasses automatically fit the same selection, persistence, feature, counter, and math pipelines.

**Why this priority**: Class fixes are incomplete without subclass paths, and future subclass growth will be fragile unless the framework is data-driven and reusable.

**Independent Test**: For each current class, create or level a character into subclass eligibility, choose the currently available subclass, and verify subclass identity plus granted features appear and function on the character page. Then add a new synthetic subclass fixture to content data and verify no core code changes are required for it to appear and function through existing pipelines.

**Acceptance Scenarios**:

1. **Given** each currently supported class, **When** subclass selection level is reached, **Then** currently defined subclass options are selectable from class content data.
2. **Given** a character below subclass selection level, **When** creation or level-up is processed, **Then** subclass selection is not available early.
3. **Given** a class reaches subclass selection level, **When** no subclass is selected, **Then** the character remains playable with a visible warning state and subclass-gated mechanics are withheld until a valid subclass is saved.
4. **Given** an invalid or cross-class subclass value, **When** a save is attempted, **Then** validation rejects the selection.
5. **Given** a selected subclass, **When** subclass feature levels are reached, **Then** those features are added to the active feature set with correct source and level metadata.
6. **Given** subclass-granted attacks, spells, defenses, or resources, **When** character panels are opened, **Then** those mechanics appear in Combat/Spells/Stats and are computed by the same canonical math and counter systems.
7. **Given** a new subclass definition is added to class content data, **When** the app loads class and character flows, **Then** the subclass can be selected and resolved by existing pipelines without bespoke per-subclass code paths.
8. **Given** class fixes are delivered, **When** regression tests run, **Then** there is at least one passing subclass fixture per class plus a generic extensibility fixture validating future additions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Character creation must persist species/class/background option selections in a canonical structure that can be interpreted consistently by backend and frontend.
- **FR-002**: Character creation must translate mechanical options (skills, tools, feature-granted bonuses) into character state without duplicate stacking.
- **FR-002a**: Species lineage/legacy spell progressions must be auto-granted to the character at qualifying levels without manual add flow.
- **FR-002b**: Lineage spell auto-grants must run at level-up and via idempotent character-load backfill checks; duplicate grants are prohibited.
- **FR-003**: Character detail responses must expose class features by level and active feature set in a stable, documented shape used by all consumers.
- **FR-004**: Character page feature rendering must merge class/species/background/feat features into one deduplicated collection with source attribution.
- **FR-005**: Feature filtering on the character page must not hide valid species/class/feat features because of source-name heuristics.
- **FR-006**: All derived sheet calculations (ability modifiers, saves, attacks, spell profile, AC, HP adjustments) must be computed from a single canonical effective ability total model.
- **FR-007**: Spellcasting profile calculations must use effective ability totals rather than base raw ability scores.
- **FR-008**: Weapon attack calculations must use normalized weapon proficiency data from class detail payloads and support simple/martial category matching.
- **FR-009**: Monk/Barbarian unarmored defense calculations must remain consistent between displayed AC and attack/skill side effects.
- **FR-010**: Species natural armor formulas must be represented in canonical feature metadata and applied consistently in AC calculations when the character is not wearing armor.
- **FR-010a**: If worn armor is equipped, worn armor AC negates natural armor AC unless a DM override explicitly changes precedence.
- **FR-011**: Species/class natural weapon traits must generate actionable attack rows in Combat with correct hit and damage math.
- **FR-012**: Species/class granted spells and spell-like attacks (including lineage-based grants such as dragonborn and elves) must appear in Spells and Combat views with source attribution and correct use behavior.
- **FR-012a**: Characters with no class spellcasting but with lineage-granted spells must still receive the Spells tab, scoped to granted spells and free-cast usage.
- **FR-013**: HP-scaling trait and feat bonuses must be applied exactly once at creation and level-up and reflected correctly on sheet refresh.
- **FR-014**: Every limited-use trait/feature must expose a counter with current uses, max uses, recharge cadence, and consumption behavior.
- **FR-015**: Counter resets must integrate with existing rest actions; for this feature scope, once-per-day and free-cast counters reset on Long Rest.
- **FR-015b**: Free-cast consumption for lineage-granted spells must be explicit in the Spells UI (no silent auto-consume), with clear current/max free-cast state and validated decrement behavior.
- **FR-015a**: Dragonborn Breath Weapon counters must scale maximum uses with Proficiency Bonus and recompute on level/proficiency changes.
- **FR-016**: Level-up feature discovery must consume the same feature source shape as creation/detail flows.
- **FR-017**: Add regression tests for creation-option persistence, feature normalization, spellcasting math, weapon proficiency bonus, HP scaling, natural weapons/armor, granted spells, and feature counters.
- **FR-018**: Natural armor resolution must expose an auditable precedence decision payload, including selected formula source, suppression reason when worn armor applies, and any applied DM override metadata.
- **FR-018a**: DM override controls in this scope must support both character-level and per-feature/resource-level overrides, with auditable override metadata.
- **FR-019**: Class resource pools (including fixed-use features and point pools) must be tracked with rule-accurate max values and recharge behavior per class feature.
- **FR-019a**: Resource counter state must use a hybrid model: persisted current-use values per resource key plus computed max values derived from canonical rules/content at runtime.
- **FR-019b**: Recharge cadence for class/subclass resources must follow each feature's canonical rule definition (for example short-rest vs long-rest), except where explicitly scoped overrides already exist (such as once-per-day and lineage free-cast Long Rest resets).
- **FR-019c**: Point-pool resource controls must support both quick +/- adjustments and validated numeric spend entry, with server-side guards preventing negative values or overspend beyond current pool.
- **FR-020**: Subclass handling must be data-driven and modular: selection, persistence, feature activation, counters, attacks, spells, and defenses must run through shared generic pipelines rather than hardcoded subclass branches.
- **FR-021**: Subclass selection must be available at each class's configured subclass level and persisted as part of character progression state.
- **FR-021d**: Subclass persistence must include subclass identifier plus version metadata (at minimum class/subclass content version markers) to support stable runtime resolution and targeted migration queries when content versions change.
- **FR-021e**: Subclass changes may be performed in player UI with explicit warning/confirmation, and successful subclass change saves must emit a DM-facing notification or audit event containing character, previous subclass, new subclass, timestamp, and actor.
- **FR-021f**: Characters at or above subclass-selection level may temporarily remain without a subclass with a visible warning state; when a subclass is saved, the system must backfill all subclass mechanics unlocked up to the character's current level.
- **FR-022a**: Subclass unlock timing must use a hybrid model: deterministic grants apply immediately on backend level-state updates, and choice-dependent grants finalize in the explicit level-up workflow.
- **FR-021a**: Subclass selection must be disallowed before the configured subclass level for that class.
- **FR-021b**: At subclass-selection level and above, a valid subclass selection is required to unlock subclass-gated mechanics and to complete subclass-dependent level-up confirmation steps.
- **FR-021c**: Subclass selection input must be validated against the selected class's declared subclass set; unknown or cross-class values are invalid.
- **FR-022**: Subclass-derived features must flow through the same normalized feature pipeline and participate in counters, attacks, spell grants, and defenses where applicable.
- **FR-023**: Current baseline content (one subclass per class) must work end-to-end for each class.
- **FR-024**: Adding a new subclass to content data must not require new core subclass-specific code in character creation, level-up, sheet rendering, or resource tracking layers.
- **FR-024a**: Subclass definitions must pass required-schema/mechanics validation before they are selectable; malformed or incomplete subclass content must hard-fail selection and return actionable validation errors.
- **FR-025**: Add class-by-class subclass regression fixtures plus an extensibility fixture that simulates onboarding of additional subclasses.
- **FR-026**: Legacy-character migration must attempt deterministic subclass inference from existing class/feature state, persist inferred subclass plus version metadata when confident, and otherwise leave subclass unset with explicit warning/selection prompts.

### Key Entities

- **CharacterBuildOptions**: Canonical persisted representation of player selections during creation (species options, class options, feat selections, equipment options).
- **CharacterFeatureViewModel**: Normalized feature object on the frontend containing `name`, `description`, `source`, and uniqueness key.
- **DerivedStatSnapshot**: Canonical computed stat bundle used across panels (ability totals/modifiers, proficiency, AC, HP, spell profile, attack modifiers).
- **FeatureUsageState**: Persisted or computable state for limited-use traits containing max uses, current uses, recharge rule, and reset behavior.
- **NaturalAttackProfile**: Normalized attack descriptor for species/class natural attacks, including to-hit ability, proficiency policy, damage dice, and damage type.
- **NaturalArmorProfile**: Canonical AC rule descriptor for species/class armor calculations, including formula, conditions, and precedence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For reference fixtures, displayed feature counts on the character page exactly match expected unlocked feature counts by source.
- **SC-002**: For reference spellcaster fixtures, spell attack bonus and save DC values match rules calculations in 100% of tested cases.
- **SC-003**: For reference martial fixtures, weapon attack bonus calculations match expected proficiency + ability math in 100% of tested cases.
- **SC-004**: For HP-scaling fixtures, max HP remains stable across refresh and level-up transitions with no double-application of feat/trait bonuses.
- **SC-005**: For fixtures with natural armor, displayed AC matches rules calculations in 100% of tested cases.
- **SC-006**: For fixtures with natural weapons and lineage/class granted attacks, Combat panel rows and roll outputs match expected attack and damage formulas in 100% of tested cases.
- **SC-007**: For fixtures with limited-use traits, counters decrement and reset correctly for all supported recharge cadences with 0 known counter desync defects.
- **SC-008**: New tests introduced by this feature pass in CI and fail if canonical shapes/math regress.
- **SC-009**: For lineage-only non-caster fixtures, the Spells tab is visible and contains only granted lineage spells with accurate free-cast counters.
- **SC-010**: For Dragonborn fixtures across level bands, Breath Weapon max uses always match current Proficiency Bonus and reset correctly on Long Rest.
- **SC-011**: For each currently supported base class, the currently available subclass path passes creation/level-up, feature rendering, and mechanic validation tests.
- **SC-011a**: Subclass rule-gating tests pass for timing and validation (no early selection, required choice at the configured level, and rejection of invalid/cross-class values).
- **SC-012**: A newly added subclass fixture can be onboarded via content data alone and passes generic subclass pipeline tests without adding new subclass-specific core logic.

## Assumptions

- Existing species/class/background content files remain the source of truth for trait and feature metadata when DB rows are incomplete.
- No multiclass implementation is required in this story unless already partially supported by existing character schema.
- This story focuses on consistency and parity, not a full redesign of the character UI.
