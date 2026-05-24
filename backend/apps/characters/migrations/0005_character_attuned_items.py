from django.db import migrations
import apps.content.models


class Migration(migrations.Migration):

    dependencies = [
        ('characters', '0004_characterspell_source_spellslotstate'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='attuned_items',
            field=apps.content.models.JSONField(default=list, help_text='Attuned magic item names (max 3)'),
        ),
    ]
