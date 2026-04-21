import apiClient from './apiClient';
import { Campaign, CampaignMembership, CampaignInvitation, CampaignNotification } from '../types';

export const campaignService = {
  list: async (): Promise<Campaign[]> => {
    const res = await apiClient.get('/campaigns/');
    return res.data.results ?? res.data;
  },

  get: async (id: string): Promise<Campaign> => {
    const res = await apiClient.get(`/campaigns/${id}/`);
    return res.data;
  },

  create: async (data: Partial<Campaign>): Promise<Campaign> => {
    const res = await apiClient.post('/campaigns/', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
    const res = await apiClient.patch(`/campaigns/${id}/`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/campaigns/${id}/`);
  },

  getParty: async (id: string): Promise<CampaignMembership[]> => {
    const res = await apiClient.get(`/campaigns/${id}/party/`);
    return res.data;
  },

  invite: async (id: string, data: { email?: string; invitee?: string; message?: string }): Promise<CampaignInvitation> => {
    const res = await apiClient.post(`/campaigns/${id}/invite/`, data);
    return res.data;
  },

  getInvitations: async (id: string): Promise<CampaignInvitation[]> => {
    const res = await apiClient.get(`/campaigns/${id}/invitations/`);
    return res.data;
  },

  acceptInvitation: async (id: string, token: string): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/accept-invitation/`, { token });
  },

  declineInvitation: async (id: string, token: string): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/decline-invitation/`, { token });
  },

  useInviteCode: async (token: string): Promise<{ detail: string; campaign_id: string; campaign_name: string }> => {
    const res = await apiClient.post('/campaigns/use-invite-code/', { token, action: 'accept' });
    return res.data;
  },

  joinByCode: async (code: string): Promise<{ detail: string; campaign_id: string; campaign_name: string }> => {
    const res = await apiClient.post('/campaigns/join-by-code/', { code });
    return res.data;
  },

  regenerateInviteCode: async (id: string): Promise<{ invite_code: string }> => {
    const res = await apiClient.post(`/campaigns/${id}/regenerate-invite-code/`);
    return res.data;
  },

  getMyInvitations: async (): Promise<CampaignInvitation[]> => {
    const res = await apiClient.get('/campaigns/my-invitations/');
    return res.data;
  },

  requestJoin: async (id: string): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/request-join/`);
  },

  approveMember: async (id: string, playerId: string): Promise<CampaignMembership> => {
    const res = await apiClient.post(`/campaigns/${id}/approve-member/`, { player_id: playerId });
    return res.data;
  },

  leave: async (id: string): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/leave/`);
  },

  removeMember: async (id: string, playerId: string): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/remove-member/`, { player_id: playerId });
  },

  assignCharacter: async (id: string, characterId: string): Promise<CampaignMembership> => {
    const res = await apiClient.post(`/campaigns/${id}/assign-character/`, { character_id: characterId });
    return res.data;
  },

  getNotifications: async (id: string): Promise<CampaignNotification[]> => {
    const res = await apiClient.get(`/campaigns/${id}/notifications/`);
    return res.data;
  },

  createNotification: async (
    id: string,
    data: {
      recipient: string;
      notification_type: CampaignNotification['notification_type'];
      title: string;
      message?: string;
      payload?: Record<string, any>;
    }
  ): Promise<CampaignNotification> => {
    const res = await apiClient.post(`/campaigns/${id}/notifications/`, data);
    return res.data;
  },

  markNotificationRead: async (id: string, notificationId: string): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/notifications-mark-read/`, {
      notification_id: notificationId,
    });
  },
};

export default campaignService;
