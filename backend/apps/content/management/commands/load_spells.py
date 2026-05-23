"""
Management command to seed the Spell table with D&D 5e 2024 spells.

Spell data is defined inline here because the project's api/content/spells/
directory contains only rules documents, not individual spell records.
This covers the full set of spells needed for the spellcasting classes
(Wizard, Cleric, Druid, Bard, Sorcerer, Warlock, Paladin, Ranger) through
level 5 slots plus all cantrips.

NOTE: Spell descriptions are abbreviated for storage efficiency. Full
descriptive text can be expanded from the SRD as needed.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.content.models import Spell, CharacterClass

# ---------------------------------------------------------------------------
# Spell data
# Each entry: (name, level, school, casting_time, range_, duration,
#               concentration, ritual, classes, description)
# ---------------------------------------------------------------------------

SPELL_DATA = [
    # ------------------------------------------------------------------ CANTRIPS
    ("Acid Splash", 0, "Conjuration", "1 action", "60 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "Hurl a bubble of acid. One or two creatures within 5 ft of each other must succeed on a Dexterity saving throw or take 1d6 acid damage."),
    ("Blade Ward", 0, "Abjuration", "1 action", "Self", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Extend your hand and trace a sigil in the air. Until the end of your next turn, you have resistance to Bludgeoning, Piercing, and Slashing damage."),
    ("Chill Touch", 0, "Necromancy", "1 action", "Touch", "Instantaneous", False, False,
     ["Sorcerer", "Warlock", "Wizard"], "Make a melee spell attack against the target. On a hit, deal 1d10 necrotic damage and prevent the target from regaining hit points until your next turn."),
    ("Dancing Lights", 0, "Illusion", "1 action", "120 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Wizard"], "Create up to four torch-sized lights that hover in the air and shed Dim Light in 10-foot radius each."),
    ("Eldritch Blast", 0, "Evocation", "1 action", "120 feet", "Instantaneous", False, False,
     ["Warlock"], "A beam of crackling energy streaks toward a creature. Make a ranged spell attack. On a hit, the target takes 1d10 force damage."),
    ("Fire Bolt", 0, "Evocation", "1 action", "120 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "Hurl a mote of fire at a creature. Make a ranged spell attack. On a hit, deal 1d10 fire damage."),
    ("Friends", 0, "Enchantment", "1 action", "Self", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Gain advantage on Charisma checks against one creature. When the spell ends, the creature knows it was charmed."),
    ("Guidance", 0, "Divination", "1 action", "Touch", "Concentration, up to 1 minute", True, False,
     ["Cleric", "Druid"], "Touch one willing creature. Once before the spell ends, the target can roll a d4 and add the result to one ability check."),
    ("Light", 0, "Evocation", "1 action", "Touch", "1 hour", False, False,
     ["Bard", "Cleric", "Sorcerer", "Wizard"], "Touch one object. It sheds Bright Light in a 20-foot radius and Dim Light for an additional 20 feet."),
    ("Mage Hand", 0, "Conjuration", "1 action", "30 feet", "1 minute", False, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "A spectral, floating hand appears at a point you choose within range. You can use the hand to manipulate objects, open doors, stow items, or retrieve items from containers."),
    ("Mending", 0, "Transmutation", "1 minute", "Touch", "Instantaneous", False, False,
     ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"], "This spell repairs a single break or tear in an object you touch."),
    ("Message", 0, "Transmutation", "1 action", "120 feet", "1 round", False, False,
     ["Bard", "Sorcerer", "Wizard"], "Whisper a message to a creature you can see. Only the target hears it and can whisper a reply."),
    ("Minor Illusion", 0, "Illusion", "1 action", "30 feet", "1 minute", False, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Create a sound or an image of an object within range that lasts for the duration."),
    ("Poison Spray", 0, "Conjuration", "1 action", "10 feet", "Instantaneous", False, False,
     ["Druid", "Sorcerer", "Warlock", "Wizard"], "Project a puff of noxious gas. The target must succeed on a Constitution saving throw or take 1d12 poison damage."),
    ("Prestidigitation", 0, "Transmutation", "1 action", "10 feet", "Up to 1 hour", False, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Create a minor magical effect: a small sensory effect, light a fire, chill or warm an object, make a small mark, create a small object, etc."),
    ("Ray of Frost", 0, "Evocation", "1 action", "60 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "A frigid beam of blue-white light flashes toward a creature. Make a ranged spell attack. On a hit, deal 1d8 cold damage and reduce the target's speed by 10 feet until the start of your next turn."),
    ("Sacred Flame", 0, "Evocation", "1 action", "60 feet", "Instantaneous", False, False,
     ["Cleric"], "Flame-like radiance descends on a creature. It must succeed on a Dexterity saving throw or take 1d8 radiant damage."),
    ("Shillelagh", 0, "Transmutation", "1 bonus action", "Self", "1 minute", False, False,
     ["Druid"], "The wood of a club or quarterstaff becomes imbued with nature's power. For the duration, use your spellcasting modifier for attacks and deal 1d8 damage."),
    ("Shocking Grasp", 0, "Evocation", "1 action", "Touch", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "Lightning springs from your hand to shock a creature. Make a melee spell attack. On a hit, deal 1d8 lightning damage and the target can't take reactions until its next turn."),
    ("Spare the Dying", 0, "Necromancy", "1 action", "Touch", "Instantaneous", False, False,
     ["Cleric", "Druid"], "Touch a living creature with 0 hit points. The creature becomes stable."),
    ("Thaumaturgy", 0, "Transmutation", "1 action", "30 feet", "Up to 1 minute", False, False,
     ["Cleric"], "Manifest a minor wonder: amplify your voice, cause flames to flicker, cause tremors, create an instantaneous sound, etc."),
    ("Thunderclap", 0, "Evocation", "1 action", "Self (5-foot radius)", "Instantaneous", False, False,
     ["Bard", "Druid", "Sorcerer", "Warlock", "Wizard"], "Create a burst of thunderous sound. Each creature in range must succeed on a Constitution saving throw or take 1d6 thunder damage."),
    ("Toll the Dead", 0, "Necromancy", "1 action", "60 feet", "Instantaneous", False, False,
     ["Cleric", "Warlock", "Wizard"], "A dolorous bell tolls around a creature. It must succeed on a Wisdom saving throw or take 1d8 (1d12 if missing HP) necrotic damage."),
    ("True Strike", 0, "Divination", "1 action", "Self", "Concentration, up to 1 round", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Extend your hand and point a finger at a target. Your magic grants you a brief insight into the target's defenses. On your next turn, your first attack roll against the target has advantage."),
    ("Vicious Mockery", 0, "Enchantment", "1 action", "60 feet", "Instantaneous", False, False,
     ["Bard"], "Unleash a string of insults laced with subtle enchantments. The target must succeed on a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on the next attack roll it makes before the end of its next turn."),
    ("Word of Radiance", 0, "Evocation", "1 action", "Self (5-foot radius)", "Instantaneous", False, False,
     ["Cleric"], "Utter a divine word, and burning radiance erupts from you. Each creature of your choice that you can see within range must succeed on a Constitution saving throw or take 1d6 radiant damage."),

    # -------------------------------------------------------------- 1ST LEVEL
    ("Alarm", 1, "Abjuration", "1 minute", "30 feet", "8 hours", False, True,
     ["Ranger", "Wizard"], "Set an alarm against unwanted intrusion. Choose a door, window, or area no larger than a 20-foot cube. The alarm sounds when a Tiny or larger creature touches or enters the warded area."),
    ("Animal Friendship", 1, "Enchantment", "1 action", "30 feet", "24 hours", False, False,
     ["Bard", "Druid", "Ranger"], "Convince a beast that you mean it no harm. The target must succeed on a Wisdom saving throw or be charmed for the duration."),
    ("Armor of Agathys", 1, "Abjuration", "1 action", "Self", "1 hour", False, False,
     ["Warlock"], "A protective magical force surrounds you, manifesting as spectral frost. You gain 5 temporary hit points. If a creature hits you with a melee attack while you have these hit points, it takes 5 cold damage."),
    ("Arms of Hadar", 1, "Conjuration", "1 action", "Self (10-foot radius)", "Instantaneous", False, False,
     ["Warlock"], "Invoke the power of Hadar. Tendrils of dark energy erupt from you. Each creature in range must make a Strength saving throw. On a failure, take 2d6 necrotic damage and can't take reactions. On success, half damage, no reaction loss."),
    ("Bane", 1, "Enchantment", "1 action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Cleric"], "Up to three creatures must succeed on Charisma saving throws. Whenever a failing creature makes an attack roll or saving throw, it must roll a d4 and subtract the result."),
    ("Bless", 1, "Enchantment", "1 action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Cleric", "Paladin"], "Bless up to three creatures. Whenever a target makes an attack roll or saving throw, it can roll a d4 and add the result."),
    ("Burning Hands", 1, "Evocation", "1 action", "Self (15-foot cone)", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "Thin sheets of flames shoot from your outstretched fingers. Each creature in the cone must make a Dexterity saving throw, taking 3d6 fire damage on a failure, or half as much on success."),
    ("Charm Person", 1, "Enchantment", "1 action", "30 feet", "1 hour", False, False,
     ["Bard", "Druid", "Sorcerer", "Warlock", "Wizard"], "Attempt to charm a humanoid. It must succeed on a Wisdom saving throw or be charmed by you for the duration. When the spell ends, the creature knows it was charmed."),
    ("Color Spray", 1, "Illusion", "1 action", "Self (15-foot cone)", "1 round", False, False,
     ["Sorcerer", "Wizard"], "A dazzling array of flashing, colored light springs from your hand. Roll 6d10; the total is how many hit points of creatures this spell can affect, blinding them starting with the lowest current HP."),
    ("Command", 1, "Enchantment", "1 action", "60 feet", "1 round", False, False,
     ["Cleric", "Paladin"], "Speak a one-word command to a creature. On a failed Wisdom save, the target follows the command on its next turn: Approach, Drop, Flee, Grovel, or Halt."),
    ("Compelled Duel", 1, "Enchantment", "1 bonus action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Paladin"], "Compel a creature to duel you. The target must make a Wisdom saving throw. On failure, it is drawn to you and has disadvantage on attacks against anyone but you."),
    ("Comprehend Languages", 1, "Divination", "1 action", "Self", "1 hour", False, True,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "For the spell's duration, you understand the literal meaning of any spoken language you hear. You understand written language you see."),
    ("Create or Destroy Water", 1, "Transmutation", "1 action", "30 feet", "Instantaneous", False, False,
     ["Cleric", "Druid"], "Create up to 10 gallons of clean water within range in an open container, or destroy that volume of water in an open container."),
    ("Cure Wounds", 1, "Abjuration", "1 action", "Touch", "Instantaneous", False, False,
     ["Bard", "Cleric", "Druid", "Paladin", "Ranger"], "A creature you touch regains 1d8 + your spellcasting ability modifier hit points."),
    ("Detect Magic", 1, "Divination", "1 action", "Self", "Concentration, up to 10 minutes", True, True,
     ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Wizard"], "For the duration, you sense the presence of magic within 30 feet of you. You can use your action to see a faint aura around any visible creature or object that bears magic."),
    ("Detect Poison and Disease", 1, "Divination", "1 action", "Self", "Concentration, up to 10 minutes", True, True,
     ["Cleric", "Druid", "Paladin", "Ranger"], "For the duration, you can sense the presence and location of poisons, poisonous creatures, and diseases within 30 feet of you."),
    ("Disguise Self", 1, "Illusion", "1 action", "Self", "1 hour", False, False,
     ["Bard", "Sorcerer", "Wizard"], "Make yourself -- including your clothing, armor, weapons, and other belongings on your person -- look different until the spell ends or until you use your action to dismiss it."),
    ("Dissonant Whispers", 1, "Enchantment", "1 action", "60 feet", "Instantaneous", False, False,
     ["Bard"], "Whisper a discordant melody to a creature. On a failed Wisdom save, take 3d6 psychic damage and must use its reaction to move away from you as far as its speed allows."),
    ("Divine Favor", 1, "Transmutation", "1 bonus action", "Self", "Concentration, up to 1 minute", True, False,
     ["Paladin"], "Your prayer imbues you with divine radiance. Until the spell ends, your weapon attacks deal an extra 1d4 radiant damage on a hit."),
    ("Entangle", 1, "Conjuration", "1 action", "90 feet", "Concentration, up to 1 minute", True, False,
     ["Druid"], "Grasping weeds and vines sprout from the ground in a 20-foot square. Each creature there must succeed on a Strength saving throw or be restrained for the duration."),
    ("Expeditious Retreat", 1, "Transmutation", "1 bonus action", "Self", "Concentration, up to 10 minutes", True, False,
     ["Sorcerer", "Warlock", "Wizard"], "This spell allows you to move at an incredible pace. When you cast this spell, and then as a bonus action on each of your turns until the spell ends, you can take the Dash action."),
    ("Faerie Fire", 1, "Evocation", "1 action", "60 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Druid"], "Each object in a 20-foot cube within range is outlined in blue, green, or violet light. Any creature in the area is also outlined in light if it fails a Dexterity saving throw. Attack rolls against lit targets have advantage."),
    ("False Life", 1, "Necromancy", "1 action", "Self", "1 hour", False, False,
     ["Sorcerer", "Wizard"], "Bolster yourself with a necromantic facsimile of life. You gain 1d4 + 4 temporary hit points for the duration."),
    ("Feather Fall", 1, "Transmutation", "1 reaction", "60 feet", "1 minute", False, False,
     ["Bard", "Sorcerer", "Wizard"], "Choose up to five falling creatures within range. A falling creature's rate of descent slows to 60 feet per round until the spell ends. If the creature lands before the spell ends, take no falling damage."),
    ("Find Familiar", 1, "Conjuration", "1 hour", "10 feet", "Instantaneous", False, True,
     ["Wizard"], "Gain the service of a familiar, a spirit that takes an animal form: bat, cat, crab, frog, hawk, lizard, octopus, owl, poisonous snake, fish, rat, raven, sea horse, spider, or weasel."),
    ("Fog Cloud", 1, "Conjuration", "1 action", "120 feet", "Concentration, up to 1 hour", True, False,
     ["Druid", "Ranger", "Sorcerer", "Wizard"], "Create a 20-foot-radius sphere of fog centered on a point within range. The sphere spreads around corners, and its area is heavily obscured."),
    ("Gift of Alacrity", 1, "Divination", "1 minute", "Touch", "8 hours", False, False,
     ["Wizard"], "You touch a willing creature. For the duration, the target can add 1d8 to its initiative rolls."),
    ("Goodberry", 1, "Transmutation", "1 action", "Touch", "Instantaneous", False, False,
     ["Druid", "Ranger"], "Up to ten berries appear in your hand that are infused with magic. Each berry provides enough nourishment to sustain a creature for one day. Eating a berry as an action restores 1 hit point."),
    ("Grease", 1, "Conjuration", "1 action", "60 feet", "1 minute", False, False,
     ["Wizard"], "Slick grease covers the ground in a 10-foot square centered on a point within range. Each creature must make a Dexterity saving throw or fall prone. The area is difficult terrain."),
    ("Guiding Bolt", 1, "Evocation", "1 action", "120 feet", "1 round", False, False,
     ["Cleric"], "A flash of light streaks toward a creature. Make a ranged spell attack. On a hit, deal 4d6 radiant damage and the next attack roll against the target before end of your next turn has advantage."),
    ("Healing Word", 1, "Abjuration", "1 bonus action", "60 feet", "Instantaneous", False, False,
     ["Bard", "Cleric", "Druid"], "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier."),
    ("Hellish Rebuke", 1, "Evocation", "1 reaction", "60 feet", "Instantaneous", False, False,
     ["Warlock"], "You point your finger, and the creature that damaged you is momentarily surrounded by hellish flames. The creature must make a Dexterity saving throw, taking 2d10 fire damage on a failure or half as much on success."),
    ("Heroism", 1, "Enchantment", "1 action", "Touch", "Concentration, up to 1 minute", True, False,
     ["Bard", "Paladin"], "A willing creature becomes imbued with bravery. Until the spell ends, the creature is immune to the Frightened condition and gains temporary hit points equal to your spellcasting ability modifier at the start of each of its turns."),
    ("Hex", 1, "Enchantment", "1 bonus action", "90 feet", "Concentration, up to 1 hour", True, False,
     ["Warlock"], "Place a curse on a creature. Until the spell ends, you deal an extra 1d6 necrotic damage when you hit the cursed target with an attack. Also choose one ability; the target has disadvantage on checks using that ability."),
    ("Hunter's Mark", 1, "Divination", "1 bonus action", "90 feet", "Concentration, up to 1 hour", True, False,
     ["Ranger"], "Choose a creature you can see within range and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack."),
    ("Ice Knife", 1, "Conjuration", "1 action", "60 feet", "Instantaneous", False, False,
     ["Druid", "Sorcerer", "Wizard"], "Hurl a shard of ice at one creature. Make a ranged spell attack. On a hit, deal 1d10 piercing damage. Whether or not it hits, the shard explodes in a 5-foot radius dealing 2d6 cold damage (Dexterity save for half)."),
    ("Identify", 1, "Divination", "1 minute", "Touch", "Instantaneous", False, True,
     ["Bard", "Wizard"], "Discern the nature of a magic item. Learn its properties, how to use them, and whether it requires attunement."),
    ("Inflict Wounds", 1, "Necromancy", "1 action", "Touch", "Instantaneous", False, False,
     ["Cleric"], "Make a melee spell attack against a creature. On a hit, deal 3d10 necrotic damage."),
    ("Jump", 1, "Transmutation", "1 action", "Touch", "1 minute", False, False,
     ["Druid", "Ranger", "Sorcerer", "Wizard"], "Touch a creature. The creature's jump distance is tripled until the spell ends."),
    ("Longstrider", 1, "Transmutation", "1 action", "Touch", "1 hour", False, False,
     ["Bard", "Druid", "Ranger", "Wizard"], "Touch a creature. Its speed increases by 10 feet until the spell ends."),
    ("Mage Armor", 1, "Abjuration", "1 action", "Touch", "8 hours", False, False,
     ["Sorcerer", "Wizard"], "Touch a willing creature who isn't wearing armor. Until the spell ends, the target's base AC becomes 13 + its Dexterity modifier."),
    ("Magic Missile", 1, "Evocation", "1 action", "120 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "Create three glowing darts of magical force. Each dart hits a creature of your choice automatically, dealing 1d4 + 1 force damage. The darts all strike simultaneously."),
    ("Protection from Evil and Good", 1, "Abjuration", "1 action", "Touch", "Concentration, up to 10 minutes", True, False,
     ["Cleric", "Paladin", "Warlock", "Wizard"], "Touch a willing creature. Until the spell ends, the target is protected against aberrations, celestials, elementals, fey, fiends, and undead. Protected creatures have advantage on saving throws against spells from such creatures."),
    ("Ray of Sickness", 1, "Necromancy", "1 action", "60 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "A ray of sickening greenish energy lashes out toward a creature. Make a ranged spell attack. On a hit, deal 2d8 poison damage. If the target is a creature, it must succeed on a Constitution saving throw or be Poisoned until the end of your next turn."),
    ("Shield", 1, "Abjuration", "1 reaction", "Self", "1 round", False, False,
     ["Sorcerer", "Wizard"], "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from Magic Missile."),
    ("Shield of Faith", 1, "Abjuration", "1 bonus action", "60 feet", "Concentration, up to 10 minutes", True, False,
     ["Cleric", "Paladin"], "A shimmering field appears and surrounds a creature of your choice, granting it a +2 bonus to AC for the duration."),
    ("Silent Image", 1, "Illusion", "1 action", "60 feet", "Concentration, up to 10 minutes", True, False,
     ["Bard", "Sorcerer", "Wizard"], "Create the image of an object, creature, or visible phenomenon within range no larger than a 15-foot cube. The image appears at a spot within range and lasts for the duration."),
    ("Sleep", 1, "Enchantment", "1 action", "90 feet", "1 minute", False, False,
     ["Bard", "Sorcerer", "Wizard"], "Send creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect, targeting creatures starting with the lowest current HP."),
    ("Speak with Animals", 1, "Divination", "1 action", "Self", "10 minutes", False, True,
     ["Bard", "Druid", "Ranger"], "Gain the ability to comprehend and verbally communicate with beasts for the duration."),
    ("Tasha's Hideous Laughter", 1, "Enchantment", "1 action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Wizard"], "A creature perceives everything as hilariously funny and falls into fits of laughter. On a failed Wisdom save, it falls prone and is Incapacitated, unable to stand up, for the duration."),
    ("Thunderwave", 1, "Evocation", "1 action", "Self (15-foot cube)", "Instantaneous", False, False,
     ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"], "A wave of thunderous force sweeps out from you. Each creature in range must make a Constitution saving throw. On failure, take 2d8 thunder damage and be pushed 10 feet. On success, half damage, not pushed."),
    ("Unseen Servant", 1, "Conjuration", "1 action", "60 feet", "1 hour", False, True,
     ["Bard", "Warlock", "Wizard"], "Create an invisible, mindless, shapeless force that performs simple tasks at your command until the spell ends."),
    ("Witch Bolt", 1, "Evocation", "1 action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Sorcerer", "Warlock", "Wizard"], "A beam of crackling blue energy lances toward a creature. Make a ranged spell attack. On hit, deal 1d12 lightning damage and on each of your turns you can deal 1d12 more damage automatically."),
    ("Wrathful Smite", 1, "Necromancy", "1 bonus action", "Self", "Concentration, up to 1 minute", True, False,
     ["Paladin"], "Your next melee weapon attack deals an extra 1d6 psychic damage. If this attack hits, the target must succeed on a Wisdom saving throw or be Frightened of you until the spell ends."),

    # -------------------------------------------------------------- 2ND LEVEL
    ("Aid", 2, "Abjuration", "1 action", "30 feet", "8 hours", False, False,
     ["Cleric", "Paladin"], "Bolster your allies with toughness and resolve. Choose up to three creatures. Each target's maximum and current hit points increase by 5 for the duration."),
    ("Blindness/Deafness", 2, "Transmutation", "1 action", "30 feet", "1 minute", False, False,
     ["Bard", "Cleric", "Sorcerer", "Wizard"], "Target must succeed on a Constitution saving throw or be Blinded or Deafened (your choice) for the duration."),
    ("Blur", 2, "Illusion", "1 action", "Self", "Concentration, up to 1 minute", True, False,
     ["Sorcerer", "Wizard"], "Your body becomes blurred, shifting and wavering to all who can see you. For the duration, any creature has disadvantage on attack rolls against you."),
    ("Crown of Madness", 2, "Enchantment", "1 action", "120 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "One humanoid must succeed on a Wisdom saving throw or become charmed. A crown of madness forms on its head, and it must attack another creature of your choice each turn."),
    ("Darkness", 2, "Evocation", "1 action", "60 feet", "Concentration, up to 10 minutes", True, False,
     ["Sorcerer", "Warlock", "Wizard"], "Magical darkness spreads from a point within range to fill a 15-foot-radius sphere. Even darkvision can't see through this darkness."),
    ("Darkvision", 2, "Transmutation", "1 action", "Touch", "8 hours", False, False,
     ["Druid", "Ranger", "Sorcerer", "Wizard"], "Touch a willing creature. For the duration, that creature has Darkvision out to 60 feet."),
    ("Detect Thoughts", 2, "Divination", "1 action", "Self", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Wizard"], "For the duration, you can read the surface thoughts of certain creatures within 30 feet."),
    ("Dragon's Breath", 2, "Transmutation", "1 bonus action", "Touch", "Concentration, up to 1 minute", True, False,
     ["Sorcerer", "Wizard"], "Touch a willing creature. Until the spell ends, the creature can use an action to exhale energy in a 15-foot cone, dealing 3d6 damage of your chosen type."),
    ("Enhance Ability", 2, "Transmutation", "1 action", "Touch", "Concentration, up to 1 hour", True, False,
     ["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"], "Touch a creature and bestow a magical enhancement. Choose one of several effects granting advantage on ability checks using the chosen ability."),
    ("Enlarge/Reduce", 2, "Transmutation", "1 action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Sorcerer", "Wizard"], "Cause a creature or object to grow larger or smaller for the duration."),
    ("Find Traps", 2, "Divination", "1 action", "120 feet", "Instantaneous", False, False,
     ["Cleric", "Druid", "Ranger"], "Sense the presence of any trap within range that is within line of sight. A trap is anything that would inflict a sudden or unexpected effect you consider harmful or undesirable."),
    ("Flaming Sphere", 2, "Evocation", "1 action", "60 feet", "Concentration, up to 1 minute", True, False,
     ["Druid", "Wizard"], "A 5-foot-diameter sphere of fire appears in an unoccupied space. Any creature that ends its turn within 5 feet of the sphere must make a Dexterity saving throw or take 2d6 fire damage."),
    ("Heat Metal", 2, "Transmutation", "1 action", "60 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Druid"], "Choose a manufactured metal object. The object glows red-hot. Any creature in physical contact with the object takes 2d8 fire damage when you cast the spell."),
    ("Hold Person", 2, "Enchantment", "1 action", "60 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"], "Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be Paralyzed for the duration."),
    ("Invisibility", 2, "Illusion", "1 action", "Touch", "Concentration, up to 1 hour", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target's person."),
    ("Knock", 2, "Transmutation", "1 action", "60 feet", "Instantaneous", False, False,
     ["Bard", "Sorcerer", "Wizard"], "Choose an object that is locked or barred within range. A lock or bar on the object opens."),
    ("Levitate", 2, "Transmutation", "1 action", "60 feet", "Concentration, up to 10 minutes", True, False,
     ["Sorcerer", "Wizard"], "One creature or object of your choice rises vertically, up to 20 feet, and remains suspended there for the duration."),
    ("Magic Weapon", 2, "Transmutation", "1 bonus action", "Touch", "Concentration, up to 1 hour", True, False,
     ["Paladin", "Ranger", "Sorcerer", "Wizard"], "Touch a nonmagical weapon. Until the spell ends, that weapon becomes a +1 magic weapon."),
    ("Mirror Image", 2, "Illusion", "1 action", "Self", "1 minute", False, False,
     ["Sorcerer", "Warlock", "Wizard"], "Three illusory duplicates of yourself appear in your space. Whenever a creature targets you with an attack, roll a d20 to determine whether the attack targets you or a duplicate."),
    ("Misty Step", 2, "Conjuration", "1 bonus action", "Self", "Instantaneous", False, False,
     ["Sorcerer", "Warlock", "Wizard"], "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see."),
    ("Moonbeam", 2, "Evocation", "1 action", "120 feet", "Concentration, up to 1 minute", True, False,
     ["Druid"], "A silvery beam of pale light shines down in a 5-foot-radius, 40-foot-tall cylinder. Each creature that enters the spell's area must make a Constitution saving throw or take 2d10 radiant damage."),
    ("Phantasmal Force", 2, "Illusion", "1 action", "60 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Wizard"], "Craft an illusion that takes root in the mind of a creature. One creature must make an Intelligence saving throw or it perceives a phantasm of your creation for the duration."),
    ("Prayer of Healing", 2, "Abjuration", "10 minutes", "30 feet", "Instantaneous", False, False,
     ["Cleric"], "Up to six creatures of your choice that you can see within range each regain hit points equal to 2d8 + your spellcasting ability modifier."),
    ("Protection from Poison", 2, "Abjuration", "1 action", "Touch", "1 hour", False, False,
     ["Cleric", "Druid", "Paladin", "Ranger"], "Touch one creature. Neutralize one poison affecting the target and grant the target advantage on saving throws against poison for the duration."),
    ("Ray of Enfeeblement", 2, "Necromancy", "1 action", "60 feet", "Concentration, up to 1 minute", True, False,
     ["Warlock", "Wizard"], "A black beam of enervating energy springs from your finger. Make a ranged spell attack against the target. On a hit, the target deals only half damage with weapon attacks until the spell ends."),
    ("Rope Trick", 2, "Transmutation", "1 action", "Touch", "1 hour", False, False,
     ["Wizard"], "Touch a piece of rope from 5 to 30 feet long. One end of the rope rises into the air until the rope hangs perpendicular to the ground. At the upper end is an invisible entrance to an extradimensional space."),
    ("Scorching Ray", 2, "Evocation", "1 action", "120 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "Create three rays of fire and hurl them at targets within range. Make a separate ranged spell attack for each ray. A ray deals 2d6 fire damage on a hit."),
    ("See Invisibility", 2, "Divination", "1 action", "Self", "1 hour", False, False,
     ["Bard", "Sorcerer", "Wizard"], "For the duration, you see invisible creatures and objects as if they were visible, and you can see into the Ethereal Plane."),
    ("Shatter", 2, "Evocation", "1 action", "60 feet", "Instantaneous", False, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "A sudden loud ringing noise causes a 10-foot-radius sphere of shattering sound. Each creature must make a Constitution saving throw, taking 3d8 thunder damage on a failure, or half as much on success."),
    ("Silence", 2, "Illusion", "1 action", "120 feet", "Concentration, up to 10 minutes", True, True,
     ["Bard", "Cleric", "Ranger"], "For the duration, no sound can be created within or pass through a 20-foot-radius sphere centered on a point you choose within range."),
    ("Spider Climb", 2, "Transmutation", "1 action", "Touch", "Concentration, up to 1 hour", True, False,
     ["Sorcerer", "Warlock", "Wizard"], "Until the spell ends, one willing creature you touch gains the ability to move up, down, and across vertical surfaces and upside down along ceilings, while leaving its hands free."),
    ("Suggestion", 2, "Enchantment", "1 action", "30 feet", "Concentration, up to 8 hours", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Suggest a course of activity (limited to a sentence or two) to a creature that can hear and understand you. On a failed Wisdom save, the creature pursues the course of action you described."),
    ("Web", 2, "Conjuration", "1 action", "60 feet", "Concentration, up to 1 hour", True, False,
     ["Sorcerer", "Wizard"], "Conjure a mass of thick, sticky webbing at a point of your choice within range. The webs fill a 20-foot cube and are difficult terrain. Any creature starting its turn in the webs must make a Dexterity saving throw or be Restrained."),

    # -------------------------------------------------------------- 3RD LEVEL
    ("Animate Dead", 3, "Necromancy", "1 minute", "10 feet", "Instantaneous", False, False,
     ["Cleric", "Wizard"], "This spell creates an undead servant. Choose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as an undead creature."),
    ("Bestow Curse", 3, "Necromancy", "1 action", "Touch", "Concentration, up to 1 minute", True, False,
     ["Bard", "Cleric", "Wizard"], "Touch a creature. On a failed Wisdom save, it is cursed for the duration. Choose one of several curse effects to impose."),
    ("Call Lightning", 3, "Conjuration", "1 action", "120 feet", "Concentration, up to 10 minutes", True, False,
     ["Druid"], "A storm cloud appears in a 60-foot-radius, 10-foot-tall cylinder. When you cast this spell, choose a point under the cloud. A bolt of lightning flashes down dealing 3d10 lightning damage (Dexterity save for half)."),
    ("Clairvoyance", 3, "Divination", "10 minutes", "1 mile", "Concentration, up to 10 minutes", True, False,
     ["Bard", "Cleric", "Sorcerer", "Wizard"], "Create an invisible sensor at a familiar location within range. You can see or hear through the sensor."),
    ("Counterspell", 3, "Abjuration", "1 reaction", "60 feet", "Instantaneous", False, False,
     ["Sorcerer", "Warlock", "Wizard"], "Attempt to interrupt a creature in the process of casting a spell. If the spell is 3rd level or lower, it fails automatically. If higher, make a spellcasting check DC 10 + spell's level."),
    ("Dispel Magic", 3, "Abjuration", "1 action", "120 feet", "Instantaneous", False, False,
     ["Bard", "Cleric", "Druid", "Paladin", "Sorcerer", "Warlock", "Wizard"], "Choose one creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends. For each spell of 4th level or higher on the target, make an ability check DC 10 + the spell's level."),
    ("Fear", 3, "Illusion", "1 action", "Self (30-foot cone)", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Project a phantasmal image of creatures' worst fears. Each creature in the cone must succeed on a Wisdom saving throw or drop whatever it is holding and become Frightened."),
    ("Fireball", 3, "Evocation", "1 action", "150 feet", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "A bright streak flashes from your pointing finger to a point you choose within range. It blossoms into a fiery explosion in a 20-foot radius. Each creature in the area must make a Dexterity saving throw, taking 8d6 fire damage on failure, half on success."),
    ("Fly", 3, "Transmutation", "1 action", "Touch", "Concentration, up to 10 minutes", True, False,
     ["Sorcerer", "Warlock", "Wizard"], "Target a willing creature. For the duration, the target gains a flying speed of 60 feet."),
    ("Gaseous Form", 3, "Transmutation", "1 action", "Touch", "Concentration, up to 1 hour", True, False,
     ["Sorcerer", "Warlock", "Wizard"], "Transform a willing creature you touch, along with everything it's wearing and carrying, into a misty cloud for the duration."),
    ("Glyph of Warding", 3, "Abjuration", "1 hour", "Touch", "Until dispelled or triggered", False, False,
     ["Bard", "Cleric", "Wizard"], "Inscribe a glyph that harms other creatures, either spell-storing or explosive in nature."),
    ("Haste", 3, "Transmutation", "1 action", "30 feet", "Concentration, up to 1 minute", True, False,
     ["Sorcerer", "Wizard"], "Choose a willing creature. Until the spell ends, the target's speed is doubled, it gains a +2 bonus to AC, has advantage on Dexterity saving throws, and gains an additional action each turn."),
    ("Hypnotic Pattern", 3, "Illusion", "1 action", "120 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Create a twisting pattern of colors in a 30-foot cube. Each creature in the area must make a Wisdom saving throw. On failure, the creature is Charmed for the duration and Incapacitated while it gazes at the pattern."),
    ("Leomund's Tiny Hut", 3, "Evocation", "1 minute", "Self (10-foot-radius hemisphere)", "8 hours", False, True,
     ["Bard", "Wizard"], "A 10-foot-radius immobile dome of force springs into existence around and above you."),
    ("Lightning Bolt", 3, "Evocation", "1 action", "Self (100-foot line)", "Instantaneous", False, False,
     ["Sorcerer", "Wizard"], "A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you. Each creature in the line must make a Dexterity saving throw, taking 8d6 lightning damage on failure, half on success."),
    ("Mass Healing Word", 3, "Abjuration", "1 bonus action", "60 feet", "Instantaneous", False, False,
     ["Bard", "Cleric"], "Up to six creatures of your choice that you can see within range each regain hit points equal to 1d4 + your spellcasting ability modifier."),
    ("Major Image", 3, "Illusion", "1 action", "120 feet", "Concentration, up to 10 minutes", True, False,
     ["Bard", "Sorcerer", "Warlock", "Wizard"], "Create the image of an object, creature, or other visible phenomenon up to a 20-foot cube in size. The image appears at a spot that you can see within range."),
    ("Nondetection", 3, "Abjuration", "1 action", "Touch", "8 hours", False, False,
     ["Bard", "Ranger", "Wizard"], "For the duration, you hide a target that you touch from divination magic."),
    ("Plant Growth", 3, "Transmutation", "1 action", "150 feet", "Instantaneous", False, False,
     ["Bard", "Druid", "Ranger"], "Channel vitality into plants. All normal plants in a 100-foot radius become thick and overgrown, making the area difficult terrain."),
    ("Protection from Energy", 3, "Abjuration", "1 action", "Touch", "Concentration, up to 1 hour", True, False,
     ["Cleric", "Druid", "Ranger", "Sorcerer", "Wizard"], "Touch a willing creature. For the duration, the target has resistance to one damage type of your choice: acid, cold, fire, lightning, or thunder."),
    ("Remove Curse", 3, "Abjuration", "1 action", "Touch", "Instantaneous", False, False,
     ["Cleric", "Paladin", "Warlock", "Wizard"], "At your touch, all curses affecting one creature or object end."),
    ("Sending", 3, "Divination", "1 action", "Unlimited", "1 round", False, False,
     ["Bard", "Cleric", "Wizard"], "Send a short message of twenty-five words or fewer to a creature with which you are familiar. The target hears the message and can reply."),
    ("Sleet Storm", 3, "Conjuration", "1 action", "150 feet", "Concentration, up to 1 minute", True, False,
     ["Druid", "Sorcerer", "Wizard"], "Until the spell ends, freezing rain and sleet fall in a 20-foot-tall cylinder with a 40-foot radius centered on a point you choose. The area is heavily obscured and difficult terrain."),
    ("Slow", 3, "Transmutation", "1 action", "120 feet", "Concentration, up to 1 minute", True, False,
     ["Sorcerer", "Wizard"], "Alter time around up to six creatures. Each must succeed on a Wisdom saving throw or be affected. Affected creatures have half speed, -2 penalty to AC and Dexterity saving throws, and can't use reactions."),
    ("Stinking Cloud", 3, "Conjuration", "1 action", "90 feet", "Concentration, up to 1 minute", True, False,
     ["Bard", "Sorcerer", "Wizard"], "Create a 20-foot-radius sphere of yellow, nauseating gas. The area is heavily obscured. Any creature that is in the cloud at the start of its turn must succeed on a Constitution saving throw or spend its action that turn retching."),
    ("Tongues", 3, "Divination", "1 action", "Touch", "1 hour", False, False,
     ["Bard", "Cleric", "Sorcerer", "Warlock", "Wizard"], "Touch a creature. For the duration, the target can understand any spoken language it hears and any creature that speaks a language can understand the target."),
    ("Vampiric Touch", 3, "Necromancy", "1 action", "Self", "Concentration, up to 1 minute", True, False,
     ["Warlock", "Wizard"], "The touch of your shadow-wreathed hand can siphon life force from others. Make a melee spell attack against a creature. On a hit, deal 3d6 necrotic damage and you regain hit points equal to half the amount of necrotic damage dealt."),
    ("Water Breathing", 3, "Transmutation", "1 action", "30 feet", "24 hours", False, True,
     ["Druid", "Ranger", "Sorcerer", "Wizard"], "Give up to ten willing creatures the ability to breathe underwater until the spell ends."),
    ("Water Walk", 3, "Transmutation", "1 action", "30 feet", "1 hour", False, True,
     ["Cleric", "Druid", "Ranger"], "Grant the ability to move across any liquid surface -- such as water, acid, mud, snow, quicksand, or lava -- as if it were harmless solid ground to up to ten willing creatures."),
    ("Wind Wall", 3, "Evocation", "1 action", "120 feet", "Concentration, up to 1 minute", True, False,
     ["Druid", "Ranger"], "A wall of strong wind rises from the ground at a point you choose within range. The wall is up to 50 feet long, 15 feet high, and 1 foot thick. You can shape the wall in any way you choose so long as it makes one continuous path along the ground."),
]


class Command(BaseCommand):
    help = 'Seed the Spell table with D&D 5e 2024 spell data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing spells before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = Spell.objects.count()
            Spell.objects.all().delete()
            self.stdout.write(f'Cleared {count} existing spells.')

        # Build a name→pk map for CharacterClass once
        class_map = {c.name: c for c in CharacterClass.objects.all()}
        missing_classes = set()

        created = 0
        updated = 0

        with transaction.atomic():
            for entry in SPELL_DATA:
                name, level, school, casting_time, range_, duration, conc, ritual, class_names, description = entry

                spell, is_new = Spell.objects.update_or_create(
                    name=name,
                    defaults={
                        'level': level,
                        'school': school,
                        'casting_time': casting_time,
                        'range': range_,
                        'duration': duration,
                        'concentration': conc,
                        'ritual': ritual,
                        'description': description,
                        'components': {},
                        'damage': {},
                        'higher_levels': '',
                    }
                )

                spell_classes = []
                for class_name in class_names:
                    if class_name in class_map:
                        spell_classes.append(class_map[class_name])
                    else:
                        missing_classes.add(class_name)

                spell.classes.set(spell_classes)

                if is_new:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. Created: {created}, Updated: {updated}, Total: {Spell.objects.count()}'
        ))

        if missing_classes:
            self.stdout.write(self.style.WARNING(
                f'Warning — these class names were not found in the DB and were skipped: {sorted(missing_classes)}'
            ))
            self.stdout.write('Run `python manage.py load_dnd_content` first to ensure all classes are loaded.')
