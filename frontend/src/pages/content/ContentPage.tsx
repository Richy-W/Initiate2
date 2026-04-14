import React from 'react';
import { useParams } from 'react-router-dom';

const ContentPage: React.FC = () => {
  const { contentType } = useParams<{ contentType?: string }>();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        D&D Content {contentType ? `- ${contentType}` : ''}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">D&D content browser will be displayed here.</p>
        <p className="text-gray-600">Content type: {contentType || 'All'}</p>
      </div>
    </div>
  );
};

export default ContentPage;