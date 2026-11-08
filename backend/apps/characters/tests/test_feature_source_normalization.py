from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character
from apps.content.models import Background, CharacterClass, ClassFeature, Species

User = get_user_model()


class FeatureSourceNormalizationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='source_user', password='pass123')
        cls.species = Species.objects.create(
            name='Elf',
            description='Elf',
            traits=[
                {'name': 'Darkvision', 'description': 'See in darkness.', 'source': 'Species'},
            ],
        )
        cls.char_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
        )
        ClassFeature.objects.create(
            character_class=cls.char_class,
            name='Second Wind',
            description='Regain hit points with a bonus action.',
            level=1,
        )
        cls.background = Background.objects.create(
            name='Soldier',
            description='Background',
            feature_name='Military Rank',
            feature_description='Rank feature.',
            origin_feats=[],
        )

        cls.character = Character.objects.create(
            user=cls.user,
            name='SourceHero',
            species=cls.species,
            character_class=cls.char_class,
            background=cls.background,
            level=2,
            strength=12,
            dexterity=14,
            constitution=13,
            intelligence=10,
            wisdom=10,
            charisma=10,
            max_hit_points=20,
            current_hit_points=20,
            features=[
                {'name': 'Second Wind', 'description': 'Short text', 'source': 'Class'},
                {'name': 'Origin Feat', 'description': 'Detailed feat text', 'source': 'Feat'},
            ],
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_normalized_features_contains_class_species_and_feat_sources(self):
        resp = self.client.get(f'/api/v1/characters/{self.character.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        normalized = resp.data.get('normalized_features') or []
        self.assertTrue(any(f.get('name') == 'Second Wind' for f in normalized))
        self.assertTrue(any(f.get('name') == 'Darkvision' for f in normalized))
        self.assertTrue(any(f.get('name') == 'Origin Feat' for f in normalized))

        source_map = {f['name']: f.get('source') for f in normalized}
        self.assertEqual(source_map.get('Darkvision'), 'Species')
        self.assertEqual(source_map.get('Origin Feat'), 'Feat')

    def test_normalized_features_deduplicate_by_key_and_keep_richest_description(self):
        resp = self.client.get(f'/api/v1/characters/{self.character.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        normalized = [f for f in (resp.data.get('normalized_features') or []) if f.get('name') == 'Second Wind']
        self.assertEqual(len(normalized), 1)
        self.assertIn('Regain hit points', normalized[0].get('description', ''))
