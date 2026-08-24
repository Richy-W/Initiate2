from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.settings import validate_database_configuration


class UnsupportedEngineGuardTests(SimpleTestCase):
    def test_unsupported_database_engine_is_rejected(self):
        with self.assertRaisesRegex(
            ImproperlyConfigured,
            "Unsupported DB_ENGINE",
        ):
            validate_database_configuration(
                db_engine="django.db.backends.mysql",
                db_name="dnd_db",
                db_user="dnd_user",
                db_password="dnd_password",
                db_host="localhost",
                db_port="5432",
            )
