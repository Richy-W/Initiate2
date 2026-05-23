"""Script to clean up the duplicate content in test_spell_slots.py"""
import re

filepath = 'apps/characters/tests/test_spell_slots.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Original length: {len(content)}")

# Find the FIRST complete end of RestEndpointSlotsRestoredTests
# The class is complete when we see the last assertEqual(slot.used, 0) followed by a newline
# and then the duplicate content starts

# Find all occurrences of this ending pattern
pattern = r"        self\.assertEqual\(slot\.used, 0\)\n"
matches = list(re.finditer(pattern, content))
print(f"Found {len(matches)} occurrences of assertEqual(slot.used, 0)")
for m in matches:
    print(f"  At position {m.start()}")

if len(matches) >= 1:
    # Keep content up to and including the first occurrence
    cut_pos = matches[0].end()
    clean = content[:cut_pos]
    print(f"Cutting at position {cut_pos}")
    print(f"New length: {len(clean)}")
    print("Last 100 chars:", repr(clean[-100:]))
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(clean)
    print("File written.")
else:
    print("Pattern not found!")
