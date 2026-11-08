from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class SubclassValidationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='subclass_validation_user',
            email='subclass_validation_user@example.com',
            password='pass123',
        )
        cls.species = Species.objects.create(name='Human', description='Human')
        cls.fighter_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter class',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
            subclass_level=3,
        )
        cls.wizard_class = CharacterClass.objects.create(
            name='Wizard',
            description='Wizard class',
            hit_die=6,
            saving_throw_proficiencies=['intelligence', 'wisdom'],
            spellcasting={'type': 'full', 'ability': 'intelligence'},
            subclass_level=2,
        )
        cls.background = Background.objects.create(
            name='Soldier',
            description='Background',
            feature_name='Rank',
            feature_description='Feature',
            origin_feats=[],
        )

    def _make_character(self, character_class, level):
        return Character.objects.create(
            user=self.user,
            name=f'Hero{level}',
            species=self.species,
            character_class=character_class,
            background=self.background,
            level=level,
            strength=15,
            dexterity=12,
            constitution=14,
            intelligence=10,
            wisdom=10,
            charisma=10,
            max_hit_points=24,
            current_hit_points=24,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_rejects_subclass_selection_before_required_level(self):
        character = self._make_character(self.fighter_class, level=2)
        resp = self.client.post(
            f'/api/v1/characters/{character.id}/subclass/',
            {'class_slug': 'fighter', 'subclass_slug': 'champion', 'client_confirmed_warning': True},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data.get('code'), 'invalid_subclass_timing')

    def test_allows_subclass_selection_at_required_level(self):
        character = self._make_character(self.fighter_class, level=3)
        resp = self.client.post(
            f'/api/v1/characters/{character.id}/subclass/',
            {'class_slug': 'fighter', 'subclass_slug': 'champion', 'client_confirmed_warning': True},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_rejects_cross_class_subclass_even_when_slug_exists_for_other_class(self):
        character = self._make_character(self.wizard_class, level=3)
        resp = self.client.post(
            f'/api/v1/characters/{character.id}/subclass/',
            {'class_slug': 'fighter', 'subclass_slug': 'champion', 'client_confirmed_warning': True},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data.get('code'), 'invalid_subclass_selection')
