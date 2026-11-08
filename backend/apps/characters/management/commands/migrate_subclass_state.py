from django.core.management.base import BaseCommand

from apps.characters.models import Character, CharacterSubclassState


class Command(BaseCommand):
    help = 'Infer and persist CharacterSubclassState rows for legacy characters missing subclass state.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report inferred changes without saving them.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        created_count = 0

        characters_missing_state = Character.objects.exclude(
            id__in=CharacterSubclassState.objects.values_list('character_id', flat=True)
        ).select_related('character_class')

        for character in characters_missing_state:
            class_slug = str(character.character_class.name or '').strip().lower().replace(' ', '-')
            inferred_subclass_slug = self._infer_subclass_slug(character)

            self.stdout.write(
                f'Character {character.id} ({character.name}): class_slug={class_slug} '
                f'inferred_subclass_slug={inferred_subclass_slug}'
            )

            if dry_run:
                continue

            CharacterSubclassState.objects.create(
                character=character,
                class_slug=class_slug,
                subclass_slug=inferred_subclass_slug,
                class_content_version='2024.1',
                subclass_content_version='2024.1' if inferred_subclass_slug else '',
                warning_state=False,
            )
            created_count += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Dry run complete. {characters_missing_state.count()} characters would be updated.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Created subclass state for {created_count} characters.'))

    def _infer_subclass_slug(self, character) -> str | None:
        features = character.features or []
        for feature in features:
            if not isinstance(feature, dict):
                continue
            source = str(feature.get('source') or '').strip().lower()
            if source == 'subclass':
                name = str(feature.get('subclass_name') or feature.get('name') or '').strip()
                if name:
                    return name.lower().replace(' ', '-')
        return None
