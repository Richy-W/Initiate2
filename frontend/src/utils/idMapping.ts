/**
 * ID Mappings for Character Creation
 * Maps content string IDs to numeric database primary keys
 */

// Species name to database ID mapping
export const SPECIES_NAME_TO_ID: Record<string, number> = {
  'Human': 1,
  'Elf': 2,
  'Dwarf': 3,
  'Halfling': 4,
  'Dragonborn': 5,
  'Gnome': 6,
  'Goliath': 7,
  'Orc': 8,
  'Tiefling': 9,
};

// Character Class name to database ID mapping
export const CLASS_NAME_TO_ID: Record<string, number> = {
  'Barbarian': 1,
  'Bard': 2,
  'Cleric': 3,
  'Druid': 4,
  'Fighter': 5,
  'Monk': 6,
  'Paladin': 7,
  'Ranger': 8,
  'Rogue': 9,
  'Sorcerer': 10,
  'Warlock': 11,
  'Wizard': 12,
};

// Background name to database ID mapping
export const BACKGROUND_NAME_TO_ID: Record<string, number> = {
  'Acolyte': 1,
  'Criminal': 2,
  'Sage': 3,
  'Soldier': 4,
  'Folk Hero': 5,
};

/**
 * Enhanced content objects with numeric IDs
 */
export interface EnhancedContentItem {
  pk: number;
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Add numeric primary key to content objects
 */
export function enhanceContentWithPk(items: any[], type: 'species' | 'class' | 'background'): EnhancedContentItem[] {
  const mapping = type === 'species' ? SPECIES_NAME_TO_ID 
                : type === 'class' ? CLASS_NAME_TO_ID 
                : BACKGROUND_NAME_TO_ID;

  return items.map(item => ({
    ...item,
    pk: mapping[item.name] || 0, // Add numeric primary key based on name
  }));
}