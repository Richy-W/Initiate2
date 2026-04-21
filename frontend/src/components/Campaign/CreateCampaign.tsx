import React, { useState } from 'react';
import { Campaign } from '../../types';
import campaignService from '../../services/campaignService';

interface CreateCampaignProps {
  onCreated: (campaign: Campaign) => void;
  onCancel: () => void;
}

const CreateCampaign: React.FC<CreateCampaignProps> = ({ onCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    join_mode: 'invitation_only' as Campaign['join_mode'],
    encumbrance_rules: 'simple' as Campaign['encumbrance_rules'],
    rule_validation: 'warnings' as Campaign['rule_validation'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const campaign = await campaignService.create(formData);
      onCreated(campaign);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Join Mode</label>
          <select
            value={formData.join_mode}
            onChange={e => setFormData(p => ({ ...p, join_mode: e.target.value as Campaign['join_mode'] }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="invitation_only">Invitation Only</option>
            <option value="approval_required">Approval Required</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Encumbrance Rules</label>
          <select
            value={formData.encumbrance_rules}
            onChange={e => setFormData(p => ({ ...p, encumbrance_rules: e.target.value as Campaign['encumbrance_rules'] }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="disabled">Disabled</option>
            <option value="simple">Simple</option>
            <option value="variant">Variant</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rule Validation</label>
          <select
            value={formData.rule_validation}
            onChange={e => setFormData(p => ({ ...p, rule_validation: e.target.value as Campaign['rule_validation'] }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="strict">Strict</option>
            <option value="warnings">Warnings</option>
            <option value="permissive">Permissive</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
