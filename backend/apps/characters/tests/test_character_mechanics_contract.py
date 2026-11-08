from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


def _make_species(name='TestSpecies'):
    return Species.objects.create(name=name, description='A test species.')


def _make_class(name='Fighter', hit_die=10, spellcasting=None):
    return CharacterClass.objects.create(
        name=name,
        description=f'A test {name} class.',
        hit_die=hit_die,
        saving_throw_proficiencies=['strength', 'constitution'],
        spellcasting=spellcasting or {'ability': None, 'type': 'none'},
    )


def _make_background(name='TestBackground'):
    return Background.objects.create(
        name=name,
        description='A test background.',
        feature_name='Feature',
        feature_description='Feature description.',
        origin_feats=[],
    )


class CharacterDetailContractTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='contract_user', password='pass123')
        cls.species = _make_species()
        cls.char_class = _make_class()
        cls.background = _make_background()
        cls.character = Character.objects.create(
            user=cls.user,
            name='ContractHero',
            species=cls.species,
            character_class=cls.char_class,
            background=cls.background,
            level=3,
            strength=12,
            dexterity=14,
            constitution=13,
            intelligence=10,
            wisdom=10,
            charisma=10,
            max_hit_points=22,
            current_hit_points=22,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_character_detail_includes_canonical_sections(self):
        resp = self.client.get(f'/api/v1/characters/{self.character.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        for key in [
            'subclass_state',
            'derived_stats',
            'feature_usage',
            'granted_spells',
            'natural_attacks',
            'natural_armor_profiles',
        ]:
            self.assertIn(key, resp.data)

    def test_derived_stats_shape_contract(self):
        resp = self.client.get(f'/api/v1/characters/{self.character.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        derived = resp.data.get('derived_stats') or {}

        self.assertIn('ability_totals', derived)
        self.assertIn('ability_modifiers', derived)
        self.assertIn('proficiency_bonus', derived)
        self.assertIn('armor_class', derived)
        self.assertIn('max_hit_points', derived)
