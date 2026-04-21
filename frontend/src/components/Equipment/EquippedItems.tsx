import React from 'react';
import { Character } from '../../types';
import styles from './EquippedItems.module.css';

interface EquippedItemsProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onEquipItem?: (equipmentId: string, slot?: string) => void;
  onUnequipItem?: (slot: string) => void;
}

interface EquipmentSlot {
  id: string;
  name: string;
  icon: string;
  description: string;
  acceptsTypes: string[];
}

const EquippedItems: React.FC<EquippedItemsProps> = ({
  character,
  onUnequipItem
}) => {
  const equipmentSlots: EquipmentSlot[] = [
    { id: 'head', name: 'Head', icon: '🎩', description: 'Helmets, hats, circlets', acceptsTypes: ['helmet', 'hat', 'circlet'] },
    { id: 'neck', name: 'Neck', icon: '📿', description: 'Amulets, necklaces', acceptsTypes: ['amulet', 'necklace'] },
    { id: 'armor', name: 'Armor', icon: '🛡️', description: 'Body armor', acceptsTypes: ['armor'] },
    { id: 'cloak', name: 'Cloak', icon: '🧥', description: 'Cloaks, capes', acceptsTypes: ['cloak', 'cape'] },
    { id: 'main_hand', name: 'Main Hand', icon: '⚔️', description: 'Primary weapon', acceptsTypes: ['weapon', 'melee_weapon', 'ranged_weapon'] },
    { id: 'off_hand', name: 'Off Hand', icon: '🛡️', description: 'Shield or off-hand weapon', acceptsTypes: ['shield', 'weapon'] },
    { id: 'hands', name: 'Hands', icon: '🧤', description: 'Gloves, gauntlets', acceptsTypes: ['gloves', 'gauntlets'] },
    { id: 'belt', name: 'Belt', icon: '📜', description: 'Belts, girdles', acceptsTypes: ['belt', 'girdle'] },
    { id: 'ring_1', name: 'Ring 1', icon: '💍', description: 'Rings (left hand)', acceptsTypes: ['ring'] },
    { id: 'ring_2', name: 'Ring 2', icon: '💍', description: 'Rings (right hand)', acceptsTypes: ['ring'] },
    { id: 'feet', name: 'Feet', icon: '👢', description: 'Boots, shoes', acceptsTypes: ['boots', 'shoes'] },
    { id: 'wrists', name: 'Wrists', icon: '📿', description: 'Bracers, bracelets', acceptsTypes: ['bracers', 'bracelets'] },
  ];

  const getEquippedItem = (slotId: string) => {
    const equippedDetails = character.equipped_items_details || {};
    return equippedDetails[slotId] || null;
  };

  const handleUnequipItem = (slot: string) => {
    if (onUnequipItem) {
      onUnequipItem(slot);
    }
  };

  const getSlotStatus = (slot: EquipmentSlot) => {
    const equippedItem = getEquippedItem(slot.id);
    if (equippedItem) {
      return 'equipped';
    }
    return 'empty';
  };

  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    const equippedItem = getEquippedItem(slot.id);
    const status = getSlotStatus(slot);

    return (
      <div
        key={slot.id}
        className={[styles['equipment-slot'], styles[status] || ''].filter(Boolean).join(' ')}
        title={slot.description}
      >
        <div className={styles['slot-header']}>
          <span className={styles['slot-icon']}>{slot.icon}</span>
          <span className={styles['slot-name']}>{slot.name}</span>
        </div>
        
        <div className={styles['slot-content']}>
          {equippedItem ? (
            <div className={styles['equipped-item']}>
              <div className={styles['item-info']}>
                <div className={styles['item-name']}>{equippedItem.equipment.name}</div>
                <div className={styles['item-type']}>{equippedItem.equipment.equipment_type}</div>
                {equippedItem.equipment.armor_class && (
                  <div className={styles['item-ac']}>AC {equippedItem.equipment.armor_class}</div>
                )}
                {equippedItem.equipment.damage && (
                  <div className={styles['item-damage']}>
                    {Object.entries(equippedItem.equipment.damage).map(([dtype, value]) => (
                      <span key={dtype}>{value} {dtype}</span>
                    )).join(', ')}
                  </div>
                )}
              </div>
              
              <div className={styles['item-actions']}>
                <button
                  onClick={() => handleUnequipItem(slot.id)}
                  className={styles['unequip-btn']}
                  title="Unequip item"
                >
                  ✖️
                </button>
              </div>
            </div>
          ) : (
            <div className={styles['empty-slot']}>
              <span className={styles['empty-text']}>Empty</span>
              <span className={styles['slot-types']}>
                {slot.acceptsTypes.slice(0, 2).join(', ')}
                {slot.acceptsTypes.length > 2 && '...'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const calculateTotalArmorClass = () => {
    return character.calculated_armor_class || character.armor_class || 10;
  };

  const getArmorClassBreakdown = () => {
    const baseAC = 10;
    const dexMod = character.dexterity_modifier || 0;
    const armorItem = getEquippedItem('armor');
    const shieldItem = getEquippedItem('shield');
    
    let breakdown = [`Base: ${baseAC}`];
    
    if (armorItem && armorItem.equipment.armor_class) {
      const armorAC = armorItem.equipment.armor_class;
      const maxDexBonus = armorItem.equipment.dex_bonus_max;
      const effectiveDexMod = maxDexBonus !== undefined ? Math.min(dexMod, maxDexBonus) : dexMod;
      
      breakdown = [`${armorItem.equipment.name}: ${armorAC}`];
      if (effectiveDexMod !== 0) {
        breakdown.push(`Dex: ${effectiveDexMod > 0 ? '+' : ''}${effectiveDexMod}`);
      }
    } else {
      breakdown.push(`Dex: ${dexMod > 0 ? '+' : ''}${dexMod}`);
    }
    
    if (shieldItem && shieldItem.equipment.armor_class) {
      breakdown.push(`${shieldItem.equipment.name}: +${shieldItem.equipment.armor_class}`);
    }
    
    return breakdown.join(', ');
  };

  const getEquippedItemsCount = () => {
    return Object.keys(character.equipped_items_details || {}).length;
  };

  return (
    <div className={styles['equipped-items-container']}>
      <div className={styles['equipped-items-header']}>
        <h3>Equipped Items</h3>
        <div className={styles['equipped-summary']}>
          <span className={styles['equipped-count']}>
            {getEquippedItemsCount()} / {equipmentSlots.length} slots
          </span>
          <div className={styles['armor-class-display']}>
            <span className={styles['ac-value']}>AC {calculateTotalArmorClass()}</span>
            <span className={styles['ac-breakdown']} title={getArmorClassBreakdown()}>
              ℹ️
            </span>
          </div>
        </div>
      </div>

      <div className={styles['equipment-slots-grid']}>
        {equipmentSlots.map(renderEquipmentSlot)}
      </div>

      <div className={styles['equipment-effects']}>
        <h4>Active Effects</h4>
        <div className={styles['effects-list']}>
          {getEquippedItemsCount() === 0 ? (
            <div className={styles['no-effects']}>
              No equipped items providing bonuses
            </div>
          ) : (
            <div className={styles['effects-summary']}>
              <div className={styles['effect-item']}>
                <span className={styles['effect-label']}>Armor Class</span>
                <span className={styles['effect-value']}>{calculateTotalArmorClass()}</span>
              </div>
              {character.encumbrance_status !== 'normal' && (
                <div className="effect-item warning">
                  <span className={styles['effect-label']}>Encumbrance</span>
                  <span className={styles['effect-value']}>
                    {character.encumbrance_status?.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquippedItems;