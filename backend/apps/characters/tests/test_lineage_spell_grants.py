from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.characters.models import Character, GrantedSpellState
from apps.characters.services.mechanics.grants import apply_lineage_spell_grants
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


class LineageSpellGrantTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='lineage_user', password='pass123')
        cls.species = Species.objects.create(name='Elf', description='Elf')
        cls.char_class = CharacterClass.objects.create(
            name='Fighter',
            description='Fighter class',
            hit_die=10,
            saving_throw_proficiencies=['strength', 'constitution'],
            spellcasting={'type': 'none'},
        )
        cls.background = Background.objects.create(
            name='Sage',
            description='Background',
            feature_name='Researcher',
            feature_description='Feature',
            origin_feats=[],
        )

    def _make_character(self, level=1):
        return Character.objects.create(
            user=self.user,
            name=f'Elf-{level}',
            species=self.species,
            character_class=self.char_class,
            background=self.background,
            level=level,
            strength=10,
            dexterity=14,
            constitution=12,
            intelligence=12,
            wisdom=10,
            charisma=10,
            max_hit_points=12,
            current_hit_points=12,
        )

    def test_level_one_variant_grants_only_level_one_spell(self):
        character = self._make_character(level=1)
        created = apply_lineage_spell_grants(character, {'variant': 'High Elf'})

        self.assertEqual(created, 1)
        grants = GrantedSpellState.objects.filter(character=character).order_by('unlock_level')
        self.assertEqual(grants.count(), 1)
        self.assertEqual(grants.first().unlock_level, 1)

    def test_idempotent_grants_do_not_duplicate(self):
        character = self._make_character(level=3)
        created_first = apply_lineage_spell_grants(character, {'variant': 'High Elf'})
        created_second = apply_lineage_spell_grants(character, {'variant': 'High Elf'})

        self.assertEqual(created_first, 2)
        self.assertEqual(created_second, 0)
        self.assertEqual(GrantedSpellState.objects.filter(character=character).count(), 2)

    def test_level_up_backfill_adds_new_unlocks(self):
        character = self._make_character(level=1)
        apply_lineage_spell_grants(character, {'variant': 'High Elf'})

        character.level = 5
        character.save(update_fields=['level'])
        created = apply_lineage_spell_grants(character, {'variant': 'High Elf'})

        self.assertEqual(created, 2)
        unlock_levels = list(
            GrantedSpellState.objects.filter(character=character)
            .order_by('unlock_level')
            .values_list('unlock_level', flat=True)
        )
        self.assertEqual(unlock_levels, [1, 3, 5])
