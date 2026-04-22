# Research: Fix Human Origin Feat Dropdown

**Feature**: `003-fix-human-origin-feat-dropdown`
**Phase**: 0 — Outline & Research

---

## Research Questions

The following unknowns were identified from the Technical Context and resolved through codebase exploration.

---

### RQ-01: How should origin feat data be delivered to the dropdown?

**Decision**: Static import of `feat-index.json` from the project root.

**Rationale**: `feat-index.json` already exists at the repo root and contains a structured `categories.origin.feats` array with every origin feat name and a short summary string. The frontend already imports similar data files directly (e.g. species loaded from API, skills from API). However, for origin feats there is no existing `FeatViewSet` registered in `backend/apps/content/urls.py`. Adding an endpoint for a read-only, almost-never-changing 5-item list adds backend plumbing overhead for zero benefit. A direct `import` keeps the bundle predictable, removes the async request, and means no API contract to maintain.

**Alternatives considered**:
- Fetch from a new `/api/v1/content/feats/?type=origin` endpoint — adds backend work, no user benefit, feats rarely change.
- Inline hardcoded array in `SpeciesSelector.tsx` — duplicates data already in `feat-index.json`, would drift.

**Conclusion**: `import originFeatsIndex from '../../../../feat-index.json'` (or relative equivalent). Use `originFeatsIndex.categories.origin.feats` — each entry has `name: string` and `summary: string`.

---

### RQ-02: How should the skill list be sourced for Skilled / Skillful dropdowns?

**Decision**: Fetch from the existing `contentAPI.skills.list()` endpoint.

**Rationale**: The `SkillViewSet` already exists at `backend/apps/content/views.py:284` and is registered in URLs. It returns all 18 D&D 2024 skills with `name` and `ability`. Using the API keeps skill data in one place (the database), consistent with how `BackgroundSelector` and the class selection flow use skills. `SpeciesSelector` already calls `contentAPI.species.list()` in a `useEffect`, so the pattern is established.

**Skills returned** (confirmed in `load_dnd_content.py`): Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival (18 total).

**Alternatives considered**:
- Static constant of 18 skill names — would diverge from DB if custom skills ever added; avoids API call but marginal gain.

**Conclusion**: Load skills once in `SpeciesSelector.tsx` `useEffect`, store in local state. Reuse for both Skillful and Skilled dropdowns.

---

### RQ-03: How should tool proficiencies be sourced for the Skilled feat dropdowns?

**Decision**: Static constant derived from `api/content/equipment/tools.json`.

**Rationale**: There is no `ToolViewSet` or tool API endpoint. The tools JSON file at `api/content/equipment/tools.json` contains 33 tool entries. Tools are content, not user data, and change only with rulebook updates. A static constant is the correct pattern — consistent with how other static reference lists are often handled in the codebase.

**Tool names** (from `api/content/equipment/tools.json`):
Alchemist's Supplies, Brewer's Supplies, Calligrapher's Supplies, Carpenter's Tools, Cartographer's Tools, Cobbler's Tools, Cook's Utensils, Glassblower's Tools, Jeweler's Tools, Leatherworker's Tools, Mason's Tools, Painter's Supplies, Potter's Tools, Smith's Tools, Tinker's Tools, Weaver's Tools, Woodcarver's Tools, Disguise Kit, Forgery Kit, Gaming Set (Dice), Gaming Set (Dragonchess), Gaming Set (Playing Cards), Gaming Set (Three-Dragon Ante), Herbalism Kit, Musical Instrument (Bagpipes), Musical Instrument (Drum), Musical Instrument (Flute), Musical Instrument (Lute), Musical Instrument (Lyre), Musical Instrument (Horn), Musical Instrument (Pan Flute), Musical Instrument (Shawm), Musical Instrument (Viol), Navigator's Tools, Poisoner's Kit, Thieves' Tools.

**Alternatives considered**:
- Fetch tools from backend — no endpoint exists, would require backend changes not in scope.
- Restrict to artisan's tools only — inconsistent with Skilled feat description ("any combination of three skills or tools").

**Conclusion**: Define `DND_TOOLS: string[]` as a static constant in a new file `constants/dndTools.ts` (or inline in `SpeciesSelector.tsx`). Given it is a focused list used in one place, it can live inline in `SpeciesSelector.tsx` to avoid creating a file for a single use.

