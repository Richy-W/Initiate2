import React from 'react';

const CampaignsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">No campaigns available.</p>
      </div>
    </div>
  );
};

export default CampaignsPage;