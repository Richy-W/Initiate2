# Implementation Plan: Fix Human Origin Feat Dropdown

**Branch**: `003-fix-human-origin-feat-dropdown` | **Date**: 2026-05-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-fix-human-origin-feat-dropdown/spec.md`

## Summary

Replace the incorrectly-rendered text input for Human origin feat selection with a properly styled `<select>` dropdown populated from `feat-index.json`. Show a feat summary below on selection. Enforce required selection before step advancement. Additionally, add UI for two related sub-choices that drive proficiency calculations: a Skillful trait skill pick (required 1-skill dropdown for Human) and a Skilled feat sub-selection (three dropdowns for skills/tools when the player selects the Skilled origin feat). The backend serializer is extended to persist the new choices as skill and tool proficiencies on the created character.

All frontend changes are isolated to `SpeciesSelector.tsx` and `CharacterWizard.tsx`. The backend change is limited to the `selected_species_options` unpacking logic in `CharacterCreateSerializer`.

## Technical Context

**Language/Version**: TypeScript / React 18 (frontend); Python 3.x / Django 4.x (backend)
**Primary Dependencies**: React, Django REST Framework; `contentAPI` client in `frontend/src/services/apiClient.ts`
**Storage**: SQLite (dev) — note: constitution requires PostgreSQL for production; local dev uses SQLite temporarily
**Testing**: Jest + React Testing Library (frontend); Django `TestCase` (backend)
**Target Platform**: Web browser, single-page application
**Project Type**: Web application (SPA + REST API)
**Performance Goals**: No new queries beyond an existing skills API call; static imports for feats and tools
**Constraints**: Must not regress existing species selection for non-Human species; must match existing dropdown visual pattern
**Scale/Scope**: 2 frontend files modified; 1 backend serializer method extended

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Notes |
|---|---|---|
| I — Bounded Module Design | ✅ PASS | All frontend changes stay within `CharacterCreation/` component tree. Backend changes stay within `apps/characters/serializers.py`. No cross-app imports introduced. |
| II — TDD | ✅ PASS (with note) | API contract for the `characters/` create endpoint already tested. New backend logic (unpacking `skillfulChoice`, `skilledSkillChoices`, `skilledToolChoices`) must have unit tests in `apps/characters/tests/` before `/speckit.implement` runs. Frontend component tests are encouraged but not blocking per constitution. |
| III — Technology Stack | ✅ PASS | No new dependencies. Static JSON import and existing API client only. |
| IV — SPA Design | ✅ PASS | Component-based change within existing React SPA. |
| VI — Accuracy | ✅ PASS | Feat list matches `feat-index.json`; skills match DB-seeded list; tools sourced from `tools.json`. |
| VII — Data Consistency | ✅ PASS | `skillfulChoice` stored as skill proficiency row (same mechanism as class skill choices). `skilledToolChoices` stored in `Character.tool_proficiencies` JSON field. |
| CSS Modules | ⚠️ TECH DEBT ACKNOWLEDGED | Existing `SpeciesSelector.tsx` dropdowns use global classes (`form-group`, `species-select`). This is story-001 tech debt already tracked in the constitution. New dropdowns in this feature follow the same existing global pattern for visual consistency. One new block (`__feat-summary`) added to `CharacterWizard.module.css`. Full CSS Modules migration deferred to story 001 clean-up. |

**Gate verdict: PASS — no blocking violations. Tech debt acknowledged and tracked.**

**Post-Phase-1 Re-check**: All design decisions in `data-model.md` comply. No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-human-origin-feat-dropdown/
├── plan.md              # This file
├── research.md          # Phase 0 output (complete)
├── data-model.md        # Phase 1 output (complete)
├── quickstart.md        # Phase 1 output (complete)
├── contracts/
│   └── character-create-species-options.md   # Phase 1 backend contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (affected files)

```text
frontend/
└── src/
    └── components/
        └── CharacterCreation/
            ├── SpeciesSelector.tsx     # PRIMARY CHANGE — replace input with select; add Skilled/Skillful UI
            └── CharacterWizard.tsx     # SECONDARY CHANGE — extend interface + isStepComplete(2) validation

backend/
└── apps/
    └── characters/
        ├── serializers.py              # SECONDARY CHANGE — unpack new species option keys
        └── tests/
            └── test_character_create_species_options.py   # NEW — backend unit tests
