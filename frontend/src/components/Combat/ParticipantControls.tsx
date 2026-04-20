import React from 'react';
import { InitiativeParticipant } from '../../types';

interface ParticipantControlsProps {
  participant: InitiativeParticipant;
  isDM: boolean;
  onToggleVisibility: (participantId: string) => void;
  onUpdateHp?: (participantId: string, change: number) => void;
  isActive?: boolean;
}

const ParticipantControls: React.FC<ParticipantControlsProps> = ({
  participant,
  isDM,
  onToggleVisibility,
  onUpdateHp,
  isActive,
}) => {
  return (
    <div className={`flex items-center gap-2 text-sm ${isActive ? 'bg-yellow-50 rounded p-1' : ''}`}>
      {/* HP Indicator */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-gray-500 text-xs">HP</span>
        <span className={`font-medium ${participant.hit_points <= participant.max_hit_points * 0.25 ? 'text-red-600' : participant.hit_points <= participant.max_hit_points * 0.5 ? 'text-yellow-600' : 'text-green-600'}`}>
          {isDM ? `${participant.hit_points}/${participant.max_hit_points}` : '?'}
        </span>
      </div>

      {isDM && onUpdateHp && (
        <div className="flex gap-1">
          <button
            onClick={() => onUpdateHp(participant.id, -1)}
            className="w-6 h-6 rounded bg-red-100 text-red-700 hover:bg-red-200 font-bold text-xs flex items-center justify-center"
            title="Damage 1"
          >
            −
          </button>
          <button
            onClick={() => onUpdateHp(participant.id, 1)}
            className="w-6 h-6 rounded bg-green-100 text-green-700 hover:bg-green-200 font-bold text-xs flex items-center justify-center"
            title="Heal 1"
          >
            +
          </button>
        </div>
      )}

      {isDM && (
        <button
          onClick={() => onToggleVisibility(participant.id)}
          className={`w-6 h-6 rounded text-xs flex items-center justify-center ${participant.is_visible ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          title={participant.is_visible ? 'Hide from players' : 'Show to players'}
        >
          {participant.is_visible ? '👁' : '🚫'}
        </button>
      )}
    </div>
  );
};

export default ParticipantControls;
