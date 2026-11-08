import time

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.characters.models import Character
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()

P95_THRESHOLD_SECONDS = 0.3
SAMPLE_SIZE = 20


def _percentile(values, pct):
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, int(round((pct / 100.0) * (len(ordered) - 1))))
    return ordered[index]


class CharacterEndpointPerformanceTests(TestCase):
    """Verify p95 latency for the character detail and level-up endpoints."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='perf_user',
            email='perf_user@example.com',
            password='pass123',
        )
        cls.species = Species.objects.create(name='Human', description='Human')
        cls.character_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter class',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
            subclass_level=3,
        )
        cls.background = Background.objects.create(
            name='Soldier',
            description='Background',
            feature_name='Rank',
            feature_description='Feature',
            origin_feats=[],
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _make_character(self, suffix=''):
        return Character.objects.create(
            user=self.user,
            name=f'PerfHero{suffix}',
            species=self.species,
            character_class=self.character_class,
            background=self.background,
            level=1,
            strength=15,
            dexterity=12,
            constitution=14,
            intelligence=10,
            wisdom=10,
            charisma=10,
            max_hit_points=12,
            current_hit_points=12,
        )

    def test_character_detail_endpoint_p95_latency(self):
        character = self._make_character()
        durations = []

        for _ in range(SAMPLE_SIZE):
            start = time.perf_counter()
            resp = self.client.get(f'/api/v1/characters/{character.id}/')
            durations.append(time.perf_counter() - start)
            self.assertEqual(resp.status_code, 200)

        p95 = _percentile(durations, 95)
        self.assertLess(
            p95, P95_THRESHOLD_SECONDS,
            f'Character detail p95 latency {p95:.3f}s exceeded {P95_THRESHOLD_SECONDS}s threshold',
        )

    def test_character_level_up_endpoint_p95_latency(self):
        durations = []

        for _ in range(SAMPLE_SIZE):
            character = self._make_character(suffix=str(_))
            start = time.perf_counter()
            resp = self.client.post(f'/api/v1/characters/{character.id}/level_up/', {}, format='json')
            durations.append(time.perf_counter() - start)
            self.assertEqual(resp.status_code, 200)

        p95 = _percentile(durations, 95)
        self.assertLess(
            p95, P95_THRESHOLD_SECONDS,
            f'Level-up p95 latency {p95:.3f}s exceeded {P95_THRESHOLD_SECONDS}s threshold',
        )
