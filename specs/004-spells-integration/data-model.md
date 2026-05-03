# Data Model: Spells Integration

**Phase 1 Output**  
**Branch**: `004-spells-integration`  
**Date**: 2026-04-22

---

## Existing Entities (modified)

### `CharacterSpell` (backend/apps/characters/models.py)

**Current fields:**
| Field | Type | Notes |
|-------|------|-------|
| `id` | AutoField PK | |
| `character` | FK → Character | CASCADE |
| `spell` | FK → content.Spell | CASCADE |
| `is_prepared` | BooleanField | default=True |
| `is_always_prepared` | BooleanField | default=False |
| `spell_level` | PositiveIntegerField | level at which cast |
| `notes` | TextField | blank=True |

**New field to add:**
| Field | Type | Notes |
|-------|------|-------|
| `source` | CharField(20) | choices: `class`, `magic_initiate`; default=`'class'` |

**Constraint unchanged**: `unique_together = ['character', 'spell']`

**Migration**: `0004_characterspell_source_spellslotstate`

---

## New Entities

### `SpellSlotState` (backend/apps/characters/models.py)

Tracks spent spell slots per level for a character. One row per character per slot level.

| Field | Type | Notes |
|-------|------|-------|
| `id` | AutoField PK | |
| `character` | FK → Character | CASCADE, related_name=`spell_slot_states` |
| `slot_level` | PositiveIntegerField | 1–9 |
| `total` | PositiveIntegerField | maximum available at this level (from class data) |
| `used` | PositiveIntegerField | how many are currently spent; 0 ≤ used ≤ total |

**Constraints**:
```python
class Meta:
    unique_together = ['character', 'slot_level']
    ordering = ['slot_level']
```

**Validation**: `used` must not exceed `total` (enforced in serializer).

**Lifecycle**:
- Created/updated when character first uses a slot or when a character levels up.
- `used` reset to 0 on long rest (all classes) and on short rest (Warlock pact magic slots only).

---

## Frontend Types (frontend/src/types/index.ts)

### New: `CharacterSpell`
```typescript
export interface CharacterSpell {
  id: string;
  character: string;
  character_name: string;
  spell: string;
  spell_name: string;
  spell_level: number;       // from spell.level (read-only)
  spell_school: string;      // from spell.school (read-only)
  is_prepared: boolean;
  is_always_prepared: boolean;
  source: 'class' | 'magic_initiate';
  notes: string;
}
```

### New: `SpellSlotState`
```typescript
export interface SpellSlotState {
  id: string;
  character: string;
  slot_level: number;       // 1–9
  total: number;
  used: number;
}
```

### New: `SpellcastingProfile` (computed, not stored)
```typescript
export interface SpellcastingProfile {
  ability: string;           // e.g. "Intelligence"
  abilityKey: string;        // e.g. "intelligence"
  modifier: number;          // abilityMod + proficiencyBonus
  saveDC: number;            // 8 + modifier
  attackBonus: number;       // same as modifier
  spellcastingType: 'full' | 'half' | 'third' | 'pact' | 'none';
  maxSpellLevel: number;     // highest accessible slot level
  preparedCount?: number;    // for prepared-spell classes
  preparedMax?: number;      // class formula for prepared spell max
}
```

### Update: `Character` (additions only)
```typescript
// Add to existing Character interface:
character_spells?: CharacterSpell[];
spell_slot_states?: SpellSlotState[];
spells_known?: any[];        // legacy JSONField — keep but do not use going forward
```

---

## State Transitions

### Spell Slot Toggle (individual slot)
```
available → spent:  PATCH /api/character-spell-slots/{id}/  { used: used + 1 }
spent → available:  PATCH /api/character-spell-slots/{id}/  { used: used - 1 }
```

### Long Rest
```
POST /api/characters/{id}/rest/  { type: "long" }
→ backend sets used=0 on ALL SpellSlotState rows for character
→ restores HP to maximum
→ resets death saves, Magic Initiate 1st-level use (future trackers)
```

### Short Rest
```
POST /api/characters/{id}/rest/  { type: "short" }
→ backend sets used=0 on SpellSlotState rows for Warlock (pact magic) only
→ restores HP via hit dice (existing logic unchanged)
```

### Add Spell (class spell)
```
POST /api/character-spells/  { character, spell, source: "class", is_prepared: true, spell_level: N, notes: "" }
→ validation: spell.classes includes character.character_class (enforced when source="class")
→ creates CharacterSpell row
```

### Add Spell (Magic Initiate)
```
POST /api/character-spells/  { character, spell, source: "magic_initiate", is_prepared: true, spell_level: N, notes: "" }
→ validation: class-match check SKIPPED (source="magic_initiate")
→ creates CharacterSpell row
```

### Remove Spell
```
DELETE /api/character-spells/{id}/
→ removes CharacterSpell row
→ frontend re-derives ACTIONS tab attack list (no separate storage)
```

---

## Validation Rules

| Rule | Where Enforced |
|------|---------------|
| `used` ≤ `total` on `SpellSlotState` | `SpellSlotStateSerializer.validate()` |
| Class-match check skipped when `source == 'magic_initiate'` | `CharacterSpellSerializer.validate()` |
| Magic Initiate selection: exactly 2 cantrips (level=0) + 1 spell (level=1) | Frontend `MagicInitiateSpellPicker` component |
| Magic Initiate picker blocked until all 3 slots filled | Frontend progression guard in `SpeciesSelector` and `LevelUpFlow` |
| `slot_level` in range 1–9 | `SpellSlotStateSerializer` field validator |
| Character ownership on create | `CharacterSpellViewSet.perform_create()` (existing) |

---

## Entity Relationships

```
Character ──< CharacterSpell >── content.Spell
     │
     └──< SpellSlotState

content.Spell >── content.CharacterClass (M2M: classes field)
content.CharacterClass ──< CharacterSpell [via character.character_class]
```

---

## Database Migration

**File**: `backend/apps/characters/migrations/0004_characterspell_source_spellslotstate.py`

Operations:
1. `AddField` — `CharacterSpell.source` (CharField, default='class')
2. `CreateModel` — `SpellSlotState` with FK, slot_level, total, used fields and unique_together constraint
