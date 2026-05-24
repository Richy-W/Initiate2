# Research: Spells Integration

**Phase 0 Output** — all NEEDS CLARIFICATION items resolved  
**Branch**: `004-spells-integration`  
**Date**: 2026-04-22

---

## 1. Spell Slot State Storage

**Decision**: Add a new `SpellSlotState` model to `backend/apps/characters/`.  
**Rationale**: The `Character` model has no mechanism to persist spent spell slots. A separate model (one row per character per slot level) follows the same pattern as `CharacterSpell` — a lightweight join-style record owned by the `characters` app. A JSONField on `Character` was considered but rejected because it makes querying and partial updates awkward and doesn't communicate intent clearly.  
**Alternatives considered**:
- JSONField on `Character.spell_slot_state` — rejected: opaque blob, hard to update individual levels atomically via REST, no field-level validation.
- Separate `SpellSlotUsage` event log — rejected: unnecessary complexity for a simple tracker.

**Schema**: `SpellSlotState(character FK, slot_level IntegerField 1–9, total IntegerField, used IntegerField)`  
`unique_together = ['character', 'slot_level']`  
The `total` column is computed from class data at rest-time and stored for quick rendering without re-reading class JSON on every page load. It is recomputed when the character levels up.

---

## 2. `CharacterSpell.source` Field

**Decision**: Add `source = CharField(max_length=20, choices=[('class', 'Class'), ('magic_initiate', 'Magic Initiate')], default='class')` to `CharacterSpell`.  
**Rationale**: Magic Initiate grants spells from a *different* class than the character's own. Without a `source` field, the serializer's class-match validation would block these spells and there would be no way to identify which tracking rules apply (e.g., the 1st-level MI spell is a per-long-rest use, not a slot spend).  
**Alternatives considered**:
- A separate `MagicInitiateSpell` model — rejected: redundant; `CharacterSpell` already covers the relationship; a `source` discriminator is sufficient.

---

## 3. `CharacterSpellSerializer` Validation

**Decision**: Condition the class-match validation on `source != 'magic_initiate'`. When `source == 'magic_initiate'`, skip the class check entirely.  
**Rationale**: Magic Initiate spells by definition come from a class the character does not have. The current `validate()` method raises `ValidationError` for any spell not on the character's own class list.  
**Change**: In `CharacterSpellSerializer.validate()`, add `if data.get('source', 'class') == 'magic_initiate': return data` before the class-membership check.

---

## 4. Spell Slot Restoration via Rest

