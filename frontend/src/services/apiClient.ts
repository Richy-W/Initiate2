import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { enhanceContentWithPk } from '../utils/idMapping';
import { parseApiError } from '../utils/errorHandling';

let globalApiErrorHandler: ((message: string) => void) | null = null;

export const setGlobalApiErrorHandler = (handler: ((message: string) => void) | null): void => {
  globalApiErrorHandler = handler;
};

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  skipGlobalErrorHandler?: boolean;
}

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, remove tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const skipGlobalErrorHandler = Boolean((originalRequest as ExtendedAxiosRequestConfig | undefined)?.skipGlobalErrorHandler);

    if (globalApiErrorHandler && !skipGlobalErrorHandler) {
      const parsed = parseApiError(error);
      // Avoid duplicate global toasts for auth redirects and expected auth failures.
      if (![401, 403].includes(parsed.status)) {
        globalApiErrorHandler(parsed.message);
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const api = {
  // Authentication endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post('/users/auth/login/', credentials);
      return response.data;
    },
    register: async (userData: { email: string; password: string; password_confirm: string; username: string; first_name: string; last_name: string }) => {
      const response = await apiClient.post('/users/auth/register/', userData);
      return response.data;
    },
    logout: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/users/auth/logout/', { refresh: refreshToken });
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    refreshToken: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await apiClient.post('/users/auth/refresh/', { refresh: refreshToken });
      return response.data;
    },
  },

  // User profile endpoints
  user: {
    getProfile: async () => {
      const response = await apiClient.get('/users/profile/');
      return response.data;
    },
    updateProfile: async (userData: Partial<{ username: string; email: string }>) => {
      const response = await apiClient.patch('/users/profile/', userData);
      return response.data;
    },
  },

  // Character endpoints
  characters: {
    list: async () => {
      const response = await apiClient.get('/characters/');
      return response.data;
    },
    get: async (id: string) => {
      const response = await apiClient.get(`/characters/${id}/`);
      return response.data;
    },
    create: async (characterData: any) => {
      const response = await apiClient.post('/characters/', characterData);
      return response.data;
    },
    update: async (id: string, characterData: any) => {
      const response = await apiClient.patch(`/characters/${id}/`, characterData);
      return response.data;
    },
    delete: async (id: string) => {
      await apiClient.delete(`/characters/${id}/`);
    },
    levelUp: async (id: string, levelUpData: any) => {
      const response = await apiClient.post(`/characters/${id}/level-up/`, levelUpData);
      return response.data;
    },
    takeDamage: async (id: string, payload: { damage: number; damage_type?: string }) => {
      const response = await apiClient.post(`/characters/${id}/take_damage/`, payload);
      return response.data;
    },
    heal: async (id: string, payload: { healing: number }) => {
      const response = await apiClient.post(`/characters/${id}/heal/`, payload);
      return response.data;
    },
    addItem: async (id: string, payload: { name: string; quantity?: number }) => {
      const response = await apiClient.post(`/characters/${id}/add_item/`, payload);
      return response.data;
    },
    addCurrency: async (id: string, payload: { currency_type: 'cp' | 'sp' | 'ep' | 'gp' | 'pp'; amount: number }) => {
      const response = await apiClient.post(`/characters/${id}/add_currency/`, payload);
      return response.data;
    },
    setCurrency: async (id: string, payload: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number }) => {
      const response = await apiClient.post(`/characters/${id}/set_currency/`, payload);
      return response.data;
    },
    getAll: async (config?: ExtendedAxiosRequestConfig) => {
      const response = await apiClient.get('/characters/', config);
      return response.data;
    },
  },

  // Campaign endpoints
  campaigns: {
    list: async () => {
      const response = await apiClient.get('/campaigns/');
      return response.data;
    },
    get: async (id: number) => {
      const response = await apiClient.get(`/campaigns/${id}/`);
      return response.data;
    },
    create: async (campaignData: any) => {
      const response = await apiClient.post('/campaigns/', campaignData);
      return response.data;
    },
    update: async (id: number, campaignData: any) => {
      const response = await apiClient.patch(`/campaigns/${id}/`, campaignData);
      return response.data;
    },
    delete: async (id: number) => {
      await apiClient.delete(`/campaigns/${id}/`);
    },
    join: async (id: number) => {
      const response = await apiClient.post(`/campaigns/${id}/join/`);
      return response.data;
    },
    leave: async (id: number) => {
      const response = await apiClient.post(`/campaigns/${id}/leave/`);
      return response.data;
    },
  },

  // Combat endpoints
  combat: {
    start: async (campaignId: number, combatData: any) => {
      const response = await apiClient.post(`/campaigns/${campaignId}/combat/`, combatData);
      return response.data;
    },
    get: async (campaignId: number, combatId: number) => {
      const response = await apiClient.get(`/campaigns/${campaignId}/combat/${combatId}/`);
      return response.data;
    },
    updateTurn: async (campaignId: number, combatId: number, turnData: any) => {
      const response = await apiClient.patch(`/campaigns/${campaignId}/combat/${combatId}/turn/`, turnData);
      return response.data;
    },
    endCombat: async (campaignId: number, combatId: number) => {
      await apiClient.delete(`/campaigns/${campaignId}/combat/${combatId}/`);
    },
  },

  // Content endpoints (D&D reference data)
  content: {
    species: {
      list: async () => {
        const response = await apiClient.get('/content/species/');
        const enhancedData = {
          ...response.data,
          results: enhanceContentWithPk(response.data.results || [], 'species')
        };
        return enhancedData;
      },
      get: async (id: string) => {
        const response = await apiClient.get(`/content/species/${id}/`);
        return response.data;
      },
    },
    classes: {
      list: async () => {
        const response = await apiClient.get('/content/classes/');
        const enhancedData = {
          ...response.data,
          results: enhanceContentWithPk(response.data.results || [], 'class')
        };
        return enhancedData;
      },
      get: async (id: string) => {
        const response = await apiClient.get(`/content/classes/${id}/`);
        return response.data;
      },
    },
    backgrounds: {
      list: async () => {
        const response = await apiClient.get('/content/backgrounds/');
        const enhancedData = {
          ...response.data,
          results: enhanceContentWithPk(response.data.results || [], 'background')
        };
        return enhancedData;
      },
      get: async (id: string) => {
        const response = await apiClient.get(`/content/backgrounds/${id}/`);
        return response.data;
      },
    },
    spells: {
      list: async (params?: any) => {
        const response = await apiClient.get('/content/spells/', { params });
        return response.data;
      },
      get: async (id: string) => {
        const response = await apiClient.get(`/content/spells/${id}/`);
        return response.data;
      },
    },
    equipment: {
      list: async (params?: any) => {
        const response = await apiClient.get('/content/equipment/', { params });
        return response.data;
      },
      get: async (id: string) => {
        const response = await apiClient.get(`/content/equipment/${id}/`);
        return response.data;
      },
    },
    monsters: {
      list: async (params?: any) => {
        const response = await apiClient.get('/content/monsters/', { params });
        return response.data;
      },
      get: async (id: string) => {
        const response = await apiClient.get(`/content/monsters/${id}/`);
        return response.data;
      },
    },
    skills: {
      list: async (params?: any) => {
        const response = await apiClient.get('/content/skills/', { params });
        return response.data;
      },
    },
  },
};

// Export the configured axios instance for direct use
export default apiClient;

// Export specific API groups for easier imports
export const authAPI = api.auth;
export const userAPI = api.user;
export const characterAPI = api.characters;
export const campaignAPI = api.campaigns;
export const combatAPI = api.combat;
export const contentAPI = api.content;

// Export types for TypeScript support
export type { AxiosResponse, InternalAxiosRequestConfig };

// Utility function for handling API errors
export const handleApiError = (error: any) => {
  return parseApiError(error);
};