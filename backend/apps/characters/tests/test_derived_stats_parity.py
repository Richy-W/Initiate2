from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.characters.models import Character, NaturalArmorProfile, NaturalAttackProfile
from apps.characters.services.mechanics.attacks import normalize_weapon_proficiency_match
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class DerivedStatsParityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='derived_user', password='pass123')
        cls.species = Species.objects.create(name='Lizardfolk', description='Species', traits=[])
        cls.char_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
            weapon_proficiencies=['simple', 'martial'],
        )
        cls.background = Background.objects.create(
            name='Soldier',
            description='Background',
            feature_name='Rank',
            feature_description='Rank text',
            origin_feats=[],
        )
        cls.character = Character.objects.create(
            user=cls.user,
            name='ParityHero',
            species=cls.species,
            character_class=cls.char_class,
            background=cls.background,
            level=5,
            strength=16,
            dexterity=14,
            constitution=14,
            intelligence=10,
            wisdom=10,
            charisma=8,
            max_hit_points=44,
            current_hit_points=44,
            armor_class=12,
        )

        NaturalArmorProfile.objects.create(
            character=cls.character,
            armor_key='lizard_scales',
            formula='13+dex',
            applies_when_wearing_armor=False,
            shield_allowed=True,
            precedence_rank=10,
            source_key='species:lizardfolk',
            dm_override_value=None,
        )
        NaturalArmorProfile.objects.create(
            character=cls.character,
            armor_key='dm_override',
            formula='10+dex',
            applies_when_wearing_armor=True,
            shield_allowed=True,
            precedence_rank=1,
            source_key='dm:override',
            dm_override_value=19,
        )

        NaturalAttackProfile.objects.create(
            character=cls.character,
            attack_key='claw',
            name='Claw',
            ability='str',
            proficiency_policy='proficient',
            damage_dice='1d6',
            damage_type='slashing',
            source_key='species:lizardfolk',
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_normalized_weapon_proficiency_matching_supports_simple_and_martial_categories(self):
        self.assertTrue(normalize_weapon_proficiency_match('Longsword', 'martial melee', ['simple', 'martial']))
        self.assertTrue(normalize_weapon_proficiency_match('Dagger', 'simple melee', ['simple weapons']))
        self.assertFalse(normalize_weapon_proficiency_match('Longbow', 'martial ranged', ['simple']))

    def test_derived_stats_include_canonical_armor_resolution_and_natural_attack_rows(self):
        response = self.client.get(f'/api/v1/characters/{self.character.id}/')
        self.assertEqual(response.status_code, 200)

        derived = response.data.get('derived_stats') or {}
        self.assertEqual(derived.get('armor_class'), 19)
        self.assertEqual(derived.get('armor_source_key'), 'dm:override')

        natural_attack_rows = derived.get('natural_attack_rows') or []
        self.assertEqual(len(natural_attack_rows), 1)
        self.assertEqual(natural_attack_rows[0].get('name'), 'Claw')
        self.assertIn('to_hit', natural_attack_rows[0])