---

### RQ-04: How does `selected_species_options` flow through the backend serializer?

**Decision**: Extend the existing JSON blob with three new keys: `skillfulChoice`, `skilledSkillChoices`, `skilledToolChoices`. No migration needed.

**Rationale**: `selected_species_options` is already a `JSONField` accepted by `CharacterCreateSerializer` at `backend/apps/characters/serializers.py:124`. The serializer unpacks specific keys (`skillChoice`, `featChoice`, `variant`, `spellcastingAbility`, `sizeCategory`) and ignores others. The field is write-only and not stored directly — it drives proficiency assignment logic during character creation.

**Confirmed flow** (serializer lines 381–485):
1. `selected_skill_choice` (string) → added to `selected_skills` list → creates `CharacterSkillProficiency` rows.
2. `selected_feat` (string) → recorded as a feature entry only (no automatic proficiency assignment from feat yet).
3. New keys needed:
   - `skillfulChoice: string` — 1 skill name → add directly to `selected_skills`.
   - `skilledSkillChoices: string[]` — up to 3 skill names → add each to `selected_skills`.
   - `skilledToolChoices: string[]` — up to 3 tool names → add each to `character.tool_proficiencies` (a `JSONField` list on the `Character` model).

**Character model confirmation**: `Character.tool_proficiencies` exists as `JSONField(default=list)` at `backend/apps/characters/models.py`.

**Alternatives considered**:
- Store all skilled picks as a comma-separated string in the existing `featChoice` value — fragile, non-standard, opaque.

---

### RQ-05: How should step-2 validation enforce required selections?

**Decision**: Extend `isStepComplete(2)` in `CharacterWizard.tsx` to check species options when relevant traits are present.

**Rationale**: `isStepComplete` at line 354 already dispatches by step number. Step 2 (`case 2`) currently returns `characterData.species !== null`. The species object is in `characterData.species` with its `traits` array already loaded (via `contentAPI.species.get()` in `SpeciesSelector`). The same trait-detection logic used in `SpeciesSelector` for `offersFeatChoice` can be applied in `CharacterWizard`.

**Logic required**:
```
case 2:
  if species is null → false
  if species has "origin feat of your choice" trait → featChoice must be non-empty
  if species has "Skillful" trait in name → skillfulChoice must be non-empty
  if featChoice === 'Skilled' → all 3 skilled picks must be non-empty
  else → true
```

**Alternatives considered**:
- Pass a "ready" boolean from `SpeciesSelector` up via callback — couples the component to wizard step logic; current pattern avoids this.

---

### RQ-06: Does the Styled Dropdown need new CSS?

**Decision**: No new CSS classes needed for the dropdown itself. The feat summary panel can reuse `variant-info-panel` styles or get a minimal new block in `CharacterWizard.module.css`.

**Rationale**: All existing species option dropdowns use the plain CSS classes `form-group` and `species-select` (defined in `App.css`). These are not CSS Modules. This is existing technical debt from story 001 that this feature is not responsible for cleaning up (constitution says "migrate to CSS Modules before story 001 is considered complete"). For consistency with the surrounding code, new dropdowns added by this feature should follow the same existing pattern (`form-group` + `species-select`) to avoid visual inconsistency. The `variant-info-panel` CSS Module class (in `CharacterWizard.module.css`) provides a styled info panel pattern already used for variant summaries — the feat summary can use the same block element structure.

**Conclusion**: 
- Feat/Skillful/Skilled dropdowns → `form-group` wrapper + `species-select` class (matching all other options).
- Feat summary `<div>` → new nested `__feat-summary` modifier in `CharacterWizard.module.css` using the same panel visual as `variant-info-panel`.
- No new global CSS rules.

---

## Summary of All Decisions

| Question | Decision |
|---|---|
| Origin feat data source | Static import `feat-index.json` |
| Skill list source | `contentAPI.skills.list()` API call |
| Tool list source | Static constant inline in `SpeciesSelector.tsx` |
| Backend JSON keys | `skillfulChoice`, `skilledSkillChoices`, `skilledToolChoices` |
| Validation approach | Extend `isStepComplete(2)` in `CharacterWizard.tsx` |
| New CSS | Feat summary panel only (`CharacterWizard.module.css`) |
