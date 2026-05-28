from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('characters', '0005_character_attuned_items'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='death_save_failures',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='character',
            name='death_save_successes',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
