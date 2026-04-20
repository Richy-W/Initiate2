import React, { useEffect, useState } from 'react';
import { HomebrewContent } from '../../types';
import homebrewService from '../../services/homebrewService';

const ContentModeration: React.FC = () => {
  const [items, setItems] = useState<HomebrewContent[]>([]);

  const load = async () => {
    const data = await homebrewService.list();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleModerate = async (id: string, status: 'draft' | 'published' | 'archived') => {
    await homebrewService.moderate(id, status);
    load();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Content Moderation</h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="border border-gray-200 rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.content_type} • {item.creator_username} • {item.status}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleModerate(item.id, 'published')} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200">Publish</button>
                <button onClick={() => handleModerate(item.id, 'draft')} className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Draft</button>
                <button onClick={() => handleModerate(item.id, 'archived')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">Archive</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No content available for moderation.</p>}
      </div>
    </div>
  );
};

export default ContentModeration;
