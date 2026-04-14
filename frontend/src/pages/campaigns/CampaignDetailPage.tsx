import React from 'react';
import { useParams } from 'react-router-dom';

const CampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Campaign Detail</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Campaign ID: {campaignId}</p>
        <p className="text-gray-600">Campaign details will be displayed here.</p>
      </div>
    </div>
  );
};

export default CampaignDetailPage;