```



## Complexity Tracking

No constitution violations that require justification. See Constitution Check table above for CSS Modules tech debt acknowledgement — that is pre-existing story-001 debt, not created by this feature.

---

## Implementation Layers

### Layer 0: Data & Constants

**What**: Establish the data sources used by new UI controls.

**Files changed**: `SpeciesSelector.tsx` (static constants added at file top)

**Details**:
1. Import `feat-index.json` — extract `categories.origin.feats` as `ORIGIN_FEATS: Array<{ name: string; summary: string }>`.
2. Define inline constant `DND_TOOLS: string[]` — the 33 tool names from `api/content/equipment/tools.json` (see research.md RQ-03 for the full list).
3. Skills — loaded from `contentAPI.skills.list()` in the existing `useEffect` or a new parallel effect. Store in `skillList` local state: `{ name: string }[]`.

**No new files needed.**

---

### Layer 1: TypeScript Interface Extensions

**What**: Extend the `SpeciesOptions` interface in both files to carry the new choice fields.

**Files changed**: `SpeciesSelector.tsx` (local interface), `CharacterWizard.tsx` (exported interface + `CharacterData`)

**Changes**:

`SpeciesSelector.tsx` — `SpeciesOptions` interface:
```typescript
// Before
interface SpeciesOptions {
  variant?: string;
  skillChoice?: string;
  spellcastingAbility?: string;
  sizeCategory?: string;
  featChoice?: string;
}

