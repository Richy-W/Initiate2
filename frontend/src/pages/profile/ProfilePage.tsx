import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        {user && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{user.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <p className="text-gray-900">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">DM Status</label>
              <p className="text-gray-900">{user.is_dm ? 'Dungeon Master' : 'Player'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;