import React from 'react';
import { useParams } from 'react-router-dom';

const CombatPage: React.FC = () => {
  const { campaignId, encounterId } = useParams<{ campaignId: string; encounterId?: string }>();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Combat Encounter</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Campaign ID: {campaignId}</p>
        <p className="text-gray-600">Encounter ID: {encounterId || 'New encounter'}</p>
        <p className="text-gray-600">Combat tracker will be displayed here.</p>
      </div>
    </div>
  );
};

export default CombatPage;