// After
interface SpeciesOptions {
  variant?: string;
  skillChoice?: string;
  spellcastingAbility?: string;
  sizeCategory?: string;
  featChoice?: string;          // origin feat name, e.g. "Skilled"
  skillfulChoice?: string;      // skill from Skillful trait
  skilledSkillChoices?: string[]; // up to 3 skills from Skilled feat
  skilledToolChoices?: string[];  // up to 3 tools from Skilled feat (stored separately)
}
```

`CharacterWizard.tsx` — `CharacterData.selectedSpeciesOptions`:
```typescript
selectedSpeciesOptions?: {
  variant?: string;
  skillChoice?: string;
  spellcastingAbility?: string;
  sizeCategory?: string;
  featChoice?: string;
  skillfulChoice?: string;
  skilledSkillChoices?: string[];
  skilledToolChoices?: string[];
};
```

`CharacterWizard.tsx` — `handleSpeciesOptionsChange` callback type updated to match (already typed as `(options: SpeciesOptions) => void` — implicit via prop drilling, no explicit type annotation to change).

**Reset on species change** — `buildDefaultSpeciesOptions` equivalent inside `handleSpeciesSelect` (`CharacterWizard.tsx` line ~100): clear `skillfulChoice`, `skilledSkillChoices`, `skilledToolChoices` when a new species is selected. This is already done for `featChoice: ''` — extend the same reset.

---

### Layer 2: SpeciesSelector UI — Origin Feat Dropdown (US1 + US2)

**What**: Replace the `<input type="text">` with a `<select>` for origin feats.

**File**: `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`

**Exact change** — inside `{offersFeatChoice && (...)}` block (currently lines 371–386):

```tsx
{offersFeatChoice && (
  <div className="form-group">
    <label htmlFor="species-feat-choice">Origin Feat</label>
    <select
      id="species-feat-choice"
      className="species-select"
      value={speciesOptions?.featChoice || ''}
      onChange={(e) =>
        onSpeciesOptionsChange({
          ...speciesOptions,
          featChoice: e.target.value,
          // Reset skilled sub-choices when feat selection changes
          skilledSkillChoices: [],
          skilledToolChoices: [],
        })
      }
    >
      <option value="">— Select an origin feat —</option>
      {ORIGIN_FEATS.map((feat) => (
        <option key={feat.name} value={feat.name}>
          {feat.name}
        </option>
      ))}
    </select>

    {speciesOptions?.featChoice && (
      <div
        className={styles['variant-info-panel']}
        aria-live="polite"
        aria-atomic="true"
      >
        <p className={styles['variant-info-panel__desc']}>
          {ORIGIN_FEATS.find((f) => f.name === speciesOptions.featChoice)?.summary}
        </p>
      </div>
    )}
  </div>
)}
```

**Notes**:
- Placeholder option `value=""` prevents implicit first-item pre-selection, keeping the field "empty" by default (required validation in `CharacterWizard` checks for non-empty string).
- `aria-live="polite"` + `aria-atomic="true"` on the summary `<div>` satisfies FR-010 and SC-005 (screen reader announcement).
- Reuses `variant-info-panel` CSS Module block for visual consistency with variant description panel — no new CSS needed.
- `species-select` class on the `<select>` satisfies US2 (same styling as all other species option dropdowns).

---

### Layer 3: SpeciesSelector UI — Skillful Trait Dropdown (US4)

**What**: When the selected species has a "Skillful" trait, show a required 1-skill dropdown.

**File**: `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`

**New derived boolean** (alongside `offersFeatChoice`):
```typescript
const offersSkillfulChoice = (selectedSpecies?.traits || []).some((trait: any) => {
  return typeof trait?.name === 'string' && trait.name.toLowerCase() === 'skillful';
});
```

**New JSX block** (inside `species-options` div, after the feat block):
```tsx
{offersSkillfulChoice && (
  <div className="form-group">
    <label htmlFor="species-skillful-choice">Skillful: Choose a Skill Proficiency</label>
    <select
      id="species-skillful-choice"
      className="species-select"
      value={speciesOptions?.skillfulChoice || ''}
      onChange={(e) =>
        onSpeciesOptionsChange({
          ...speciesOptions,
          skillfulChoice: e.target.value,
          // Reset Skilled choices when Skillful pick changes (exclusion logic)
          skilledSkillChoices: [],
          skilledToolChoices: [],
        })
      }
    >
      <option value="">— Select a skill —</option>
      {skillList.map((skill) => (
        <option key={skill.name} value={skill.name}>
          {skill.name}
        </option>
      ))}
    </select>
  </div>
)}
```

**Notes**:
- `skillList` is loaded via `contentAPI.skills.list()` in a `useEffect` alongside the species fetch. On error, fall back to an empty array (Skillful dropdown will not render, which is better than a broken list).
- Resetting `skilledSkillChoices` and `skilledToolChoices` when Skillful pick changes ensures cross-exclusion (Skilled dropdowns refresh against the new Skillful choice).

---

### Layer 4: SpeciesSelector UI — Skilled Feat Sub-Selection (US3)

**What**: When `featChoice === 'Skilled'`, show three individual dropdowns. Each dropdown shows the full combined list of all 18 skills + 33 tools (sorted). Options already selected in any other Skilled dropdown are disabled. The Skillful-chosen skill is disabled in all three dropdowns.

**File**: `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`

**New JSX block** (inside `species-options` div, directly after the feat block):
```tsx
{offersFeatChoice && speciesOptions?.featChoice === 'Skilled' && (
  <div className="form-group">
    <label>Skilled: Choose Three Skill or Tool Proficiencies</label>

    {[0, 1, 2].map((index) => {
      const allSkilledPicks = [
        ...(speciesOptions?.skilledSkillChoices || []),
        ...(speciesOptions?.skilledToolChoices || []),
      ];
      const skillfulPick = speciesOptions?.skillfulChoice || '';
      const combinedOptions = [
        ...skillList.map((s) => s.name),
        ...DND_TOOLS,
      ].sort();

      const currentValue = allSkilledPicks[index] || '';

      return (
        <div key={index} className="form-group">
          <label htmlFor={`species-skilled-choice-${index}`}>
            Pick {index + 1}
          </label>
          <select
            id={`species-skilled-choice-${index}`}
            className="species-select"
            value={currentValue}
            onChange={(e) => {
              const newPicks = [...allSkilledPicks];
              newPicks[index] = e.target.value;
              // Separate skills vs tools
              const newSkillChoices = newPicks.filter((p) =>
                skillList.some((s) => s.name === p)
              );
              const newToolChoices = newPicks.filter((p) =>
                DND_TOOLS.includes(p)
              );
              onSpeciesOptionsChange({
                ...speciesOptions,
                skilledSkillChoices: newSkillChoices,
                skilledToolChoices: newToolChoices,
              });
            }}
          >
            <option value="">— Select a skill or tool —</option>
            {combinedOptions.map((opt) => {
              const isSelf = opt === currentValue;
              const isPickedElsewhere =
                !isSelf && allSkilledPicks.includes(opt);
              const isSkillfulPick = opt === skillfulPick;
              return (
                <option
                  key={opt}
                  value={opt}
                  disabled={isPickedElsewhere || isSkillfulPick}
                >
                  {opt}
                  {isPickedElsewhere ? ' (already chosen)' : ''}
                  {isSkillfulPick ? ' (Skillful)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      );
    })}
  </div>
)}
```

**Notes**:
- `disabled` on `<option>` prevents duplicates and the Skillful conflict without custom filtering logic — browser still shows the item but greys it out, aiding discoverability.
- Separation of `skilledSkillChoices` vs `skilledToolChoices` in state is maintained by checking against `skillList` and `DND_TOOLS` arrays.
- All three picks start empty; validation in `CharacterWizard` checks all three are non-empty before allowing step advancement.

---

### Layer 5: Validation — isStepComplete (US1, US3, US4)

**What**: Extend step-2 completion check to require feat/skillful/skilled picks where applicable.

**File**: `frontend/src/components/CharacterCreation/CharacterWizard.tsx`

**Change** (at `isStepComplete`, case 2):
```typescript
case 2: {
  if (!characterData.species) return false;

  const traits = characterData.species?.traits || [];

  const hasFeatChoice = traits.some((t: any) => {
    const desc = typeof t?.description === 'string' ? t.description.toLowerCase() : '';
    return desc.includes('origin feat of your choice');
  });

  const hasSkillful = traits.some((t: any) =>
    typeof t?.name === 'string' && t.name.toLowerCase() === 'skillful'
  );

  const opts = characterData.selectedSpeciesOptions || {};

  if (hasFeatChoice && !opts.featChoice) return false;

  if (hasSkillful && !opts.skillfulChoice) return false;

  if (opts.featChoice === 'Skilled') {
    const skillPicks = opts.skilledSkillChoices || [];
    const toolPicks = opts.skilledToolChoices || [];
    const totalPicks = skillPicks.length + toolPicks.length;
    if (totalPicks < 3) return false;
  }

  return true;
}
```

---

### Layer 6: Backend — Persist New Species Option Keys

**What**: Extend `CharacterCreateSerializer._create_character` to unpack `skillfulChoice`, `skilledSkillChoices`, and `skilledToolChoices` from `selected_species_options`.

**File**: `backend/apps/characters/serializers.py`

**Change** — after line 385 where existing keys are unpacked:
```python
selected_feat = str(selected_species_options.get('featChoice', '') or '').strip()
# NEW
selected_skillful_choice = str(selected_species_options.get('skillfulChoice', '') or '').strip()
selected_skilled_skill_choices = [
    str(s).strip() for s in selected_species_options.get('skilledSkillChoices', []) or []
    if str(s).strip()
]
selected_skilled_tool_choices = [
    str(s).strip() for s in selected_species_options.get('skilledToolChoices', []) or []
    if str(s).strip()
]
```

**Change** — after the existing `if selected_skill_choice and ...` block that adds skill to `selected_skills`:
```python
# Skillful trait — 1 skill proficiency
if selected_skillful_choice and selected_skillful_choice not in selected_skills:
    selected_skills.append(selected_skillful_choice)

# Skilled feat — up to 3 skill proficiencies
for skill_name in selected_skilled_skill_choices:
    if skill_name not in selected_skills:
        selected_skills.append(skill_name)
```

**Change** — after the loop that calls `character.skill_proficiencies.add(skill_obj)`:
```python
# Skilled feat — tool proficiencies
if selected_skilled_tool_choices:
    existing_tools = list(character.tool_proficiencies or [])
    for tool_name in selected_skilled_tool_choices:
        if tool_name not in existing_tools:
            existing_tools.append(tool_name)
    character.tool_proficiencies = existing_tools
    character.save()
```

**Note**: The `character.save()` at the end of the method already persists all fields; the explicit `character.save()` after setting `tool_proficiencies` is only needed if the method exits the skill loop before reaching the existing final save. Review placement carefully during implementation — if the existing save covers it, remove the extra save call.

---

## Test Requirements (Pre-implement Gate)

Per constitution Principle II, the following backend tests must be written and failing before the serializer changes are implemented:

**File**: `backend/apps/characters/tests/test_character_create_species_options.py`

See [contracts/character-create-species-options.md](contracts/character-create-species-options.md) for the full test specification.

**Test cases required**:
1. `test_skillful_choice_added_as_skill_proficiency` — `skillfulChoice: "Acrobatics"` → character has Acrobatics in `skill_proficiencies`.
2. `test_skilled_skill_choices_added_as_skill_proficiencies` — `skilledSkillChoices: ["Arcana", "History", "Perception"]` → all three in `skill_proficiencies`.
3. `test_skilled_tool_choices_added_as_tool_proficiencies` — `skilledToolChoices: ["Smith's Tools"]` → `character.tool_proficiencies` contains "Smith's Tools".
4. `test_skilled_mixed_choices` — 2 skills + 1 tool → both skills in `skill_proficiencies`, tool in `tool_proficiencies`.
5. `test_skillful_excluded_from_skilled_no_backend_enforcement` — backend does not duplicate: if same skill appears in both `skillfulChoice` and `skilledSkillChoices`, it is only added once (deduplication via `not in selected_skills` check).
6. `test_missing_new_keys_no_error` — `selected_species_options` without the new keys (e.g. Elf character) → no crash, existing behaviour unchanged.

---

## Complexity Tracking
