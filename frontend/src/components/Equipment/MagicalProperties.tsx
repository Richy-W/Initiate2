import React from 'react';
import { Equipment } from '../../types';
import styles from './MagicalProperties.module.css';

interface MagicalPropertiesProps {
  equipment: Equipment;
  className?: string;
  showTitle?: boolean;
}

interface MagicalProperty {
  name: string;
  description: string;
  type: 'passive' | 'active' | 'charges' | 'cursed' | 'legendary';
  charges?: {
    current: number;
    max: number;
    rechargeType: 'daily' | 'short_rest' | 'long_rest' | 'none';
  };
}

const MagicalProperties: React.FC<MagicalPropertiesProps> = ({
  equipment,
  className = '',
  showTitle = true
}) => {
  const isMagical = () => {
    if (!equipment.rarity) return false;
    return ['uncommon', 'rare', 'very_rare', 'legendary', 'artifact'].includes(equipment.rarity.toLowerCase());
  };

  const getRarityColor = (rarity: string) => {
    const rarityColors = {
      'common': '#6c757d',
      'uncommon': '#28a745',
      'rare': '#007bff',
      'very_rare': '#8e44ad',
      'legendary': '#fd7e14',
      'artifact': '#e83e8c'
    };
    return rarityColors[rarity.toLowerCase() as keyof typeof rarityColors] || '#6c757d';
  };

  const parsePropertiesFromDescription = (): MagicalProperty[] => {
    // In a real implementation, this would parse properties from the equipment description
    // or have dedicated fields for magical properties. For now, we'll create mock properties
    // based on equipment type and rarity.
    
    const properties: MagicalProperty[] = [];
    
    if (!isMagical()) return properties;

    // Add mock magical properties based on equipment type
    if (equipment.equipment_type === 'weapon' || equipment.equipment_type?.includes('weapon')) {
      properties.push({
        name: 'Magical Weapon',
        description: 'This weapon is imbued with magical energy. Attacks with this weapon count as magical for overcoming resistance.',
        type: 'passive'
      });

      if (equipment.rarity === 'rare' || equipment.rarity === 'very_rare') {
        properties.push({
          name: 'Enhanced Damage',
          description: 'This weapon deals additional magical damage on hit.',
          type: 'passive'
        });
      }

      if (equipment.rarity === 'legendary') {
        properties.push({
          name: 'Legendary Power',
          description: 'Once per day, you can channel the weapon\'s legendary power for a devastating attack.',
          type: 'charges',
          charges: { current: 1, max: 1, rechargeType: 'daily' }
        });
      }
    }

    if (equipment.equipment_type === 'armor') {
      properties.push({
        name: 'Magical Protection',
        description: 'This armor provides enhanced magical protection against spells and magical effects.',
        type: 'passive'
      });

      if (equipment.rarity === 'rare' || equipment.rarity === 'very_rare') {
        properties.push({
          name: 'Resistance',
          description: 'While wearing this armor, you have resistance to one damage type.',
          type: 'passive'
        });
      }
    }

    if (equipment.equipment_type === 'shield') {
      properties.push({
        name: 'Arcane Shield',
        description: 'This shield can deflect magical attacks. You gain a bonus to saving throws against spells.',
        type: 'passive'
      });
    }

    // Add generic magical item properties
    if (equipment.rarity === 'artifact') {
      properties.push({
        name: 'Ancient Power',
        description: 'This artifact holds immense power that can reshape reality itself.',
        type: 'legendary'
      });
      
      properties.push({
        name: 'Curse of Power',
        description: 'The artifact\'s power comes with a terrible curse that affects the wielder.',
        type: 'cursed'
      });
    }

    return properties;
  };

  const getPropertyIcon = (type: MagicalProperty['type']) => {
    const icons = {
      'passive': '🔮',
      'active': '⚡',
      'charges': '🌟',
      'cursed': '💀',
      'legendary': '👑'
    };
    return icons[type] || '✨';
  };

  const getPropertyColor = (type: MagicalProperty['type']) => {
    const colors = {
      'passive': '#28a745',
      'active': '#007bff',
      'charges': '#fd7e14',
      'cursed': '#dc3545',
      'legendary': '#8e44ad'
    };
    return colors[type] || '#6c757d';
  };

  const properties = parsePropertiesFromDescription();

  if (!isMagical() || properties.length === 0) {
    return (
      <div className={[styles['magical-properties'], styles['empty'], className].filter(Boolean).join(' ')}>
        <div className={styles['no-magic-message']}>
          <span className={styles['no-magic-icon']}>⚫</span>
          <span>Non-magical item</span>
        </div>
      </div>
    );
  }

  return (
    <div className={[styles['magical-properties'], className].filter(Boolean).join(' ')}>
      {showTitle && (
        <div className={styles['magical-properties-header']}>
          <h4 className={styles['properties-title']}>
            <span className={styles['magic-icon']}>✨</span>
            Magical Properties
          </h4>
          <div 
            className={styles['rarity-badge']}
            style={{ 
              backgroundColor: getRarityColor(equipment.rarity || 'common'),
              color: 'white'
            }}
          >
            {equipment.rarity?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
      )}

      <div className={styles['properties-list']}>
        {properties.map((property, index) => (
          <div 
            key={index}
            className={[styles['property-item'], styles[property.type] || ''].filter(Boolean).join(' ')}
            style={{ borderLeftColor: getPropertyColor(property.type) }}
          >
            <div className={styles['property-header']}>
              <span className={styles['property-icon']}>
                {getPropertyIcon(property.type)}
              </span>
              <span className={styles['property-name']}>{property.name}</span>
              {property.charges && (
                <div className={styles['property-charges']}>
                  <span className={styles['charges-display']}>
                    {property.charges.current}/{property.charges.max}
                  </span>
                  <span className={styles['recharge-type']}>
                    {property.charges.rechargeType.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
            <div className={styles['property-description']}>
              {property.description}
            </div>
          </div>
        ))}
      </div>

      {equipment.rarity === 'legendary' || equipment.rarity === 'artifact' && (
        <div className={styles['legendary-notice']}>
          <span className={styles['legendary-icon']}>⚠️</span>
          <span className={styles['legendary-text']}>
            This item may have additional properties revealed through attunement or use.
          </span>
        </div>
      )}

      <div className={styles['attunement-notice']}>
        <span className={styles['attunement-icon']}>🔗</span>
        <span className={styles['attunement-text']}>
          Requires attunement by {getAttunementRequirement()}
        </span>
      </div>
    </div>
  );

  function getAttunementRequirement(): string {
    const rarity = equipment.rarity?.toLowerCase();
    
    if (rarity === 'artifact') {
      return 'a creature of legendary power';
    }
    
    if (rarity === 'legendary') {
      return 'a spellcaster';
    }
    
    if (equipment.equipment_type?.includes('weapon')) {
      return 'a creature proficient with this weapon type';
    }
    
    if (equipment.equipment_type === 'armor') {
      return 'a creature proficient with armor';
    }
    
    return 'any creature';
  }
};

export default MagicalProperties;