"""
TDD contract tests for SpellSlotState and CharacterSpell.source field.

WRITE FIRST — these tests MUST fail before T005–T007 are implemented.
Contract source: specs/004-spells-integration/contracts/spell-slots.md

Test groups:
  TC-SS-001  GET /api/character-spell-slots/ — list filtered by character
  TC-SS-002  POST /api/character-spell-slots/ — create valid row
  TC-SS-003  POST validation — used > total rejected
  TC-SS-004  POST validation — slot_level out of range rejected
  TC-SS-005  POST validation — duplicate (character, slot_level) rejected
  TC-SS-006  POST validation — character belongs to another user rejected
  TC-SS-007  PATCH /api/character-spell-slots/{id}/ — update used count
  TC-SS-008  PATCH validation — used > total rejected
  TC-SS-009  DELETE /api/character-spell-slots/{id}/
  TC-CS-001  POST /api/character-spells/ — source field accepted
  TC-CS-002  POST /api/character-spells/ — magic_initiate bypasses class validation
  TC-CS-003  POST /api/character-spells/ — class source still validates class membership
  TC-REST-001 POST /api/characters/{id}/rest/ long — slots_restored in response
  TC-REST-002 POST /api/characters/{id}/rest/ short — slots_restored empty for non-Warlock
  TC-REST-002b POST /api/characters/{id}/rest/ short — slots_restored contains Warlock slots
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.content.models import Species, CharacterClass, Background, Spell
from apps.characters.models import Character, CharacterSpell, SpellSlotState

User = get_user_model()


# ─── Shared helpers ───────────────────────────────────────────────────────────

def _make_species(name='TestSpecies'):
    return Species.objects.create(name=name, description='A test species.')


def _make_class(name='Wizard', hit_die=6, spellcasting=None):
    return CharacterClass.objects.create(
        name=name,
        description=f'A test {name} class.',
        hit_die=hit_die,
        saving_throw_proficiencies=[],
        spellcasting=spellcasting or {'ability': 'intelligence', 'type': 'full'},
    )


def _make_background(name='TestBG'):
    return Background.objects.create(
        name=name,
        description='A test background.',
        feature_name='Test Feature',
        feature_description='Does nothing.',
        origin_feats=[],
    )


def _make_character(user, char_class, name='Testchar', species=None, background=None, **kwargs):
    sp = species or _make_species(name=f'Species-{name}')
    bg = background or _make_background(name=f'BG-{name}')
    defaults = dict(
        user=user,
        name=name,
        species=sp,
        character_class=char_class,
        background=bg,
        level=5,
        strength=10, dexterity=10, constitution=10,
        intelligence=16, wisdom=10, charisma=10,
        max_hit_points=30, current_hit_points=30,
    )
    defaults.update(kwargs)
    return Character.objects.create(**defaults)


def _make_spell(name='Fireball', level=3, school='Evocation', classes=None):
    spell, _ = Spell.objects.get_or_create(
        name=name,
        defaults=dict(
            level=level,
            school=school,
            casting_time='1 action',
            range='150 feet',
            duration='Instantaneous',
            components={'verbal': True, 'somatic': True, 'material': True},
            description='A fiery explosion.',
        ),
    )
    if classes:
        for cls in classes:
            spell.classes.add(cls)
    return spell


# ─── TC-SS: SpellSlotState list / create ─────────────────────────────────────

class SpellSlotStateListCreateTests(TestCase):
    """TC-SS-001 / TC-SS-002 / TC-SS-003 / TC-SS-004 / TC-SS-005 / TC-SS-006"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='slot_user', email='slot_user@test.com', password='pass123'
        )
        cls.other_user = User.objects.create_user(
            username='slot_other', email='slot_other@test.com', password='pass123'
        )
        cls.char_class = _make_class()
        cls.character = _make_character(cls.user, cls.char_class)
        cls.other_character = _make_character(cls.other_user, cls.char_class, name='OtherChar')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.base_url = '/api/v1/character-spell-slots/'

    def tearDown(self):
        SpellSlotState.objects.filter(
            character__in=[self.character, self.other_character]
        ).delete()

    # TC-SS-001
    def test_list_returns_only_own_characters_slots(self):
        SpellSlotState.objects.create(character=self.character, slot_level=1, total=4, used=2)
        SpellSlotState.objects.create(character=self.other_character, slot_level=1, total=2, used=0)

        resp = self.client.get(self.base_url, {'character': self.character.id})

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data)
        ids = [r['character'] for r in results]
        self.assertTrue(all(str(i) == str(self.character.id) for i in ids))

    # TC-SS-002
    def test_create_valid_slot_state(self):
        payload = {'character': self.character.id, 'slot_level': 1, 'total': 4, 'used': 0}
        resp = self.client.post(self.base_url, payload, format='json')

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['slot_level'], 1)
        self.assertEqual(resp.data['total'], 4)
        self.assertEqual(resp.data['used'], 0)

    # TC-SS-003
    def test_create_rejects_used_greater_than_total(self):
        payload = {'character': self.character.id, 'slot_level': 2, 'total': 3, 'used': 5}
        resp = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # TC-SS-004
    def test_create_rejects_slot_level_zero(self):
        payload = {'character': self.character.id, 'slot_level': 0, 'total': 2, 'used': 0}
        resp = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_rejects_slot_level_ten(self):
        payload = {'character': self.character.id, 'slot_level': 10, 'total': 2, 'used': 0}
        resp = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # TC-SS-005
    def test_create_rejects_duplicate_character_slot_level(self):
        SpellSlotState.objects.create(character=self.character, slot_level=3, total=3, used=0)
        payload = {'character': self.character.id, 'slot_level': 3, 'total': 3, 'used': 0}
        resp = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # TC-SS-006
    def test_create_rejects_other_users_character(self):
        payload = {'character': self.other_character.id, 'slot_level': 1, 'total': 2, 'used': 0}
        resp = self.client.post(self.base_url, payload, format='json')
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])


