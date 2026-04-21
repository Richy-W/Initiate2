# Data Model: Fix Human Origin Feat Dropdown

**Feature**: `003-fix-human-origin-feat-dropdown`
**Phase**: 1 — Design & Contracts

---

## Overview

This feature requires no new database schema changes. All data lives in existing fields or existing JSON files. The changes are entirely in how data flows through the system: new keys in the `selected_species_options` JSON payload, new TypeScript fields on the `SpeciesOptions` interface, and new proficiency assignment logic in the backend serializer.

---

## TypeScript: Extended `SpeciesOptions` Interface

**Location**: Defined locally in `SpeciesSelector.tsx`; mirrored in `CharacterWizard.tsx` (`CharacterData.selectedSpeciesOptions`)

### Before

```typescript
interface SpeciesOptions {
  variant?: string;
  skillChoice?: string;
  spellcastingAbility?: string;
  sizeCategory?: string;
  featChoice?: string;
}
```

### After

```typescript
interface SpeciesOptions {
  variant?: string;
  skillChoice?: string;          // existing: skill from species proficiencies list
  spellcastingAbility?: string;  // existing: spellcasting ability choice from variant
  sizeCategory?: string;         // existing: size choice when species offers options
  featChoice?: string;           // existing: origin feat name (e.g. "Skilled") — FIXED: now from dropdown
  skillfulChoice?: string;       // NEW: skill chosen via Skillful trait (Human)
  skilledSkillChoices?: string[]; // NEW: skills chosen via Skilled feat (max 3 total with tools)
  skilledToolChoices?: string[];  // NEW: tools chosen via Skilled feat (max 3 total with skills)
}
```

### Validation rules

| Field | Required when | Constraint |
|---|---|---|
| `featChoice` | Species has "origin feat of your choice" trait | Must be non-empty string; must be one of the 5 origin feat names |
| `skillfulChoice` | Species has a trait named "Skillful" | Must be non-empty; must be one of the 18 D&D skills |
| `skilledSkillChoices` | `featChoice === 'Skilled'` | Array.length ∈ {0..3}; each element from skills list; no duplicates within array; no overlap with `skilledToolChoices` |
| `skilledToolChoices` | `featChoice === 'Skilled'` | Array.length ∈ {0..3}; each element from tools constant; no duplicates within array; no overlap with `skilledSkillChoices` |
| `skilledSkillChoices` + `skilledToolChoices` combined | `featChoice === 'Skilled'` | Total count must equal 3 to satisfy `isStepComplete(2)` |
| any `skilledSkillChoices[i]` | `featChoice === 'Skilled'` | Must not equal `skillfulChoice` (enforced via disabled `<option>` in UI; backend does not enforce rejection, only deduplicates) |

---

## `selected_species_options` JSON Payload

**Location**: `CharacterWizard.tsx` → `characterPayload.selected_species_options` → `CharacterCreateSerializer`

### Example payloads

**Human with Skilled feat, 2 skills + 1 tool:**
```json
{
  "variant": "",
  "skillChoice": "",
  "spellcastingAbility": "",
  "sizeCategory": "Medium",
  "featChoice": "Skilled",
  "skillfulChoice": "Perception",
  "skilledSkillChoices": ["Arcana", "Athletics"],
  "skilledToolChoices": ["Smith's Tools"]
}
```

**Human with Alert feat:**
```json
{
  "variant": "",
  "skillChoice": "",
  "spellcastingAbility": "",
  "sizeCategory": "Medium",
  "featChoice": "Alert",
  "skillfulChoice": "Stealth",
  "skilledSkillChoices": [],
  "skilledToolChoices": []
}
```

**Elf (no new keys):**
```json
{
  "variant": "High Elf",
  "skillChoice": "",
  "spellcastingAbility": "Intelligence",
  "sizeCategory": "Medium",
  "featChoice": ""
}
```

---

