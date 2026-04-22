"""
TDD tests for Character.tool_proficiencies and species-option skill proficiency assignment.

These tests are written BEFORE the backend serializer changes (T017-T019) and must
initially FAIL for TC-001 through TC-005 (proficiency assignment not yet implemented).
TC-006 and TC-007 assert absence of errors and should pass immediately.

Contract source: specs/003-fix-human-origin-feat-dropdown/contracts/character-create-species-options.md
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.content.models import Species, CharacterClass, Background, Skill
from apps.characters.serializers import CharacterCreateSerializer

User = get_user_model()


def _make_validated_data(user, species, char_class, background, selected_species_options=None):
    """Return a minimal valid validated_data dict for CharacterCreateSerializer.create()."""
    return {
        'user': user,
        'name': 'Test Character',
        'species': species,
        'character_class': char_class,
        'background': background,
        'strength': 10,
        'dexterity': 10,
        'constitution': 10,
        'intelligence': 10,
        'wisdom': 10,
        'charisma': 10,
        'selected_skills': [],
        'selected_class_equipment': {},
        'selected_background_equipment': {},
        'selected_class_equipment_option': '',
        'selected_background_equipment_option': '',
        'selected_species_options': selected_species_options or {},
    }


class CharacterCreateSpeciesOptionsTestCase(TestCase):
    """Tests for skillfulChoice / skilledSkillChoices / skilledToolChoices persistence."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='testuser_species', password='testpass123')

        cls.species = Species.objects.create(
            name='TestHuman',
            description='A test human species.',
            traits=[
                {
                    'name': 'Resourceful',
                    'description': 'You gain an origin feat of your choice.',
                }
            ],
        )

        cls.char_class = CharacterClass.objects.create(
            name='TestFighter',
            description='A test fighter class.',
            hit_die=10,
            saving_throw_proficiencies=['STR', 'CON'],
        )

        cls.background = Background.objects.create(
            name='TestBackground',
            description='A test background.',
            feature_name='Test Feature',
            feature_description='Does nothing.',
            origin_feats=[],
        )

        # Create the skills used across test cases
        for skill_name, ability in [
            ('Acrobatics', 'DEX'),
            ('Arcana', 'INT'),
            ('Athletics', 'STR'),
            ('History', 'INT'),
            ('Perception', 'WIS'),
        ]:
            Skill.objects.get_or_create(
                name=skill_name,
                defaults={'ability': ability, 'description': f'{skill_name} skill.'},
            )

    # ------------------------------------------------------------------
    # TC-001
    # ------------------------------------------------------------------
    def test_skillful_choice_adds_skill_proficiency(self):
        """skillfulChoice: 'Acrobatics' must result in the skill being in skill_proficiencies."""
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={'skillfulChoice': 'Acrobatics'},
        )
        character = CharacterCreateSerializer().create(data)
        self.assertTrue(
            character.skill_proficiencies.filter(name='Acrobatics').exists(),
            "Expected Acrobatics to be in skill_proficiencies via skillfulChoice.",
        )

    # ------------------------------------------------------------------
    # TC-002
    # ------------------------------------------------------------------
    def test_skilled_skill_choices_add_skill_proficiencies(self):
        """skilledSkillChoices with 3 skills must all be added to skill_proficiencies."""
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={
                'featChoice': 'Skilled',
                'skilledSkillChoices': ['Arcana', 'History', 'Perception'],
                'skilledToolChoices': [],
            },
        )
        character = CharacterCreateSerializer().create(data)
        for skill_name in ['Arcana', 'History', 'Perception']:
            self.assertTrue(
                character.skill_proficiencies.filter(name=skill_name).exists(),
                f"Expected {skill_name} in skill_proficiencies via skilledSkillChoices.",
            )
        self.assertEqual(
            list(character.tool_proficiencies),
            [],
            "tool_proficiencies should be empty when only skill choices are made.",
        )

    # ------------------------------------------------------------------
    # TC-003
    # ------------------------------------------------------------------
    def test_skilled_tool_choices_add_tool_proficiencies(self):
        """skilledToolChoices must be persisted in character.tool_proficiencies."""
        tools = ["Smith's Tools", "Thieves' Tools", 'Herbalism Kit']
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={
                'featChoice': 'Skilled',
                'skilledSkillChoices': [],
                'skilledToolChoices': tools,
            },
        )
        character = CharacterCreateSerializer().create(data)
        for tool in tools:
            self.assertIn(
                tool,
                character.tool_proficiencies,
                f"Expected '{tool}' in tool_proficiencies via skilledToolChoices.",
            )
        # None of those strings should be skill proficiencies
        skill_names = list(character.skill_proficiencies.values_list('name', flat=True))
        for tool in tools:
            self.assertNotIn(tool, skill_names, f"'{tool}' must not be a skill proficiency.")

    # ------------------------------------------------------------------
    # TC-004
    # ------------------------------------------------------------------
    def test_skilled_mixed_skills_and_tools(self):
        """Mixed skilledSkillChoices + skilledToolChoices + skillfulChoice all persist correctly."""
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={
                'featChoice': 'Skilled',
                'skillfulChoice': 'Perception',
                'skilledSkillChoices': ['Arcana', 'Athletics'],
                'skilledToolChoices': ["Smith's Tools"],
            },
        )
        character = CharacterCreateSerializer().create(data)
        for skill_name in ['Perception', 'Arcana', 'Athletics']:
            self.assertTrue(
                character.skill_proficiencies.filter(name=skill_name).exists(),
                f"Expected {skill_name} in skill_proficiencies.",
            )
        self.assertIn(
            "Smith's Tools",
            character.tool_proficiencies,
            "Expected Smith's Tools in tool_proficiencies.",
        )
        skill_names = list(character.skill_proficiencies.values_list('name', flat=True))
        self.assertNotIn("Smith's Tools", skill_names, "Smith's Tools must not appear in skill_proficiencies.")

    # ------------------------------------------------------------------
    # TC-005
    # ------------------------------------------------------------------
    def test_skillful_and_skilled_skill_deduplication(self):
        """Same skill in both skillfulChoice and skilledSkillChoices must appear only once."""
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={
                'skillfulChoice': 'Perception',
                'skilledSkillChoices': ['Perception', 'Arcana', 'History'],
                'skilledToolChoices': [],
            },
        )
        character = CharacterCreateSerializer().create(data)
        perception_count = character.skill_proficiencies.filter(name='Perception').count()
        self.assertEqual(perception_count, 1, "Perception must appear exactly once (deduplication).")
        for skill_name in ['Perception', 'Arcana', 'History']:
            self.assertTrue(
                character.skill_proficiencies.filter(name=skill_name).exists(),
                f"Expected {skill_name} in skill_proficiencies.",
            )

    # ------------------------------------------------------------------
    # TC-006
    # ------------------------------------------------------------------
    def test_missing_new_keys_does_not_error(self):
        """A payload with no new keys (e.g. Elf) must create a character without errors."""
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={
                'variant': '',
                'skillChoice': '',
                'spellcastingAbility': 'Intelligence',
                'sizeCategory': 'Medium',
                'featChoice': '',
            },
        )
        character = CharacterCreateSerializer().create(data)
        self.assertIsNotNone(character.pk, "Character should be created successfully.")
        self.assertEqual(
            list(character.tool_proficiencies),
            [],
            "tool_proficiencies must be [] when no tool choices are provided.",
        )

    # ------------------------------------------------------------------
    # TC-007
    # ------------------------------------------------------------------
    def test_empty_skilled_choices_no_proficiencies_added(self):
        """Empty skilledSkillChoices and skilledToolChoices must not add any proficiencies."""
        data = _make_validated_data(
            self.user, self.species, self.char_class, self.background,
            selected_species_options={
                'featChoice': 'Skilled',
                'skilledSkillChoices': [],
                'skilledToolChoices': [],
            },
        )
        character = CharacterCreateSerializer().create(data)
        # Only background/class skills may be present (none for our stub data)
        self.assertEqual(
            character.skill_proficiencies.count(),
            0,
            "No skill proficiencies should be added with empty Skilled choices.",
        )
        self.assertEqual(
            list(character.tool_proficiencies),
            [],
            "tool_proficiencies must remain [] with empty Skilled tool choices.",
        )