**Decision**: Extend `CharacterViewSet.rest()` to update `SpellSlotState` rows after HP restoration.  
- **Long rest**: set `used = 0` for ALL `SpellSlotState` rows on the character (restores all standard slots and all Warlock pact slots).
- **Short rest**: set `used = 0` only for Warlock Pact Magic slots (detected by reading the class's `spellcasting.type == "pact"` from the class JSON file).  
**Rationale**: The spec requires that rest buttons in the character management area reset spell slots along with HP. The existing `rest` action is the correct extension point — keeping all rest logic in one place avoids a second round-trip from the frontend.  
**Warlock detection**: The backend already has access to class JSON via `apps/content/` class records. The simplest approach is to store a `spellcasting_type` field on `CharacterClass` (populated from JSON during import) or to read `character.character_class.slug` and look up the JSON at rest time. To avoid adding a backend migration just for this flag, the initial implementation will use a hardcoded `PACT_MAGIC_CLASSES = {'warlock'}` set in `views.py` with a `# TODO: derive from class data` comment per the constitution's Intellectual Honesty principle.

---

## 5. Spellcasting Profile (Computed, Not Stored)

**Decision**: Compute the spellcasting profile (ability key, modifier, save DC, attack bonus) on the frontend from existing character data + class JSON. Do not store it.  
**Rationale**: All inputs are already available on the frontend — ability scores (from `Character`), proficiency bonus (from `Character.proficiency_bonus`), and spellcasting ability key (from class JSON via `/api/content/classes/{slug}.json`). Storing derived values would create a sync problem when ability scores change.  
**Formula**:
- `spellModifier = abilityModifier + character.proficiency_bonus`
- `spellSaveDC = 8 + spellModifier`
- `spellAttackBonus = spellModifier` (same value, different display context)

---

## 6. Warlock Pact Magic Display

**Decision**: Detect `spellcasting.type === "pact"` from the class JSON loaded for the character. Display Warlock slots differently — a single row of same-level slots rather than the standard multi-level grid.  
**Data source**: Class JSON already loaded via `content.api.spells` / content endpoints. The `spellSlots[charLevel][slotLevel]` structure works the same way; for Warlock at level 5, all slots are level 3 (`{"3": 2}`).  
**Short rest recovery**: The frontend must show a "Short Rest restores Pact Magic" note alongside the Warlock slot row. The backend `rest` endpoint handles actual restoration (see item 4 above).

---

## 7. Magic Initiate Spell Picker (Frontend)

**Decision**: Replace the existing free-text inputs in `SpeciesSelector.tsx` with a proper spell picker that queries `/api/content/spells/?classes__name={className}&level__in=0,1` and allows the user to select from real spell data.  
**Rationale**: The current implementation stores cantrip/spell names as raw strings with no validation against the spell database. When the character is saved, these strings are not connected to `CharacterSpell` records at all — they are dead data. The proper implementation must:
1. Show a filterable list of actual `Spell` objects from the content API.
2. On creation wizard completion, translate the selections into `CharacterSpell` POST calls (source = `magic_initiate`).  
**Scope boundary**: The level-up flow equivalent is `frontend/src/components/Character/LevelUp.tsx` (or equivalent) — the same `MagicInitiateSpellPicker` sub-component will be reused there.

---

## 8. Print Second Page

**Decision**: Add a `.spell-print-page` CSS class to `App.css` under `@media print` that forces a page break before it and renders a two-column spell sheet matching the D&D 5e 2024 format.  
**Rationale**: The existing print styles in `App.css` already handle the first page with `@media print` zoom and layout rules. A second `<div class="spell-print-page">` rendered conditionally (only when character has spells) will naturally appear after page 1 in print output. `page-break-before: always` on `.spell-print-page` ensures it starts on page 2.  
**Conditional rendering**: If `character.character_spells.length === 0` AND `!hasMagicInitiate`, the `SpellPrintPage` component is not rendered at all, satisfying FR-016.

---

## 9. Attack Cantrip / Spell Sync to ACTIONS Tab

**Decision**: The ACTIONS tab derives its attack rows from two sources: (a) equipped weapon data, and (b) character spells where `spell.damage` is non-empty. The SPELLS tab and ACTIONS tab read from the same `character.character_spells` array — there is no separate storage. On the ACTIONS tab, a `getSpellAttacks(character)` utility function filters `character_spells` for spells with damage and maps them to `AttackRow` shape.  
**Rationale**: Single source of truth. No sync problem. Both tabs re-render from the same array whenever it changes.

---

## 10. Content API — Spells Endpoint

**Decision**: Use the existing `/api/content/spells/` endpoint (already in `apiClient.ts`). Add query param support for `classes__name` (to filter by class spell list) and `level__lte` (to filter by accessible level) if not already present. Verify `ContentViewSet` supports these filters.  
**Alternatives considered**: A dedicated character-spell-browser endpoint — rejected because the content endpoint with query params is sufficient and avoids adding a new URL route.

---

## Summary of Required Changes

| Area | Change | Risk |
|------|--------|------|
| `characters/models.py` | Add `SpellSlotState` model | Low — new model, no existing data |
| `characters/models.py` | Add `source` field to `CharacterSpell` | Low — additive, default='class' preserves existing rows |
| `characters/serializers.py` | Relax class-match validation for MI source | Low — targeted condition change |
| `characters/serializers.py` | Add `source` to `CharacterSpellSerializer.fields` | Trivial |
| `characters/views.py` | Extend `rest` action for slot restoration | Medium — touches existing logic |
| `characters/migrations/` | New migration for both model changes | Low |
| `frontend/src/types/index.ts` | Add `character_spells`, `spell_slot_state` to `Character` type | Low |
| `frontend/src/services/apiClient.ts` | Add `characterSpells` CRUD and `spellSlots` update methods | Low |
| `frontend/src/components/Character/CharacterSheet.tsx` | Add `spells` tab to tab nav | Low |
| `frontend/src/components/Character/SpellsTab.tsx` | New component | Medium |
| `frontend/src/components/Character/SpellBrowser.tsx` | New component | Medium |
| `frontend/src/components/Character/SpellSlotTracker.tsx` | New component | Low |
| `frontend/src/components/Character/SpellcastingStatBlock.tsx` | New component | Low |
| `frontend/src/components/Character/SpellPrintPage.tsx` | New component | Low |
| `frontend/src/components/CharacterCreation/SpeciesSelector.tsx` | Replace MI text inputs with real spell picker | Medium |
| `frontend/src/App.css` | Add `@media print` second page rules | Low |
