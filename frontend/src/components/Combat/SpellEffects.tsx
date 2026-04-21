import React, { useState } from 'react';

interface SpellEffectsProps {
  effects: Array<{
    id: string;
    spell_name: string;
    caster_name: string;
    duration_rounds: number;
    concentration: boolean;
    description: string;
    is_visible: boolean;
  }>;
  isDM: boolean;
  onAddEffect: (data: { caster_id: string; spell_name: string; duration_rounds: number; concentration: boolean; description: string }) => void;
  onRemoveEffect: (effectId: string) => void;
  participants: Array<{ id: string; display: string }>;
}

const SpellEffects: React.FC<SpellEffectsProps> = ({ effects, isDM, onAddEffect, onRemoveEffect, participants }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    caster_id: '',
    spell_name: '',
    duration_rounds: 1,
    concentration: false,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEffect(form);
    setShowForm(false);
    setForm({ caster_id: '', spell_name: '', duration_rounds: 1, concentration: false, description: '' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Spell Effects</h3>
        {isDM && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showForm ? 'Cancel' : '+ Add Effect'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-gray-50 rounded">
          <select
            value={form.caster_id}
            onChange={e => setForm(p => ({ ...p, caster_id: e.target.value }))}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            required
          >
            <option value="">Select caster</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.display}</option>
            ))}
          </select>
          <input
            type="text"
            value={form.spell_name}
            onChange={e => setForm(p => ({ ...p, spell_name: e.target.value }))}
            placeholder="Spell name"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={form.duration_rounds}
              onChange={e => setForm(p => ({ ...p, duration_rounds: parseInt(e.target.value) || 1 }))}
              min={1}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.concentration}
                onChange={e => setForm(p => ({ ...p, concentration: e.target.checked }))}
              />
              Concentration
            </label>
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white rounded py-1 text-sm hover:bg-purple-700">
            Add Effect
          </button>
        </form>
      )}

      {effects.length === 0 ? (
        <p className="text-gray-500 text-xs">No active effects.</p>
      ) : (
        <div className="space-y-1">
          {effects.map(effect => (
            <div key={effect.id} className="flex justify-between items-start p-2 bg-purple-50 rounded text-sm">
              <div>
                <span className="font-medium text-purple-900">{effect.spell_name}</span>
                {effect.concentration && <span className="text-xs text-purple-600 ml-1">©</span>}
                <span className="text-purple-600 ml-2">{effect.duration_rounds}r</span>
                <div className="text-xs text-purple-700 opacity-70">by {effect.caster_name}</div>
              </div>
              {isDM && (
                <button onClick={() => onRemoveEffect(effect.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpellEffects;
