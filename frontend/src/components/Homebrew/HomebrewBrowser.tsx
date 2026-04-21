import React, { useEffect, useState } from 'react';
import { HomebrewContent } from '../../types';
import homebrewService from '../../services/homebrewService';

interface HomebrewBrowserProps {
  onSelect?: (item: HomebrewContent) => void;
}

const HomebrewBrowser: React.FC<HomebrewBrowserProps> = ({ onSelect }) => {
  const [items, setItems] = useState<HomebrewContent[]>([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    const data = await homebrewService.list();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="homebrew-browser">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search homebrew content"
        className="homebrew-search"
      />

      <div className="homebrew-list">
        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect?.(item)}
            className="homebrew-item"
          >
            <div className="homebrew-item-header">
              <span className="homebrew-item-name">{item.name}</span>
              <span className="homebrew-version-badge">v{item.version}</span>
            </div>
            <p className="homebrew-item-meta">{item.content_type} • {item.status}</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="homebrew-empty">No homebrew content found. Homebrew can be created and published by a DM.</p>}
      </div>
    </div>
  );
};

export default HomebrewBrowser;
