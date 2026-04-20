import React, { useState } from 'react';
import { HomebrewContent } from '../../types';
import homebrewService from '../../services/homebrewService';

interface HomebrewCreatorProps {
  initial?: Partial<HomebrewContent>;
  onSaved?: (content: HomebrewContent) => void;
}

const HomebrewCreator: React.FC<HomebrewCreatorProps> = ({ initial, onSaved }) => {
  const [name, setName] = useState(initial?.name || '');
  const [contentType, setContentType] = useState<HomebrewContent['content_type']>(initial?.content_type || 'species');
  const [description, setDescription] = useState(initial?.description || '');
  const [dataText, setDataText] = useState(JSON.stringify(initial?.data || {}, null, 2));
  const [dependenciesText, setDependenciesText] = useState((initial?.dependencies || []).join(', '));
  const [isPublic, setIsPublic] = useState(initial?.is_public || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      const data = JSON.parse(dataText);
      const dependencies = dependenciesText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        name,
        content_type: contentType,
        description,
        data,
        dependencies,
        is_public: isPublic,
      };

      const result = initial?.id
        ? await homebrewService.update(initial.id, payload)
        : await homebrewService.create(payload);

      onSaved?.(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save homebrew content. Check JSON format.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Homebrew Creator</h3>
      {error && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</div>}

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Content name"
        className="w-full border border-gray-300 rounded px-3 py-2"
        required
      />

      <select
        value={contentType}
        onChange={e => setContentType(e.target.value as HomebrewContent['content_type'])}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="species">Species</option>
        <option value="class">Class</option>
        <option value="background">Background</option>
        <option value="spell">Spell</option>
        <option value="equipment">Equipment</option>
        <option value="feat">Feat</option>
        <option value="monster">Monster</option>
        <option value="magic_item">Magic Item</option>
        <option value="other">Other</option>
      </select>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <textarea
        value={dataText}
        onChange={e => setDataText(e.target.value)}
        placeholder="JSON data"
        rows={8}
        className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
      />

      <input
        value={dependenciesText}
        onChange={e => setDependenciesText(e.target.value)}
        placeholder="Dependencies (comma-separated IDs)"
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
        Publicly visible
      </label>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Homebrew'}
      </button>
    </form>
  );
};

export default HomebrewCreator;
