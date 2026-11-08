from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character, FeatureUsageState
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class FeatureUsageCounterTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='counter_user', email='counter_user@example.com', password='pass123')
        cls.species = Species.objects.create(name='Dragonborn', description='Species')
        cls.char_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
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
            name='CounterHero',
            species=cls.species,
            character_class=cls.char_class,
            background=cls.background,
            level=5,
            strength=14,
            dexterity=12,
            constitution=14,
            intelligence=10,
            wisdom=10,
            charisma=10,
            max_hit_points=42,
            current_hit_points=42,
        )

    def setUp(self):
        self.client = APIClient()

    def test_long_rest_resets_pb_scaled_breath_weapon_uses(self):
        state = FeatureUsageState.objects.create(
            character=self.character,
            feature_key='species:dragonborn:breath_weapon',
            source_type=FeatureUsageState.SOURCE_SPECIES,
            current_uses=0,
            recharge_type=FeatureUsageState.RECHARGE_DAY,
            override_payload={
                'max_uses': 1,
                'scales_with': 'proficiency_bonus',
                'multiplier': 1,
                'min_uses': 1,
            },
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/v1/characters/{self.character.id}/rest/',
            {'type': 'long'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        state.refresh_from_db()
        self.assertEqual(state.current_uses, self.character.proficiency_bonus)

    def test_long_rest_applies_character_level_overrides(self):
        state = FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:fighter:second_wind',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=0,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={
                'max_uses': 1,
                'character_level_overrides': {'5': 2, '9': 3},
            },
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/v1/characters/{self.character.id}/rest/',
            {'type': 'short'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        state.refresh_from_db()
        self.assertEqual(state.current_uses, 2)

    def test_resource_spend_returns_override_audit_metadata(self):
        FeatureUsageState.objects.create(
            character=self.character,
            feature_key='species:dragonborn:breath_weapon',
            source_type=FeatureUsageState.SOURCE_SPECIES,
            current_uses=3,
            recharge_type=FeatureUsageState.RECHARGE_DAY,
            override_payload={
                'max_uses': 3,
                'character_level_overrides': {'5': 4},
                'resource_override_max_uses': 2,
            },
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/v1/characters/{self.character.id}/resource_spend/',
            {'feature_key': 'species:dragonborn:breath_weapon', 'amount': 1},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('override_meta', response.data)
        self.assertTrue(response.data['override_meta']['has_level_override'])
        self.assertTrue(response.data['override_meta']['has_resource_override'])

    def test_non_staff_cannot_write_override_payload(self):
        FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:fighter:second_wind',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=1,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={'max_uses': 1},
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/v1/characters/{self.character.id}/resource_spend/',
            {
                'feature_key': 'class:fighter:second_wind',
                'amount': 1,
                'override_payload': {'max_uses': 2},
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_write_override_payload_and_spend(self):
        state = FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:fighter:second_wind',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=2,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={'max_uses': 2},
        )

        self.user.is_staff = True
        self.user.save(update_fields=['is_staff'])
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f'/api/v1/characters/{self.character.id}/resource_spend/',
            {
                'feature_key': 'class:fighter:second_wind',
                'amount': 1,
                'override_payload': {'max_uses': 3},
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        state.refresh_from_db()
        self.assertEqual(state.override_payload.get('max_uses'), 3)
