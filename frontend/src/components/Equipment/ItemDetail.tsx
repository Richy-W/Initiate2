import React from 'react';
import { Equipment } from '../../types';
import MagicalProperties from './MagicalProperties';
import styles from './ItemDetail.module.css';

interface ItemDetailProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onAddToInventory?: (equipment: Equipment, quantity: number) => void;
  onEquipItem?: (equipment: Equipment) => void;
  showActions?: boolean;
}

const ItemDetail: React.FC<ItemDetailProps> = ({
  equipment,
  isOpen,
  onClose,
  onAddToInventory,
  onEquipItem,
  showActions = true
}) => {
  const [quantity, setQuantity] = React.useState(1);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#6c757d';
      case 'uncommon': return '#198754';
      case 'rare': return '#0d6efd';
      case 'very_rare': return '#6f42c1';
      case 'legendary': return '#fd7e14';
      case 'artifact': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatCost = (cost: Record<string, number>) => {
    const parts = [];
    if (cost.pp) parts.push(`${cost.pp} pp`);
    if (cost.gp) parts.push(`${cost.gp} gp`);
    if (cost.sp) parts.push(`${cost.sp} sp`);
    if (cost.cp) parts.push(`${cost.cp} cp`);
    return parts.length > 0 ? parts.join(', ') : 'Priceless';
  };

  const getEquipmentSlot = () => {
    switch (equipment.equipment_type) {
      case 'armor': return 'Armor slot';
      case 'shield': return 'Shield slot';
      case 'weapon': return 'Weapon slot';
      default: return 'None';
    }
  };

  const handleAddToInventory = () => {
    if (onAddToInventory) {
      onAddToInventory(equipment, quantity);
      setQuantity(1);
      onClose();
    }
  };

  const handleEquipItem = () => {
    if (onEquipItem) {
      onEquipItem(equipment);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['item-detail-modal']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <div className={styles['header-content']}>
            <h2>{equipment.name}</h2>
            <span 
              className={styles['item-rarity']}
              style={{ backgroundColor: getRarityColor(equipment.rarity || 'common') }}
            >
              {(equipment.rarity || 'common').replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <button className={styles['close-button']} onClick={onClose}>×</button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['item-main-info']}>
            <div className={styles['item-type-info']}>
              <span className={styles['item-type']}>{equipment.equipment_type.charAt(0).toUpperCase() + equipment.equipment_type.slice(1)}</span>
              {equipment.category && (
                <span className={styles['item-category']}> • {equipment.category}</span>
              )}
            </div>

            <div className={styles['item-stats-grid']}>
              <div className={styles['stat-item']}>
                <label>Weight</label>
                <span>{equipment.weight} lbs</span>
              </div>
              
              <div className={styles['stat-item']}>
                <label>Cost</label>
                <span>{formatCost(equipment.cost)}</span>
              </div>

              {equipment.armor_class && (
                <div className="stat-item armor-stat">
                  <label>Armor Class</label>
                  <span>
                    {equipment.armor_class}
                    {equipment.dex_bonus_max !== undefined && ` + Dex (max ${equipment.dex_bonus_max})`}
                  </span>
                </div>
              )}

              {equipment.damage && (
                <div className="stat-item damage-stat">
                  <label>Damage</label>
                  <span>{equipment.damage.dice} {equipment.damage.type}</span>
                </div>
              )}

              {equipment.strength_requirement && (
                <div className={styles['stat-item']}>
                  <label>Strength Required</label>
                  <span>{equipment.strength_requirement}</span>
                </div>
              )}

              <div className={styles['stat-item']}>
                <label>Equipment Slot</label>
                <span>{getEquipmentSlot()}</span>
              </div>
            </div>

            {equipment.stealth_disadvantage && (
              <div className={styles['warning-message']}>
                <strong>Stealth Disadvantage:</strong> This armor imposes disadvantage on Dexterity (Stealth) checks.
              </div>
            )}

            {equipment.properties && equipment.properties.length > 0 && (
              <div className={styles['properties-section']}>
                <h4>Properties</h4>
                <div className={styles['properties-list']}>
                  {equipment.properties.map((property, index) => (
                    <span key={index} className={styles['property-tag']}>
                      {property.charAt(0).toUpperCase() + property.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles['description-section']}>
              <h4>Description</h4>
              <p className={styles['item-description']}>{equipment.description}</p>
            </div>

            {equipment.tool_type && (
              <div className={styles['tool-info']}>
                <h4>Tool Type</h4>
                <p>{equipment.tool_type}</p>
              </div>
            )}

            <MagicalProperties 
              equipment={equipment}
              showTitle={true}
            />

            <div className={styles['source-info']}>
              <small>
                <strong>Source:</strong> {equipment.source}
                {equipment.page && `, p. ${equipment.page}`}
              </small>
            </div>
          </div>
        </div>

        {showActions && (
          <div className={styles['modal-actions']}>
            {onAddToInventory && (
              <div className={styles['add-to-inventory-section']}>
                <div className={styles['quantity-selector']}>
                  <label htmlFor="quantity">Quantity:</label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <button 
                  className={styles['add-to-inventory-btn']}
                  onClick={handleAddToInventory}
                >
                  Add to Inventory
                </button>
              </div>
            )}

            {onEquipItem && ['armor', 'weapon', 'shield'].includes(equipment.equipment_type) && (
              <button 
                className={styles['equip-item-btn']}
                onClick={handleEquipItem}
              >
                Equip Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;