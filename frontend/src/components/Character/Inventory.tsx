import React, { useState } from 'react';
import { Character, Equipment, InventoryItem } from '../../types';
import EncumbranceStatus from './EncumbranceStatus';
import EquippedItems from '../Equipment/EquippedItems';
import { equipmentService } from '../../services/equipmentService';
import styles from './Inventory.module.css';

interface InventoryProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onShowEquipmentBrowser?: () => void;
}

const Inventory: React.FC<InventoryProps> = ({
  character,
  onUpdateCharacter,
  onShowEquipmentBrowser
}) => {
  const [selectedTab, setSelectedTab] = useState<'items' | 'equipped' | 'currency'>('items');
  const [addMode, setAddMode] = useState<{ active: boolean, type: string }>({ active: false, type: '' });
  const [removeMode, setRemoveMode] = useState<{ active: boolean, type: string }>({ active: false, type: '' });
  const [convertMode, setConvertMode] = useState<{ active: boolean, from: string, to: string }>({ active: false, from: '', to: '' });
  const [amount, setAmount] = useState<number>(0);

  const handleEquipItem = async (equipmentId: string, slot?: string) => {
    try {
      const response = await equipmentService.equipItem(character.id, equipmentId, slot);
      if (response.success) {
        onUpdateCharacter(response.character);
      } else {
        console.error('Failed to equip item:', response.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  };

  const handleUnequipItem = async (slot: string) => {
    try {
      const response = await equipmentService.unequipItem(character.id, slot);
      if (response.success) {
        onUpdateCharacter(response.character);
      } else {
        console.error('Failed to unequip item:', response.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error unequipping item:', error);
    }
  };

  const handleQuantityChange = (equipmentId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    const updatedEquipment = character.equipment.map(item => 
      item.equipment_id === equipmentId 
        ? { ...item, quantity: newQuantity }
        : item
    ).filter(item => item.quantity > 0);

    const updatedCharacter = {
      ...character,
      equipment: updatedEquipment
    };
    onUpdateCharacter(updatedCharacter);
  };

  const handleRemoveItem = (equipmentId: string) => {
    const updatedEquipment = character.equipment.filter(
      item => item.equipment_id !== equipmentId
    );
    
    // Also remove from equipped items if it was equipped
    const updatedEquippedItems = { ...character.equipped_items };
    Object.keys(updatedEquippedItems).forEach(slot => {
      if (updatedEquippedItems[slot] === equipmentId) {
        delete updatedEquippedItems[slot];
      }
    });

    const updatedCharacter = {
      ...character,
      equipment: updatedEquipment,
      equipped_items: updatedEquippedItems
    };
    onUpdateCharacter(updatedCharacter);
  };

  const isItemEquipped = (equipmentId: string) => {
    return Object.values(character.equipped_items || {}).includes(equipmentId);
  };

  const getEquippedSlot = (equipmentId: string) => {
    if (!character.equipped_items) return null;
    return Object.keys(character.equipped_items).find(
      slot => character.equipped_items[slot] === equipmentId
    ) || null;
  };

  const renderCurrencyTab = () => {
    const currency = character.currency || { cp: 0, sp: 0, gp: 0, pp: 0 };
    const totalValue = character.currency_total_gp_value || 0;
    
    const currencyTypes = [
      { code: 'pp', name: 'Platinum', color: '#E8E8E8', icon: '🪙', value: 1000 },
      { code: 'gp', name: 'Gold', color: '#FFD700', icon: '🟡', value: 100 },
      { code: 'sp', name: 'Silver', color: '#C0C0C0', icon: '⚪', value: 10 },
      { code: 'cp', name: 'Copper', color: '#B87333', icon: '🟤', value: 1 }
    ];

    const handleAddCurrency = async (currencyType: string, amount: number) => {
      try {
        const response = await fetch(`/api/characters/${character.id}/add_currency/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currency_type: currencyType, amount })
        });
        
        const data = await response.json();
        if (data.success) {
          // Update character with new currency data
          onUpdateCharacter({ 
            ...character, 
            currency: data.currency,
            currency_total_gp_value: data.total_gp_value
          });
          setAddMode({ active: false, type: '' });
          setAmount(0);
        } else {
          console.error('Failed to add currency:', data.error);
        }
      } catch (error) {
        console.error('Error adding currency:', error);
      }
    };

    const handleRemoveCurrency = async (currencyType: string, amount: number) => {
      try {
        const response = await fetch(`/api/characters/${character.id}/remove_currency/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currency_type: currencyType, amount })
        });
        
        const data = await response.json();
        if (data.success) {
          onUpdateCharacter({ 
            ...character, 
            currency: data.currency,
            currency_total_gp_value: data.total_gp_value
          });
          setRemoveMode({ active: false, type: '' });
          setAmount(0);
        } else {
          console.error('Failed to remove currency:', data.error);
        }
      } catch (error) {
        console.error('Error removing currency:', error);
      }
    };

    const handleConvertCurrency = async (fromType: string, toType: string, amount: number) => {
      try {
        const response = await fetch(`/api/characters/${character.id}/convert_currency/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_type: fromType, to_type: toType, amount })
        });
        
        const data = await response.json();
        if (data.success) {
          onUpdateCharacter({ 
            ...character, 
            currency: data.currency,
            currency_total_gp_value: data.total_gp_value
          });
          setConvertMode({ active: false, from: '', to: '' });
          setAmount(0);
        } else {
          console.error('Failed to convert currency:', data.error);
        }
      } catch (error) {
        console.error('Error converting currency:', error);
      }
    };
    
    return (
      <div className={styles['currency-section']}>
        <div className={styles['currency-header']}>
          <h4>Currency Purse</h4>
          <div className={styles['currency-total']}>
            <span className={styles['total-label']}>Total Value:</span>
            <span className={styles['total-value']}>{totalValue.toFixed(2)} gp</span>
          </div>
        </div>
        
        <div className={styles['currency-grid']}>
          {currencyTypes.map(currencyType => (
            <div key={currencyType.code} className={styles['currency-item']}>
              <div className={styles['currency-display']}>
                <div className={styles['currency-icon']} style={{ color: currencyType.color }}>
                  {currencyType.icon}
                </div>
                <div className={styles['currency-info']}>
                  <label>{currencyType.name}</label>
                  <span className={styles['currency-amount']}>{currency[currencyType.code as keyof typeof currency] || 0}</span>
                </div>
              </div>
              
              <div className={styles['currency-actions']}>
                <button 
                  className={[styles['currency-btn'], styles['add']].filter(Boolean).join(' ')}
                  onClick={() => setAddMode({ active: true, type: currencyType.code })}
                  title={`Add ${currencyType.name}`}
                >
                  +
                </button>
                <button 
                  className={[styles['currency-btn'], styles['remove']].filter(Boolean).join(' ')}
                  onClick={() => setRemoveMode({ active: true, type: currencyType.code })}
                  title={`Remove ${currencyType.name}`}
                  disabled={(currency[currencyType.code as keyof typeof currency] || 0) === 0}
                >
                  -
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles['currency-tools']}>
          <button 
            className={styles['currency-tool-btn']}
            onClick={() => setConvertMode({ active: true, from: '', to: '' })}
          >
            💱 Convert Currency
          </button>
        </div>

        {/* Add Currency Modal */}
        {addMode.active && (
          <div className={styles['currency-modal']}>
            <div className={styles['modal-content']}>
              <h5>Add {currencyTypes.find(c => c.code === addMode.type)?.name}</h5>
              <input 
                type="number" 
                min="1" 
                value={amount} 
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Amount to add"
                autoFocus
              />
              <div className={styles['modal-actions']}>
                <button onClick={() => handleAddCurrency(addMode.type, amount)}>Add</button>
                <button onClick={() => { setAddMode({ active: false, type: '' }); setAmount(0); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Currency Modal */}
        {removeMode.active && (
          <div className={styles['currency-modal']}>
            <div className={styles['modal-content']}>
              <h5>Remove {currencyTypes.find(c => c.code === removeMode.type)?.name}</h5>
              <p>Available: {currency[removeMode.type as keyof typeof currency] || 0}</p>
              <input 
                type="number" 
                min="1" 
                max={currency[removeMode.type as keyof typeof currency] || 0}
                value={amount} 
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Amount to remove"
                autoFocus
              />
              <div className={styles['modal-actions']}>
                <button onClick={() => handleRemoveCurrency(removeMode.type, amount)}>Remove</button>
                <button onClick={() => { setRemoveMode({ active: false, type: '' }); setAmount(0); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Convert Currency Modal */}
        {convertMode.active && (
          <div className={styles['currency-modal']}>
            <div className={styles['modal-content']}>
              <h5>Convert Currency</h5>
              <div className={styles['convert-form']}>
                <div className={styles['convert-row']}>
                  <label>From:</label>
                  <select value={convertMode.from} onChange={(e) => setConvertMode({ ...convertMode, from: e.target.value })}>
                    <option value="">Select currency</option>
                    {currencyTypes.filter(c => (currency[c.code as keyof typeof currency] || 0) > 0).map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({currency[c.code as keyof typeof currency]})</option>
                    ))}
                  </select>
                </div>
                <div className={styles['convert-row']}>
                  <label>To:</label>
                  <select value={convertMode.to} onChange={(e) => setConvertMode({ ...convertMode, to: e.target.value })}>
                    <option value="">Select currency</option>
                    {currencyTypes.filter(c => c.code !== convertMode.from).map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['convert-row']}>
                  <label>Amount:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={convertMode.from ? currency[convertMode.from as keyof typeof currency] || 0 : 0}
                    value={amount} 
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    placeholder="Amount to convert"
                  />
                </div>
              </div>
              <div className={styles['modal-actions']}>
                <button 
                  onClick={() => handleConvertCurrency(convertMode.from, convertMode.to, amount)}
                  disabled={!convertMode.from || !convertMode.to || amount <= 0}
                >
                  Convert
                </button>
                <button onClick={() => { setConvertMode({ active: false, from: '', to: '' }); setAmount(0); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInventoryItem = (item: InventoryItem, equipment: Equipment) => {
    const equippedSlot = getEquippedSlot(item.equipment_id);
    const equipped = isItemEquipped(item.equipment_id);

    return (
      <div key={item.equipment_id} className={[styles['inventory-item'], equipped ? styles['equipped'] : ''].filter(Boolean).join(' ')}>
        <div className={styles['item-info']}>
          <div className={styles['item-header']}>
            <h5>{equipment.name}</h5>
            {equipped && <span className={styles['equipped-badge']}>Equipped ({equippedSlot})</span>}
          </div>
          
          <div className={styles['item-details']}>
            <span className={styles['item-type']}>{equipment.equipment_type}</span>
            {equipment.weight && (
              <span className={styles['item-weight']}>{equipment.weight} lb</span>
            )}
          </div>

          {equipment.description && (
            <p className={styles['item-description']}>{equipment.description}</p>
          )}
        </div>

        <div className={styles['item-controls']}>
          <div className={styles['quantity-control']}>
            <label>Qty:</label>
            <input
              type="number"
              min="0"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(item.equipment_id, parseInt(e.target.value) || 0)}
              className={styles['quantity-input']}
            />
          </div>

          <div className={styles['item-actions']}>
            {equipment.equipment_type === 'armor' && !equipped && (
              <button 
                onClick={() => handleEquipItem(item.equipment_id, 'armor')}
                className={styles['equip-btn']}
              >
                Equip
              </button>
            )}
            {equipment.equipment_type === 'weapon' && !equipped && (
              <button 
                onClick={() => handleEquipItem(item.equipment_id, 'main_hand')}
                className={styles['equip-btn']}
              >
                Equip
              </button>
            )}
            {equipment.equipment_type === 'shield' && !equipped && (
              <button 
                onClick={() => handleEquipItem(item.equipment_id, 'shield')}
                className={styles['equip-btn']}
              >
                Equip
              </button>
            )}
            
            {equipped && (
              <button 
                onClick={() => handleUnequipItem(equippedSlot!)}
                className={styles['unequip-btn']}
              >
                Unequip
              </button>
            )}

            <button 
              onClick={() => handleRemoveItem(item.equipment_id)}
              className={styles['remove-btn']}
              title="Remove item"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles['inventory-container']}>
      <div className={styles['inventory-header']}>
        <h3>Inventory</h3>
        
        <EncumbranceStatus character={character} detailed={false} />
      </div>

      <div className={styles['inventory-tabs']}>
        <button
          className={[styles['tab'], selectedTab === 'items' ? styles['active'] : ''].filter(Boolean).join(' ')}
          onClick={() => setSelectedTab('items')}
        >
          Equipment
        </button>
        <button
          className={[styles['tab'], selectedTab === 'equipped' ? styles['active'] : ''].filter(Boolean).join(' ')}
          onClick={() => setSelectedTab('equipped')}
        >
          Equipped
        </button>
        <button
          className={[styles['tab'], selectedTab === 'currency' ? styles['active'] : ''].filter(Boolean).join(' ')}
          onClick={() => setSelectedTab('currency')}
        >
          Currency
        </button>
      </div>

      <div className={styles['inventory-content']}>
        {selectedTab === 'items' && (
          <div className={styles['equipment-section']}>
            {character.equipment && character.equipment.length > 0 ? (
              <div className={styles['equipment-list']}>
                {character.equipment.map(item => {
                  // In a real implementation, you'd fetch equipment details by ID
                  // For now, we'll create a mock equipment object
                  const mockEquipment: Equipment = {
                    id: item.equipment_id,
                    name: `Equipment ${item.equipment_id}`,
                    description: 'Equipment description',
                    equipment_type: 'gear',
                    weight: 1,
                    cost: {},
                    source: '',
                    page: 0
                  };
                  
                  return renderInventoryItem(item, mockEquipment);
                })}
              </div>
            ) : (
              <div className={styles['empty-inventory']}>
                <p>No equipment in inventory</p>
                {onShowEquipmentBrowser && (
                  <button 
                    onClick={onShowEquipmentBrowser}
                    className={styles['browse-equipment-btn']}
                  >
                    Browse Equipment
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'equipped' && (
          <EquippedItems 
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
          />
        )}

        {selectedTab === 'currency' && renderCurrencyTab()}
      </div>
    </div>
  );
};

export default Inventory;
