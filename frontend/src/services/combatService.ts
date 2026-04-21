import apiClient from './apiClient';
import { InitiativeTracker, InitiativeParticipant } from '../types';

export const combatService = {
  listTrackers: async (campaignId?: string): Promise<InitiativeTracker[]> => {
    const params = campaignId ? { campaign: campaignId } : {};
    const res = await apiClient.get('/combat/trackers/', { params });
    return res.data.results ?? res.data;
  },

  getTracker: async (id: string): Promise<InitiativeTracker> => {
    const res = await apiClient.get(`/combat/trackers/${id}/`);
    return res.data;
  },

  createTracker: async (data: { campaign: string; name?: string }): Promise<InitiativeTracker> => {
    const res = await apiClient.post('/combat/trackers/', data);
    return res.data;
  },

  addParticipant: async (trackerId: string, data: Partial<InitiativeParticipant>): Promise<InitiativeParticipant> => {
    const res = await apiClient.post(`/combat/trackers/${trackerId}/add-participant/`, data);
    return res.data;
  },

  submitInitiative: async (trackerId: string, participantId: string, initiativeValue: number): Promise<InitiativeParticipant> => {
    const res = await apiClient.post(`/combat/trackers/${trackerId}/submit-initiative/`, {
      participant_id: participantId,
      initiative_value: initiativeValue,
    });
    return res.data;
  },

  startCombat: async (trackerId: string): Promise<InitiativeTracker> => {
    const res = await apiClient.post(`/combat/trackers/${trackerId}/start/`);
    return res.data;
  },

  advanceTurn: async (trackerId: string): Promise<InitiativeTracker> => {
    const res = await apiClient.post(`/combat/trackers/${trackerId}/advance-turn/`);
    return res.data;
  },

  endCombat: async (trackerId: string): Promise<InitiativeTracker> => {
    const res = await apiClient.post(`/combat/trackers/${trackerId}/end/`);
    return res.data;
  },
};

export default combatService;
