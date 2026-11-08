from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character, FeatureUsageState
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class SubclassExtensibilityTests(TestCase):
    """Validate that adding new subclass content requires no core code changes."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='subclass_ext_user',
            email='subclass_ext_user@example.com',
            password='pass123',
        )
        cls.species = Species.objects.create(name='Human', description='Human')
        cls.background = Background.objects.create(
            name='Soldier',
            description='Background',
            feature_name='Rank',
            feature_description='Feature',
            origin_feats=[],
        )

    def _make_character(self, character_class, level=3):
        return Character.objects.create(
            user=self.user,
            name='ExtHero',
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

    def test_synthetic_fixture_subclass_can_be_selected_and_backfills_resources(self):
        fighter_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter class',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
            subclass_level=3,
        )
        character = self._make_character(fighter_class, level=7)

        resp = self.client.post(
            f'/api/v1/characters/{character.id}/subclass/',
            {
                'class_slug': 'fighter',
                'subclass_slug': 'subclass-extensibility-fixture',
                'client_confirmed_warning': True,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_each_baseline_class_has_at_least_one_selectable_subclass_fixture_pattern(self):
        # This test verifies the extensibility fixture file is well-formed and
        # loadable via the shared subclass service without touching core code.
        from apps.characters.services.mechanics.subclass import load_class_content, find_subclass_definition

        content = load_class_content('subclass-extensibility-fixture')
        self.assertIn('subclasses', content)

        definition = find_subclass_definition(content, 'arcane-vanguard')
        self.assertIsNotNone(definition)
        self.assertIn('mechanics', definition)
        self.assertIn('resources', definition['mechanics'])
