"""
Management command to back up the application database.

For SQLite: copies the database file + dumps SQL.
For PostgreSQL: runs pg_dump via subprocess.

Usage:
    python manage.py backup_database
    python manage.py backup_database --output-dir /path/to/backups
    python manage.py backup_database --format json    # Django dumpdata (all engines)
"""

import os
import shutil
import subprocess
import datetime
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = "Back up the database to a timestamped file in the backup directory."

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            default=str(settings.BASE_DIR / 'backups'),
            help='Directory to write backup files (default: <BASE_DIR>/backups)',
        )
        parser.add_argument(
            '--format',
            choices=['native', 'json'],
            default='native',
            help=(
                '"native" uses engine-specific tools (pg_dump / SQLite file copy); '
                '"json" uses Django dumpdata (portable but slower for large DBs).'
            ),
        )

    def handle(self, *args, **options):
        output_dir = Path(options['output_dir'])
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        db_config = settings.DATABASES['default']
        engine = db_config.get('ENGINE', '')

        if options['format'] == 'json':
            self._backup_json(output_dir, timestamp)
            return

        if 'sqlite3' in engine:
            self._backup_sqlite(db_config, output_dir, timestamp)
        elif 'postgresql' in engine:
            self._backup_postgres(db_config, output_dir, timestamp)
        else:
            raise CommandError(
                f"Unsupported engine for native backup: {engine}. Use --format=json instead."
            )

    # ------------------------------------------------------------------
    # SQLite backup
    # ------------------------------------------------------------------

    def _backup_sqlite(self, db_config, output_dir, timestamp):
        source = Path(db_config['NAME'])
        if not source.exists():
            raise CommandError(f"SQLite database file not found: {source}")

        dest = output_dir / f"db_backup_{timestamp}.sqlite3"
        shutil.copy2(source, dest)
        self.stdout.write(self.style.SUCCESS(f"SQLite backup written to: {dest}"))

        # Also write a SQL dump for portability
        sql_dest = output_dir / f"db_backup_{timestamp}.sql"
        try:
            result = subprocess.run(
                ['sqlite3', str(source), '.dump'],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode == 0:
                sql_dest.write_text(result.stdout, encoding='utf-8')
                self.stdout.write(self.style.SUCCESS(f"SQL dump written to:    {sql_dest}"))
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"sqlite3 CLI not available; skipping SQL dump ({result.stderr.strip()})"
                    )
                )
        except FileNotFoundError:
            self.stdout.write(self.style.WARNING("sqlite3 CLI not found; skipping SQL dump."))

    # ------------------------------------------------------------------
    # PostgreSQL backup
    # ------------------------------------------------------------------

    def _backup_postgres(self, db_config, output_dir, timestamp):
        dest = output_dir / f"db_backup_{timestamp}.pgdump"
        env = os.environ.copy()
        if db_config.get('PASSWORD'):
            env['PGPASSWORD'] = db_config['PASSWORD']

        cmd = ['pg_dump', '--format=custom', f"--file={dest}"]
        if db_config.get('HOST'):
            cmd += ['--host', db_config['HOST']]
        if db_config.get('PORT'):
            cmd += ['--port', str(db_config['PORT'])]
        if db_config.get('USER'):
            cmd += ['--username', db_config['USER']]
        cmd.append(db_config['NAME'])

        try:
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=300)
        except FileNotFoundError:
            raise CommandError(
                "pg_dump not found. Install PostgreSQL client tools and ensure pg_dump is on PATH."
            )

        if result.returncode != 0:
            raise CommandError(f"pg_dump failed: {result.stderr.strip()}")

        self.stdout.write(self.style.SUCCESS(f"PostgreSQL backup written to: {dest}"))

    # ------------------------------------------------------------------
    # JSON / dumpdata backup (engine-agnostic)
    # ------------------------------------------------------------------

    def _backup_json(self, output_dir, timestamp):
        from django.core.management import call_command
        import io

        dest = output_dir / f"db_backup_{timestamp}.json"
        buf = io.StringIO()
        call_command(
            'dumpdata',
            '--natural-foreign',
            '--natural-primary',
            '--exclude=contenttypes',
            '--exclude=auth.permission',
            '--indent=2',
            stdout=buf,
        )
        dest.write_text(buf.getvalue(), encoding='utf-8')
        self.stdout.write(self.style.SUCCESS(f"JSON backup written to: {dest}"))
