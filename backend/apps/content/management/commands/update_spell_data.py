"""
Management command to enrich Spell records from structured JSON data files.

Reads all spells-*.json files from api/content/spells/ and updates existing
spell records (or creates new ones) with full descriptions, structured
components, and damage data from the SRD 2024.

Usage:
    python manage.py update_spell_data
    python manage.py update_spell_data --dry-run
"""

import glob
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.content.models import Spell, CharacterClass


class Command(BaseCommand):
    help = 'Update spell data from structured JSON files in api/content/spells/'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without writing to the database.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        spells_dir = Path(__file__).parents[5] / 'api' / 'content' / 'spells'

        if not spells_dir.exists():
            self.stderr.write(self.style.ERROR(f'Spells directory not found: {spells_dir}'))
            return

        json_files = sorted(spells_dir.glob('spells-*.json'))
        if not json_files:
            self.stderr.write(self.style.WARNING('No spells-*.json files found.'))
            return

        self.stdout.write(f'Found {len(json_files)} file(s): {[f.name for f in json_files]}')

        # Build class lookup once
        class_map = {c.name: c for c in CharacterClass.objects.all()}
        missing_classes: set[str] = set()

        created = 0
        updated = 0
        skipped = 0

        with transaction.atomic():
            for json_file in json_files:
                self.stdout.write(f'\nProcessing {json_file.name}...')
                with open(json_file, encoding='utf-8') as fh:
                    data = json.load(fh)

                spells = data.get('spells', [])
                self.stdout.write(f'  {len(spells)} spell(s) found.')

                for spell_data in spells:
                    name = spell_data.get('name')
                    if not name:
                        self.stderr.write('  Skipping entry with no name.')
                        skipped += 1
                        continue

                    damage = spell_data.get('damage') or {}
                    components = spell_data.get('components') or {}

                    defaults = {
                        'level': spell_data.get('level', 0),
                        'school': spell_data.get('school', ''),
                        'casting_time': spell_data.get('casting_time', ''),
                        'range': spell_data.get('range', ''),
                        'components': components,
                        'duration': spell_data.get('duration', ''),
                        'concentration': spell_data.get('concentration', False),
                        'ritual': spell_data.get('ritual', False),
                        'damage': damage,
                        'description': spell_data.get('description', ''),
                        'higher_levels': spell_data.get('higher_levels') or '',
                        'source': data.get('source', 'SRD 2024'),
                    }

                    if dry_run:
                        exists = Spell.objects.filter(name=name).exists()
                        verb = 'UPDATE' if exists else 'CREATE'
                        self.stdout.write(f'  [{verb}] {name}')
                        if damage:
                            self.stdout.write(f'         damage: {damage}')
                    else:
                        spell, is_new = Spell.objects.update_or_create(
                            name=name,
                            defaults=defaults,
                        )

                        class_instances = []
                        for class_name in spell_data.get('classes', []):
                            if class_name in class_map:
                                class_instances.append(class_map[class_name])
                            else:
                                missing_classes.add(class_name)

                        spell.classes.set(class_instances)

                        if is_new:
                            created += 1
                            self.stdout.write(f'  [CREATED] {name}')
                        else:
                            updated += 1
                            self.stdout.write(f'  [UPDATED] {name}')

            if dry_run:
                raise SystemExit(0)

        if missing_classes:
            self.stdout.write(self.style.WARNING(
                f'\nWarning: classes not found in DB: {sorted(missing_classes)}'
            ))

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created: {created}, Updated: {updated}, Skipped: {skipped}'
        ))