# ─── TC-SS: PATCH / DELETE ────────────────────────────────────────────────────

class SpellSlotStatePatchDeleteTests(TestCase):
    """TC-SS-007 / TC-SS-008 / TC-SS-009"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='slot_patch_user', email='slot_patch@test.com', password='pass123'
        )
        cls.char_class = _make_class(name='Cleric', hit_die=8,
                                     spellcasting={'ability': 'wisdom', 'type': 'full'})
        cls.character = _make_character(cls.user, cls.char_class, name='PatchChar')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.slot = SpellSlotState.objects.create(
            character=self.character, slot_level=1, total=4, used=1
        )
        self.url = f'/api/v1/character-spell-slots/{self.slot.id}/'

    def tearDown(self):
        SpellSlotState.objects.filter(character=self.character).delete()

    # TC-SS-007
    def test_patch_updates_used_count(self):
        resp = self.client.patch(self.url, {'used': 3}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['used'], 3)

    # TC-SS-008
    def test_patch_rejects_used_greater_than_total(self):
        resp = self.client.patch(self.url, {'used': 10}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # TC-SS-009
    def test_delete_removes_slot_state(self):
        resp = self.client.delete(self.url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SpellSlotState.objects.filter(id=self.slot.id).exists())


# ─── TC-CS: CharacterSpell source field ──────────────────────────────────────

class CharacterSpellSourceTests(TestCase):
    """TC-CS-001 / TC-CS-002 / TC-CS-003"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='spell_src_user', email='spell_src@test.com', password='pass123'
        )
        cls.wizard_class = _make_class(name='WizardSrc')
        cls.fighter_class = _make_class(name='FighterSrc', hit_die=10, spellcasting={})

        cls.wizard_char = _make_character(cls.user, cls.wizard_class, name='WizardSrcChar')
        cls.fighter_char = _make_character(cls.user, cls.fighter_class, name='FighterSrcChar')

        cls.wizard_spell = _make_spell(
            name='Magic Missile', level=1, classes=[cls.wizard_class]
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = '/api/v1/character-spells/'
        CharacterSpell.objects.filter(character__in=[self.wizard_char, self.fighter_char]).delete()

    # TC-CS-001
    def test_source_field_accepted(self):
        payload = {
            'character': self.wizard_char.id,
            'spell': self.wizard_spell.id,
            'source': 'class',
            'is_prepared': True,
            'spell_level': 1,
            'notes': '',
        }
        resp = self.client.post(self.url, payload, format='json')

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['source'], 'class')

    # TC-CS-002
    def test_magic_initiate_bypasses_class_validation(self):
        payload = {
            'character': self.fighter_char.id,
            'spell': self.wizard_spell.id,
            'source': 'magic_initiate',
            'is_prepared': True,
            'spell_level': 1,
            'notes': '',
        }
        resp = self.client.post(self.url, payload, format='json')

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['source'], 'magic_initiate')

    # TC-CS-003
    def test_class_source_enforces_class_membership(self):
        payload = {
            'character': self.fighter_char.id,
            'spell': self.wizard_spell.id,
            'source': 'class',
            'is_prepared': True,
            'spell_level': 1,
            'notes': '',
        }
        resp = self.client.post(self.url, payload, format='json')

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# ─── TC-REST: rest endpoint slots_restored ────────────────────────────────────

