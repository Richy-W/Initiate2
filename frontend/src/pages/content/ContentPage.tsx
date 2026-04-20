import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/pages.css';

type ContentTab = 'spells' | 'classes' | 'species' | 'backgrounds' | 'equipment' | 'monsters';

const TABS: { id: ContentTab; label: string; icon: string; description: string }[] = [
  { id: 'spells',      label: 'Spells',      icon: '✨', description: 'Cantrips and spells from all classes.' },
  { id: 'classes',     label: 'Classes',     icon: '⚔️', description: '12 playable character classes.' },
  { id: 'species',     label: 'Species',     icon: '🌿', description: 'Races and species available for characters.' },
  { id: 'backgrounds', label: 'Backgrounds', icon: '📜', description: 'Character backstory and proficiency packages.' },
  { id: 'equipment',   label: 'Equipment',   icon: '🛡️', description: 'Weapons, armor, and adventuring gear.' },
  { id: 'monsters',    label: 'Monsters',    icon: '🐉', description: 'Creatures and monsters for encounters.' },
];

const ContentPage: React.FC = () => {
  const { contentType } = useParams<{ contentType?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentTab>(
    (contentType as ContentTab) ?? 'spells'
  );

  const handleTab = (id: ContentTab) => {
    setActiveTab(id);
    navigate(`/content/${id}`, { replace: true });
  };

  const current = TABS.find(t => t.id === activeTab) ?? TABS[0];

  return (
    <div className="pg-shell">
      <div className="pg-inner">

        {/* Hero */}
        <div className="pg-hero">
          <div className="pg-hero-text">
            <h1>D&amp;D Content</h1>
            <p>Browse rules, spells, items, and lore from the Player's Handbook.</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="pg-tabs" role="tablist" aria-label="Content categories">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`pg-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => handleTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="pg-card">
          <p className="pg-card-title">{current.icon} {current.label}</p>
          <div className="pg-empty" style={{ padding: '40px 0 20px' }}>
            <span className="pg-empty__icon">{current.icon}</span>
            <h3 className="pg-empty__title">{current.label} browser</h3>
            <p className="pg-empty__body">{current.description} Full browsing coming soon.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContentPage;