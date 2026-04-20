import React, { useState } from 'react';
import { Campaign } from '../../types';
import campaignService from '../../services/campaignService';

interface JoinCampaignProps {
  campaign: Campaign;
  onJoined: () => void;
}

const JoinCampaign: React.FC<JoinCampaignProps> = ({ campaign, onJoined }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await campaignService.acceptInvitation(campaign.id, token);
      onJoined();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired invitation token.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      await campaignService.requestJoin(campaign.id);
      onJoined();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send join request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-2">{campaign.name}</h2>
      {campaign.description && (
        <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm">{error}</div>
      )}

      {campaign.join_mode === 'invitation_only' ? (
        <form onSubmit={handleAcceptInvitation} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Token</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your invitation token"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join with Token'}
          </button>
        </form>
      ) : (
        <div>
          <p className="text-gray-600 text-sm mb-4">
            Request to join this campaign. The DM will review and approve your request.
          </p>
          <button
            onClick={handleRequestJoin}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Requesting...' : 'Request to Join'}
          </button>
        </div>
      )}
    </div>
  );
};

export default JoinCampaign;
