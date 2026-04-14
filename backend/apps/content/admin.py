from django.contrib import admin
from .models import (
    DamageType, Condition, Skill, Species, Background, CharacterClass, 
    ClassFeature, Spell, Equipment, Feat, Monster, MagicItem
)


@admin.register(DamageType)
class DamageTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Condition)
class ConditionAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'ability', 'description']
    list_filter = ['ability']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    list_display = ['name', 'size', 'speed', 'darkvision', 'source']
    list_filter = ['size', 'source']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(Background)
class BackgroundAdmin(admin.ModelAdmin):
    list_display = ['name', 'feature_name', 'source']
    search_fields = ['name', 'description', 'feature_name']
    filter_horizontal = ['skill_proficiencies']
    ordering = ['name']


class ClassFeatureInline(admin.TabularInline):
    model = ClassFeature
    extra = 0
    ordering = ['level', 'name']


@admin.register(CharacterClass)
class CharacterClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'hit_die', 'skill_choices', 'source']
    list_filter = ['hit_die', 'source']
    search_fields = ['name', 'description']
    filter_horizontal = ['skill_proficiencies']
    inlines = [ClassFeatureInline]
    ordering = ['name']


@admin.register(ClassFeature)
class ClassFeatureAdmin(admin.ModelAdmin):
    list_display = ['name', 'character_class', 'level', 'uses', 'recharge']
    list_filter = ['character_class', 'level', 'uses', 'recharge']
    search_fields = ['name', 'description']
    ordering = ['character_class', 'level', 'name']


@admin.register(Spell)
class SpellAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'school', 'casting_time', 'concentration', 'ritual', 'source']
    list_filter = ['level', 'school', 'concentration', 'ritual', 'source']
    search_fields = ['name', 'description']
    filter_horizontal = ['classes']
    ordering = ['level', 'name']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'equipment_type', 'weight', 'armor_class', 'source']
    list_filter = ['equipment_type', 'source']
    search_fields = ['name', 'description']
    ordering = ['equipment_type', 'name']


@admin.register(Feat)
class FeatAdmin(admin.ModelAdmin):
    list_display = ['name', 'feat_type', 'prerequisite', 'source']
    list_filter = ['feat_type', 'source']
    search_fields = ['name', 'description', 'prerequisite']
    ordering = ['feat_type', 'name']


@admin.register(Monster)
class MonsterAdmin(admin.ModelAdmin):
    list_display = ['name', 'size', 'creature_type', 'challenge_rating', 'armor_class', 'hit_points', 'source']
    list_filter = ['size', 'creature_type', 'challenge_rating', 'source']
    search_fields = ['name', 'description']
    filter_horizontal = ['damage_vulnerabilities', 'damage_resistances', 'damage_immunities', 'condition_immunities']
    ordering = ['challenge_rating', 'name']


@admin.register(MagicItem)
class MagicItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'rarity', 'item_type', 'attunement', 'cursed', 'source']
    list_filter = ['rarity', 'attunement', 'cursed', 'source']
    search_fields = ['name', 'description', 'item_type']
    ordering = ['rarity', 'name']
