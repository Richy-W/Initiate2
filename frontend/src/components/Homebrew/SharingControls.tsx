import React, { useEffect, useState } from 'react';
import homebrewService from '../../services/homebrewService';
import { ContentSharingPermission } from '../../types';

interface SharingControlsProps {
  contentId: string;
}

const SharingControls: React.FC<SharingControlsProps> = ({ contentId }) => {
  const [campaign, setCampaign] = useState('');
  const [user, setUser] = useState('');
  const [permissionType, setPermissionType] = useState<'view' | 'use'>('view');
  const [permissions, setPermissions] = useState<ContentSharingPermission[]>([]);

  const loadPermissions = async () => {
    const data = await homebrewService.listPermissions(contentId);
    setPermissions(data);
  };

  useEffect(() => {
    loadPermissions();
  }, [contentId]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    await homebrewService.share(contentId, {
      campaign: campaign || null,
      user: user || null,
      permission_type: permissionType,
    });
    setCampaign('');
    setUser('');
    loadPermissions();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Sharing Controls</h3>
      <form onSubmit={handleShare} className="grid gap-2 sm:grid-cols-3">
        <input
          value={campaign}
          onChange={e => setCampaign(e.target.value)}
          placeholder="Campaign ID (optional)"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <input
          value={user}
          onChange={e => setUser(e.target.value)}
          placeholder="User ID (optional)"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <select
          value={permissionType}
          onChange={e => setPermissionType(e.target.value as 'view' | 'use')}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="view">View</option>
          <option value="use">Use</option>
        </select>
        <button className="bg-indigo-600 text-white rounded px-3 py-1.5 hover:bg-indigo-700 sm:col-span-3" type="submit">
          Grant Permission
        </button>
      </form>

      <div className="space-y-2">
        {permissions.map(p => (
          <div key={p.id} className="text-sm text-gray-700 bg-gray-50 rounded p-2">
            {p.permission_type.toUpperCase()} - Campaign: {p.campaign || '—'} / User: {p.user || '—'}
          </div>
        ))}
        {permissions.length === 0 && <p className="text-sm text-gray-500">No permissions yet.</p>}
      </div>
    </div>
  );
};

export default SharingControls;
