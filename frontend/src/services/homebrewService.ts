import apiClient from './apiClient';
import { HomebrewContent, ContentSharingPermission } from '../types';

const homebrewService = {
  list: async (params?: Record<string, any>): Promise<HomebrewContent[]> => {
    const response = await apiClient.get('/content/homebrew/', { params });
    return response.data.results || response.data;
  },

  get: async (id: string): Promise<HomebrewContent> => {
    const response = await apiClient.get(`/content/homebrew/${id}/`);
    return response.data;
  },

  create: async (payload: Partial<HomebrewContent>): Promise<HomebrewContent> => {
    const response = await apiClient.post('/content/homebrew/', payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<HomebrewContent>): Promise<HomebrewContent> => {
    const response = await apiClient.patch(`/content/homebrew/${id}/`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/content/homebrew/${id}/`);
  },

  publish: async (id: string): Promise<HomebrewContent> => {
    const response = await apiClient.post(`/content/homebrew/${id}/publish/`);
    return response.data;
  },

  createNewVersion: async (id: string, payload: { data?: Record<string, any>; dependencies?: string[] }): Promise<HomebrewContent> => {
    const response = await apiClient.post(`/content/homebrew/${id}/new_version/`, payload);
    return response.data;
  },

  share: async (id: string, payload: { campaign?: string | null; user?: string | null; permission_type: 'view' | 'use' }): Promise<ContentSharingPermission> => {
    const response = await apiClient.post(`/content/homebrew/${id}/share/`, payload);
    return response.data;
  },

  listPermissions: async (id: string): Promise<ContentSharingPermission[]> => {
    const response = await apiClient.get(`/content/homebrew/${id}/permissions_list/`);
    return response.data;
  },

  moderate: async (id: string, status: 'draft' | 'published' | 'archived'): Promise<HomebrewContent> => {
    const response = await apiClient.post(`/content/homebrew/${id}/moderate/`, { status });
    return response.data;
  },
};

export default homebrewService;
