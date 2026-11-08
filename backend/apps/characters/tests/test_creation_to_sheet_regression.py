from django.test import TestCase
from rest_framework.test import APIClient

from apps.characters.tests.parity_fixtures import build_full_parity_character


class CreationToSheetRegressionTests(TestCase):
    """Lock in end-to-end parity across creation, normalization, and derived math."""

    def setUp(self):
        fixture = build_full_parity_character()
        self.character = fixture['character']
        self.user = fixture['user']
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _fetch_detail(self):
        resp = self.client.get(f'/api/v1/characters/{self.character.id}/')
        self.assertEqual(resp.status_code, 200)
        return resp.data

    def test_normalized_features_include_species_class_and_character_sources(self):
        data = self._fetch_detail()
        feature_names = {f.get('name') for f in data['normalized_features']}
        self.assertIn('Second Wind', feature_names)
        self.assertIn('Draconic Ancestry', feature_names)

    def test_derived_stats_reflect_natural_armor_and_attack_profiles(self):
        data = self._fetch_detail()
        derived = data['derived_stats']
        # 13 + dex modifier (dex 14 -> +2) = 15
        self.assertEqual(derived['armor_class'], 15)
        self.assertEqual(derived['armor_source_key'], 'species:dragonborn')
        attack_names = {row['name'] for row in derived['natural_attack_rows']}
        self.assertIn('Breath Weapon', attack_names)

    def test_feature_usage_state_is_exposed_and_consistent_with_recharge_rules(self):
        data = self._fetch_detail()
        usage_entries = data['feature_usage']
        matching = [u for u in usage_entries if u['feature_key'] == 'species:breath_weapon']
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]['current_uses'], 1)

    def test_subclass_state_is_persisted_and_exposed(self):
        data = self._fetch_detail()
        subclass_state = data['subclass_state']
        self.assertEqual(subclass_state['class_slug'], 'fighter')
        self.assertEqual(subclass_state['subclass_slug'], 'champion')

    def test_repeated_fetches_are_deterministic(self):
        first = self._fetch_detail()
        second = self._fetch_detail()
        self.assertEqual(first['derived_stats'], second['derived_stats'])
        self.assertEqual(first['normalized_features'], second['normalized_features'])
