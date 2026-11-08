from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.characters.models import Character, CharacterSubclassState, SubclassChangeAuditEvent
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class SubclassSelectionContractTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='subclass_user', password='pass123')
        cls.species = Species.objects.create(name='Human', description='Human')
        cls.char_class = CharacterClass.objects.create(
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
            feature_name='Military Rank',
            feature_description='Feature',
            origin_feats=[],
        )
        cls.character = Character.objects.create(
            user=cls.user,
            name='SubclassHero',
            species=cls.species,
            character_class=cls.char_class,
            background=cls.background,
            level=3,
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
        self.url = f'/api/v1/characters/{self.character.id}/subclass/'

    def test_rejects_cross_class_slug(self):
        resp = self.client.post(
            self.url,
            {
                'class_slug': 'wizard',
                'subclass_slug': 'champion',
                'client_confirmed_warning': True,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_unknown_subclass(self):
        resp = self.client.post(
            self.url,
            {
                'class_slug': 'fighter',
                'subclass_slug': 'not-a-real-subclass',
                'client_confirmed_warning': True,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data.get('code'), 'invalid_subclass_definition')

    def test_persists_subclass_and_writes_audit_event(self):
        resp = self.client.post(
            self.url,
            {
                'class_slug': 'fighter',
                'subclass_slug': 'champion',
                'client_confirmed_warning': True,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        state = CharacterSubclassState.objects.get(character=self.character)
        self.assertEqual(state.class_slug, 'fighter')
        self.assertEqual(state.subclass_slug, 'champion')

        self.assertTrue(
            SubclassChangeAuditEvent.objects.filter(
                character=self.character,
                new_subclass_slug='champion',
                actor_user=self.user,
            ).exists()
        )
