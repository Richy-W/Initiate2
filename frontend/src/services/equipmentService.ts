import { Equipment } from '../types';
import apiClient from './apiClient';

export interface EquipmentFilters {
  equipment_type?: string;
  category?: string;
  rarity?: string;
  search?: string;
  min_weight?: number;
  max_weight?: number;
}

class EquipmentService {
  private readonly basePath = '/equipment';

  /**
   * Get all equipment items
   */
  async getAll(filters?: EquipmentFilters): Promise<Equipment[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.equipment_type) params.append('equipment_type', filters.equipment_type);
        if (filters.category) params.append('category', filters.category);
        if (filters.rarity) params.append('rarity', filters.rarity);
        if (filters.search) params.append('search', filters.search);
        if (filters.min_weight !== undefined) params.append('min_weight', filters.min_weight.toString());
        if (filters.max_weight !== undefined) params.append('max_weight', filters.max_weight.toString());
      }

      const response = await apiClient.get(`${this.basePath}/?${params.toString()}`);
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  }

  /**
   * Get equipment item by ID
   */
  async getById(id: string): Promise<Equipment> {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching equipment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get equipment grouped by type
   */
  async getByType(type?: string): Promise<Record<string, Equipment[]>> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await apiClient.get(`${this.basePath}/by_type/${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment by type:', error);
      throw error;
    }
  }

  /**
   * Get equipment grouped by category
   */
  async getByCategory(category?: string): Promise<Record<string, Equipment[]>> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await apiClient.get(`${this.basePath}/by_category/${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment by category:', error);
      throw error;
    }
  }

  /**
   * Search equipment with advanced filters
   */
  async search(query: string, filters?: Partial<EquipmentFilters>): Promise<Equipment[]> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      
      if (filters) {
        if (filters.equipment_type) params.append('equipment_type', filters.equipment_type);
        if (filters.category) params.append('category', filters.category);
        if (filters.rarity) params.append('rarity', filters.rarity);
      }

      const response = await apiClient.get(`${this.basePath}/?${params.toString()}`);
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error searching equipment:', error);
      throw error;
    }
  }

  /**
   * Get available equipment types
   */
  async getAvailableTypes(): Promise<string[]> {
    try {
      // This would need to be implemented on the backend
      // For now, return standard D&D equipment types
      return ['armor', 'weapon', 'shield', 'tool', 'gear', 'mount'];
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      throw error;
    }
  }

  /**
   * Get available rarities
   */
  async getAvailableRarities(): Promise<string[]> {
    try {
      // Standard D&D rarities
      return ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'];
    } catch (error) {
      console.error('Error fetching equipment rarities:', error);
      throw error;
    }
  }

  /**
   * Equip an item to a character slot
   */
  async equipItem(characterId: string, equipmentId: string, slot?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/characters/${characterId}/equip_item/`, {
        equipment_id: equipmentId,
        slot: slot
      });
      return response.data;
    } catch (error) {
      console.error('Error equipping item:', error);
      throw error;
    }
  }

  /**
   * Unequip an item from a character slot
   */
  async unequipItem(characterId: string, slot: string): Promise<any> {
    try {
      const response = await apiClient.post(`/characters/${characterId}/unequip_item/`, {
        slot: slot
      });
      return response.data;
    } catch (error) {
      console.error('Error unequipping item:', error);
      throw error;
    }
  }

  /**
   * Get equipped items for a character
   */
  async getEquippedItems(characterId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/characters/${characterId}/equipped_items/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching equipped items:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const equipmentService = new EquipmentService();
export default equipmentService;