class RestEndpointSlotsRestoredTests(TestCase):
    """TC-REST-001 / TC-REST-002 / TC-REST-002b"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='rest_slots_user', email='rest_slots@test.com', password='pass123'
        )
        cls.wizard_class = _make_class(name='WizardRest')
        cls.warlock_class = _make_class(
            name='WarlockRest', hit_die=8,
            spellcasting={'ability': 'charisma', 'type': 'pact'},
        )

        cls.wizard_char = _make_character(
            cls.user, cls.wizard_class, name='WizardRestChar',
        )
        cls.warlock_char = _make_character(
            cls.user, cls.warlock_class, name='WarlockRestChar',
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        SpellSlotState.objects.filter(
            character__in=[self.wizard_char, self.warlock_char]
        ).delete()
        SpellSlotState.objects.create(character=self.wizard_char, slot_level=1, total=4, used=3)
        SpellSlotState.objects.create(character=self.wizard_char, slot_level=2, total=3, used=2)
        SpellSlotState.objects.create(character=self.warlock_char, slot_level=1, total=2, used=2)

    def tearDown(self):
        SpellSlotState.objects.filter(
            character__in=[self.wizard_char, self.warlock_char]
        ).delete()

    # TC-REST-001
    def test_long_rest_resets_all_slots_and_returns_slots_restored(self):
        resp = self.client.post(
            f'/api/v1/characters/{self.wizard_char.id}/rest/',
            {'type': 'long'},
            format='json',
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('slots_restored', resp.data)
        self.assertIsInstance(resp.data['slots_restored'], list)
        self.assertIn(1, resp.data['slots_restored'])
        self.assertIn(2, resp.data['slots_restored'])

        for slot in SpellSlotState.objects.filter(character=self.wizard_char):
            self.assertEqual(slot.used, 0)

    # TC-REST-002
    def test_short_rest_non_warlock_returns_empty_slots_restored(self):
        resp = self.client.post(
            f'/api/v1/characters/{self.wizard_char.id}/rest/',
            {'type': 'short'},
            format='json',
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('slots_restored', resp.data)
        self.assertEqual(resp.data['slots_restored'], [])

    # TC-REST-002b
    def test_short_rest_warlock_resets_pact_slots(self):
        resp = self.client.post(
            f'/api/v1/characters/{self.warlock_char.id}/rest/',
            {'type': 'short'},
            format='json',
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('slots_restored', resp.data)
        self.assertIn(1, resp.data['slots_restored'])

        slot = SpellSlotState.objects.get(character=self.warlock_char, slot_level=1)
        self.assertEqual(slot.used, 0)

