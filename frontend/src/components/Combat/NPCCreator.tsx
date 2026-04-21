import React, { useState } from 'react';

interface NPCCreatorProps {
  onAdd: (data: { npc_name: string; initiative_value: number; hit_points: number; max_hit_points: number; is_visible: boolean }) => void;
}

const NPCCreator: React.FC<NPCCreatorProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [hp, setHp] = useState(10);
  const [initiative, setInitiative] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ npc_name: name, initiative_value: initiative, hit_points: hp, max_hit_points: hp, is_visible: visible });
    setName('');
    setHp(10);
    setInitiative(0);
    setVisible(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Add NPC / Monster</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="NPC name"
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          required
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-600">Initiative</label>
            <input
              type="number"
              value={initiative}
              onChange={e => setInitiative(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600">HP</label>
            <input
              type="number"
              value={hp}
              onChange={e => setHp(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
          Visible to players
        </label>
        <button
          type="submit"
          className="w-full bg-gray-800 text-white rounded py-1.5 text-sm font-medium hover:bg-gray-700"
        >
          Add to Combat
        </button>
      </form>
    </div>
  );
};

export default NPCCreator;
