import React, { useState, useEffect, useCallback } from 'react';
import { Equipment } from '../../types';
import { equipmentService } from '../../services/equipmentService';
import styles from './EquipmentBrowser.module.css';

interface EquipmentBrowserProps {
  onSelectEquipment: (equipment: Equipment) => void;
  onAddToInventory?: (equipment: Equipment, quantity: number) => void;
  onClose?: () => void;
  showAddButton?: boolean;
  showSelectButton?: boolean;
}

interface FilterState {
  search: string;
  equipmentType: string;
  category: string;
  rarity: string;
  weightRange: [number, number];
  sortBy: 'name' | 'weight' | 'cost';
  sortOrder: 'asc' | 'desc';
}

const EquipmentBrowser: React.FC<EquipmentBrowserProps> = ({
  onSelectEquipment,
  onAddToInventory,
  onClose,
  showAddButton = true,
  showSelectButton = false
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    equipmentType: '',
    category: '',
    rarity: '',
    weightRange: [0, 100],
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Load equipment data
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        const data = await equipmentService.getAll();
        setEquipment(data);
        setFilteredEquipment(data);
        setError(null);
      } catch (err) {
        setError('Failed to load equipment data');
        console.error('Error loading equipment:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, []);

  // Filter and sort equipment
  const applyFilters = useCallback(() => {
    const filtered = equipment.filter(item => {
      // Search filter
      const searchMatch = !filters.search || 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase());
      
      // Equipment type filter
      const typeMatch = !filters.equipmentType || 
        item.equipment_type === filters.equipmentType;
      
      // Category filter
      const categoryMatch = !filters.category || 
        item.category?.toLowerCase().includes(filters.category.toLowerCase());
      
      // Rarity filter
      const rarityMatch = !filters.rarity || item.rarity === filters.rarity;
      
      // Weight range filter
      const weightMatch = item.weight >= filters.weightRange[0] && 
        item.weight <= filters.weightRange[1];

      return searchMatch && typeMatch && categoryMatch && rarityMatch && weightMatch;
    });

    // Sort equipment
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'weight':
          aValue = a.weight;
          bValue = b.weight;
          break;
        case 'cost':
          aValue = a.cost.gp || 0;
          bValue = b.cost.gp || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredEquipment(filtered);
  }, [equipment, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddToInventory = (equipment: Equipment) => {
    if (onAddToInventory) {
      onAddToInventory(equipment, addQuantity);
      setAddQuantity(1);
    }
  };

  const formatCost = (cost: Record<string, number>) => {
    const parts = [];
    if (cost.pp) parts.push(`${cost.pp} pp`);
    if (cost.gp) parts.push(`${cost.gp} gp`);
    if (cost.sp) parts.push(`${cost.sp} sp`);
    if (cost.cp) parts.push(`${cost.cp} cp`);
    return parts.join(' ') || 'No cost';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6c757d';
      case 'uncommon': return '#198754';
      case 'rare': return '#0d6efd';
      case 'very_rare': return '#6f42c1';
      case 'legendary': return '#fd7e14';
      case 'artifact': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="equipment-browser loading">
        <div className={styles['loading-spinner']}>Loading equipment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="equipment-browser error">
        <div className={styles['error-message']}>{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles['equipment-browser']}>
      <div className={styles['browser-header']}>
        <h3>Equipment Browser</h3>
        {onClose && (
          <button onClick={onClose} className={styles['close-btn']}>×</button>
        )}
      </div>

      <div className={styles['browser-content']}>
        {/* Filters Panel */}
        <div className={styles['filters-panel']}>
          <div className={styles['filter-group']}>
            <label>Search:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search equipment..."
              className={styles['search-input']}
            />
          </div>

          <div className={styles['filter-row']}>
            <div className={styles['filter-group']}>
              <label>Type:</label>
              <select
                value={filters.equipmentType}
                onChange={(e) => handleFilterChange('equipmentType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="weapon">Weapons</option>
                <option value="armor">Armor</option>
                <option value="shield">Shields</option>
                <option value="tool">Tools</option>
                <option value="gear">Gear</option>
              </select>
            </div>

            <div className={styles['filter-group']}>
              <label>Rarity:</label>
              <select
                value={filters.rarity}
                onChange={(e) => handleFilterChange('rarity', e.target.value)}
              >
                <option value="">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="very_rare">Very Rare</option>
                <option value="legendary">Legendary</option>
                <option value="artifact">Artifact</option>
              </select>
            </div>

            <div className={styles['filter-group']}>
              <label>Sort By:</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="weight-asc">Weight (Light)</option>
                <option value="weight-desc">Weight (Heavy)</option>
                <option value="cost-asc">Cost (Low)</option>
                <option value="cost-desc">Cost (High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className={styles['equipment-list']}>
          {filteredEquipment.length > 0 ? (
            <div className={styles['equipment-grid']}>
              {filteredEquipment.map(item => (
                <div 
                  key={item.id} 
                  className={[styles['equipment-card'], selectedEquipment?.id === item.id ? styles['selected'] : ''].filter(Boolean).join(' ')}
                  onClick={() => setSelectedEquipment(item)}
                >
                  <div className={styles['card-header']}>
                    <h4>{item.name}</h4>
                    <span 
                      className={styles['rarity-badge']}
                      style={{ backgroundColor: getRarityColor(item.rarity || 'common') }}
                    >
                      {item.rarity || 'common'}
                    </span>
                  </div>

                  <div className={styles['card-details']}>
                    <div className={styles['detail-row']}>
                      <span className={styles['label']}>Type:</span>
                      <span className={styles['value']}>{item.equipment_type}</span>
                    </div>
                    
                    {item.category && (
                      <div className={styles['detail-row']}>
                        <span className={styles['label']}>Category:</span>
                        <span className={styles['value']}>{item.category}</span>
                      </div>
                    )}
                    
                    <div className={styles['detail-row']}>
                      <span className={styles['label']}>Weight:</span>
                      <span className={styles['value']}>{item.weight} lbs</span>
                    </div>
                    
                    <div className={styles['detail-row']}>
                      <span className={styles['label']}>Cost:</span>
                      <span className={styles['value']}>{formatCost(item.cost)}</span>
                    </div>

                    {item.armor_class && (
                      <div className={styles['detail-row']}>
                        <span className={styles['label']}>AC:</span>
                        <span className={styles['value']}>{item.armor_class}</span>
                      </div>
                    )}

                    {item.damage && (
                      <div className={styles['detail-row']}>
                        <span className={styles['label']}>Damage:</span>
                        <span className={styles['value']}>
                          {item.damage.dice} {item.damage.type}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles['card-description']}>
                    <p>{item.description}</p>
                  </div>

                  <div className={styles['card-actions']}>
                    {showAddButton && onAddToInventory && (
                      <div className={styles['add-section']}>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                          className={styles['quantity-input']}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToInventory(item);
                          }}
                          className={styles['add-btn']}
                        >
                          Add to Inventory
                        </button>
                      </div>
                    )}

                    {showSelectButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEquipment(item);
                        }}
                        className={styles['select-btn']}
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles['no-results']}>
              <p>No equipment found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className={styles['results-info']}>
        Showing {filteredEquipment.length} of {equipment.length} items
      </div>
    </div>
  );
};

export default EquipmentBrowser;

