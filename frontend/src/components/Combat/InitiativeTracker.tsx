import React from 'react';
import { InitiativeTracker } from '../../types';

interface InitiativeTrackerProps {
  tracker: InitiativeTracker;
  isDM: boolean;
  onAdvanceTurn: () => void;
  onUpdateHp: (participantId: string, change: number) => void;
  onToggleVisibility: (participantId: string) => void;
  onEndCombat: () => void;
}

const InitiativeTrackerComponent: React.FC<InitiativeTrackerProps> = ({
  tracker,
  isDM,
  onAdvanceTurn,
  onUpdateHp,
  onToggleVisibility,
  onEndCombat,
}) => {
  const participants = tracker.participants || [];
  const activeId = tracker.active_participant;

  const getHpColor = (hp: number, maxHp: number) => {
    if (maxHp === 0) return 'bg-gray-300';
    const pct = hp / maxHp;
    if (pct > 0.5) return 'bg-green-500';
    if (pct > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{tracker.name}</h3>
          <p className="text-sm text-gray-500">Round {tracker.round_number} · {tracker.status}</p>
        </div>
        {isDM && tracker.status === 'active' && (
          <div className="flex gap-2">
            <button
              onClick={onAdvanceTurn}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
            >
              Next Turn
            </button>
            <button
              onClick={onEndCombat}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300"
            >
              End Combat
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {participants
          .filter(p => p.is_active)
          .sort((a, b) => a.turn_order - b.turn_order || b.initiative_value - a.initiative_value)
          .map(p => (
            <div
              key={p.id}
              className={`p-3 rounded-lg border-2 ${p.id === activeId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500 w-6 text-center">{p.initiative_value}</span>
                  <div>
                    <span className={`font-medium ${!p.is_visible && isDM ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                      {p.display}
                      {isDM && !p.is_visible && <span className="text-xs ml-1">(hidden)</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    {p.hit_points}/{p.max_hit_points} HP
                  </span>
                  {isDM && (
                    <>
                      <button
                        onClick={() => onUpdateHp(p.id, -1)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >-</button>
                      <button
                        onClick={() => onUpdateHp(p.id, 1)}
                        className="text-green-600 hover:text-green-800 font-bold"
                      >+</button>
                      <button
                        onClick={() => onToggleVisibility(p.id)}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                      >
                        {p.is_visible ? 'Hide' : 'Show'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {p.max_hit_points > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${getHpColor(p.hit_points, p.max_hit_points)}`}
                    style={{ width: `${Math.max(0, Math.min(100, (p.hit_points / p.max_hit_points) * 100))}%` }}
                  />
                </div>
              )}
            </div>
          ))}
      </div>

      {(tracker.spell_effects || []).length > 0 && (
        <div className="mt-4 border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Effects</h4>
          <div className="space-y-1">
            {(tracker.spell_effects || []).map(effect => (
              <div key={effect.id} className="flex justify-between text-sm bg-purple-50 p-2 rounded">
                <span className="font-medium text-purple-800">{effect.spell_name}</span>
                <span className="text-purple-600">{effect.duration_rounds}r{effect.concentration ? ' ©' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativeTrackerComponent;
