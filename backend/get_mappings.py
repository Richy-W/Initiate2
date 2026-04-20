#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Species, CharacterClass, Background

print('// ID Mappings for Frontend Character Creation')
print('export const SPECIES_ID_MAP: Record<string, number> = {')
for species in Species.objects.all():
    print(f'  "{species.id}": {species.pk},')
print('};')

print()
print('export const CLASS_ID_MAP: Record<string, number> = {') 
for cls in CharacterClass.objects.all():
    print(f'  "{cls.id}": {cls.pk},')
print('};')

print()
print('export const BACKGROUND_ID_MAP: Record<string, number> = {')
for bg in Background.objects.all():
    print(f'  "{bg.id}": {bg.pk},')
print('};')