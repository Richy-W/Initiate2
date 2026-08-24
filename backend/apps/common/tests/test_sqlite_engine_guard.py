from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.settings import validate_database_configuration


class SqliteEngineGuardTests(SimpleTestCase):
    def test_sqlite_engine_is_rejected(self):
        with self.assertRaisesRegex(
            ImproperlyConfigured,
            "SQLite is prohibited by project constitution",
        ):
            validate_database_configuration(
                db_engine="django.db.backends.sqlite3",
                db_name="db.sqlite3",
                db_user="",
                db_password="",
                db_host="",
                db_port="",
            )
