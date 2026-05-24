# API Contract: Spell Slot State

**Endpoint group**: `/api/character-spell-slots/`  
**Owner app**: `backend/apps/characters/`  
**Auth**: JWT Bearer required on all endpoints (IsAuthenticated — constitution default)

---

## Resource: SpellSlotState

### GET /api/character-spell-slots/

Returns all spell slot state rows for the authenticated user's characters.

**Query params** (optional):
- `character` — filter by character ID

**Response 200**:
```json
[
  {
    "id": "1",
    "character": "42",
    "slot_level": 1,
    "total": 4,
    "used": 2
  },
  {
    "id": "2",
    "character": "42",
    "slot_level": 2,
    "total": 3,
    "used": 0
  }
]
```

---

### POST /api/character-spell-slots/

Create a slot state row (typically done automatically on first slot use, but available for manual setup).

**Request body**:
```json
{
  "character": "42",
  "slot_level": 1,
  "total": 4,
  "used": 0
}
```

**Response 201**: Created `SpellSlotState` object.

**Errors**:
- `400` — `used` > `total`
- `400` — `slot_level` not in 1–9
- `400` — duplicate `(character, slot_level)` pair
- `403` — character does not belong to authenticated user

---

### PATCH /api/character-spell-slots/{id}/

Update `used` count (slot toggle). Only `used` and `total` may be updated; `character` and `slot_level` are immutable after creation.

**Request body** (partial update):
```json
{ "used": 3 }
```

**Response 200**: Updated `SpellSlotState` object.

**Errors**:
- `400` — `used` > `total`
- `404` — slot state not found or belongs to another user

---

### DELETE /api/character-spell-slots/{id}/

Remove a slot state row (e.g., when a character resets or changes class).

**Response 204**: No content.

---

## Resource: CharacterSpell (additions to existing contract)

### POST /api/character-spells/ — updated validation

Existing endpoint; `source` field is now accepted.

**Request body**:
```json
{
  "character": "42",
  "spell": "101",
  "source": "magic_initiate",
  "is_prepared": true,
  "spell_level": 1,
  "notes": ""
}
```

**`source` values**:
- `"class"` (default) — standard class spell; class-match validation applies
- `"magic_initiate"` — Magic Initiate feat spell; class-match validation skipped

**Response 201**: Created `CharacterSpell` object including `source` field.

---

## Resource: Character Rest (additions to existing contract)

### POST /api/characters/{id}/rest/ — updated behaviour

Existing endpoint; now also resets spell slots.

**Request body** (unchanged):
```json
{ "type": "long" }
```
or
```json
{ "type": "short" }
```

**Updated response**:
```json
{
  "message": "Long rest completed",
  "current_hp": 45,
  "max_hp": 45,
  "temp_hp": 0,
  "slots_restored": [1, 2, 3, 4, 5]
}
```

- `slots_restored` — array of slot levels that were reset. Empty array `[]` if no spell slot state rows existed.
- Long rest: all slot levels for the character are reset.
- Short rest: only Warlock pact magic slot levels are reset; for non-Warlock characters, `slots_restored` will be `[]`.

---

## URL Registration

Add to `backend/apps/characters/urls.py`:
```python
router.register('character-spell-slots', SpellSlotStateViewSet, basename='character-spell-slots')
```