## Backend: Character Model — No Schema Changes

**`Character` model fields used** (no changes to model or migrations):

| Field | Type | Used by |
|---|---|---|
| `character.skill_proficiencies` | M2M → `Skill` | `skillfulChoice` + `skilledSkillChoices` → `character.skill_proficiencies.add(skill_obj)` |
| `character.tool_proficiencies` | `JSONField(default=list)` | `skilledToolChoices` → appended to list |

**Existing skill assignment flow** (unchanged):
- `selected_skill_choice` (from `skillChoice` key) is added to `selected_skills` list
- At the end of `_create_character`, all items in `selected_skills` are resolved via `Skill.objects.filter(name__iexact=...)` and added via M2M

**New skill assignment** (additions):
- `skillfulChoice` appended to `selected_skills` if non-empty and not already present
- Each item in `skilledSkillChoices` appended to `selected_skills` if not already present
- Deduplication: `if skill_name not in selected_skills` guard prevents double-adding

**New tool assignment** (additions):
- `character.tool_proficiencies` is read, extended with items from `skilledToolChoices`, and saved
- Deduplication: `if tool_name not in existing_tools` guard

---

## Static Data Constants

### Origin Feats (from `feat-index.json`)

```typescript
const ORIGIN_FEATS = [
  { name: "Alert",            summary: "Increase Initiative and immunity to surprise" },
  { name: "Magic Initiate",   summary: "Learn spells from another class's spell list" },
  { name: "Savage Attacker", summary: "Reroll damage dice once per turn" },
  { name: "Skilled",          summary: "Gain proficiency in three skills of your choice" },
  { name: "Tough",            summary: "Gain additional HP" },
];
```

### Tools List (derived from `api/content/equipment/tools.json`)

Stored as `DND_TOOLS: string[]` in `SpeciesSelector.tsx`. All 33 named tools:
Alchemist's Supplies, Brewer's Supplies, Calligrapher's Supplies, Carpenter's Tools, Cartographer's Tools, Cobbler's Tools, Cook's Utensils, Disguise Kit, Forgery Kit, Gaming Set (Dice), Gaming Set (Dragonchess), Gaming Set (Playing Cards), Gaming Set (Three-Dragon Ante), Glassblower's Tools, Herbalism Kit, Jeweler's Tools, Leatherworker's Tools, Mason's Tools, Musical Instrument (Bagpipes), Musical Instrument (Drum), Musical Instrument (Flute), Musical Instrument (Horn), Musical Instrument (Lute), Musical Instrument (Lyre), Musical Instrument (Pan Flute), Musical Instrument (Shawm), Musical Instrument (Viol), Navigator's Tools, Painter's Supplies, Poisoner's Kit, Potter's Tools, Smith's Tools, Thieves' Tools, Tinker's Tools, Weaver's Tools, Woodcarver's Tools.

---

## State Transitions

```
Species selected → buildDefaultSpeciesOptions called
  → featChoice = ''
  → skillfulChoice = ''
  → skilledSkillChoices = []
  → skilledToolChoices = []

User selects origin feat →
  → featChoice = selectedName
  → skilledSkillChoices = []  (reset on feat change)
  → skilledToolChoices = []   (reset on feat change)

User selects Skillful skill →
  → skillfulChoice = selectedSkill
  → skilledSkillChoices = []  (reset — Skillful pick may affect Skilled exclusions)
  → skilledToolChoices = []

User selects Skilled pick [0..2] →
  → re-derive skilledSkillChoices (picks that are in skillList)
  → re-derive skilledToolChoices (picks that are in DND_TOOLS)
  → no reset of other picks (each dropdown independent, only disabling applied)

Form submitted →
  → selected_species_options JSON sent to backend
  → backend separates out skillfulChoice → skill_proficiencies
  → backend separates out skilledSkillChoices → skill_proficiencies
  → backend separates out skilledToolChoices → tool_proficiencies
```
