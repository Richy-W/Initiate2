from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character, FeatureUsageState
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class FeatureUsageContractTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='usage_user', password='pass123')
        cls.species = Species.objects.create(name='Dwarf', description='Dwarf')
        cls.char_class = CharacterClass.objects.create(
            name='Cleric',
            description='Cleric class',
            hit_die=8,
            saving_throw_proficiencies=['wisdom', 'charisma'],
            spellcasting={'ability': 'wisdom', 'type': 'full'},
        )
        cls.background = Background.objects.create(
            name='Acolyte',
            description='Background',
            feature_name='Shelter of the Faithful',
            feature_description='Feature',
            origin_feats=[],
        )
        cls.character = Character.objects.create(
            user=cls.user,
            name='UsageHero',
            species=cls.species,
            character_class=cls.char_class,
            background=cls.background,
            level=5,
            strength=10,
            dexterity=10,
            constitution=14,
            intelligence=10,
            wisdom=16,
            charisma=10,
            max_hit_points=35,
            current_hit_points=35,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_resource_spend_rejects_non_positive_amount(self):
        FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:cleric:channel_divinity',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=2,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={'max_uses': 2},
        )

        resp = self.client.post(
            f'/api/v1/characters/{self.character.id}/resource_spend/',
            {'feature_key': 'class:cleric:channel_divinity', 'amount': 0},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resource_spend_rejects_overspend(self):
        FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:cleric:channel_divinity',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=1,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={'max_uses': 2},
        )

        resp = self.client.post(
            f'/api/v1/characters/{self.character.id}/resource_spend/',
            {'feature_key': 'class:cleric:channel_divinity', 'amount': 2},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resource_spend_decrements_current_uses(self):
        state = FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:cleric:channel_divinity',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=2,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={'max_uses': 2},
        )

        resp = self.client.post(
            f'/api/v1/characters/{self.character.id}/resource_spend/',
            {'feature_key': state.feature_key, 'amount': 1},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        state.refresh_from_db()
        self.assertEqual(state.current_uses, 1)

    def test_short_rest_resets_short_rest_resources(self):
        state = FeatureUsageState.objects.create(
            character=self.character,
            feature_key='class:cleric:channel_divinity',
            source_type=FeatureUsageState.SOURCE_CLASS,
            current_uses=0,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
            override_payload={'max_uses': 2},
        )

        resp = self.client.post(
            f'/api/v1/characters/{self.character.id}/rest/',
            {'type': 'short'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        state.refresh_from_db()
        self.assertEqual(state.current_uses, 2)

    def test_long_rest_resets_day_resources(self):
        state = FeatureUsageState.objects.create(
            character=self.character,
            feature_key='species:dragonborn:breath_weapon',
            source_type=FeatureUsageState.SOURCE_SPECIES,
            current_uses=0,
            recharge_type=FeatureUsageState.RECHARGE_DAY,
            override_payload={'max_uses': 3},
        )

        resp = self.client.post(
            f'/api/v1/characters/{self.character.id}/rest/',
            {'type': 'long'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        state.refresh_from_db()
        self.assertEqual(state.current_uses, 3)
