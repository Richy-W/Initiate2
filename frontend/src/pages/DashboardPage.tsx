import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your D&D Campaign Manager</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/characters/new" className="block text-indigo-600 hover:text-indigo-800">
              Create New Character
            </a>
            <a href="/campaigns" className="block text-indigo-600 hover:text-indigo-800">
              View Campaigns
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
          <p className="text-gray-600">No recent activity</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Statistics</h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Characters: 0</p>
            <p className="text-sm text-gray-600">Campaigns: 0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;