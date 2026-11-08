"""Shared backend fixtures for creation-to-sheet regression parity tests.

Builds a fully populated character exercising US1-US6 mechanics (features,
derived stats, natural attacks/armor, feature usage counters, and subclass
state) so regression tests can assert deterministic, cross-layer parity.
"""
from django.contrib.auth import get_user_model

from apps.characters.models import (
    Character,
    CharacterSubclassState,
    FeatureUsageState,
    NaturalArmorProfile,
    NaturalAttackProfile,
)
from apps.content.models import Background, CharacterClass, Species

User = get_user_model()


def build_full_parity_character(owner=None, level=5):
    """Create and return a Character with representative mechanics wired up.

    Returns a dict with keys: character, user, character_class, species,
    background for convenience in assertions.
    """
    user = owner or User.objects.create_user(
        username='parity_regression_user',
        email='parity_regression_user@example.com',
        password='pass123',
    )

    species = Species.objects.create(
        name='Dragonborn',
        description='Dragonborn species',
        traits=[{'name': 'Draconic Ancestry', 'description': 'Breath weapon lineage trait.'}],
    )

    character_class = CharacterClass.objects.create(
        name='Fighter',
        description='Fighter class',
        hit_die=10,
        saving_throw_proficiencies=['strength', 'constitution'],
        spellcasting={'type': 'none'},
        subclass_level=3,
    )

    background = Background.objects.create(
        name='Soldier',
        description='Background',
        feature_name='Military Rank',
        feature_description='You have a military rank.',
        origin_feats=[],
    )

    character = Character.objects.create(
        user=user,
        name='ParityHero',
        species=species,
        character_class=character_class,
        background=background,
        level=level,
        strength=16,
        dexterity=14,
        constitution=15,
        intelligence=10,
        wisdom=10,
        charisma=8,
        max_hit_points=44,
        current_hit_points=44,
        features=[{'name': 'Second Wind', 'source': 'class'}],
    )

    NaturalArmorProfile.objects.create(
        character=character,
        armor_key='draconic-scales',
        formula='13+dex',
        applies_when_wearing_armor=False,
        shield_allowed=True,
        precedence_rank=5,
        source_key='species:dragonborn',
    )

    NaturalAttackProfile.objects.create(
        character=character,
        attack_key='breath-weapon',
        name='Breath Weapon',
        ability='con',
        proficiency_policy=NaturalAttackProfile.PROFICIENCY_PROFICIENT,
        damage_dice='2d6',
        damage_type='fire',
        source_key='species:dragonborn',
    )

    FeatureUsageState.objects.create(
        character=character,
        feature_key='species:breath_weapon',
        source_type=FeatureUsageState.SOURCE_SPECIES,
        current_uses=1,
        recharge_type=FeatureUsageState.RECHARGE_LONG_REST,
        override_payload={'max_uses': 1},
    )

    CharacterSubclassState.objects.create(
        character=character,
        class_slug='fighter',
        subclass_slug='champion',
        class_content_version='2024.1',
        subclass_content_version='2024.1',
        warning_state=False,
    )

    return {
        'character': character,
        'user': user,
        'character_class': character_class,
        'species': species,
        'background': background,
    }
