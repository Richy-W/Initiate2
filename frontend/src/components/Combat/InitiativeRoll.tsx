import React, { useState } from 'react';
import { InitiativeParticipant } from '../../types';

interface InitiativeRollProps {
  participants: InitiativeParticipant[];
  onSubmitRoll: (participantId: string, value: number) => void;
}

const InitiativeRoll: React.FC<InitiativeRollProps> = ({ participants, onSubmitRoll }) => {
  const [rolls, setRolls] = useState<Record<string, string>>({});

  const rollDice = (dexMod: number = 0) => Math.floor(Math.random() * 20) + 1 + dexMod;

  const playerParticipants = participants.filter(p => p.character !== null);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Roll for Initiative!</h3>
      <div className="space-y-2">
        {playerParticipants.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            <span className="flex-1 font-medium text-gray-900">{p.display}</span>
            <input
              type="number"
              value={rolls[p.id] ?? ''}
              onChange={e => setRolls(prev => ({ ...prev, [p.id]: e.target.value }))}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-sm"
              placeholder="Roll"
              min={1}
              max={30}
            />
            <button
              onClick={() => {
                const val = parseInt(rolls[p.id] || '0') || rollDice();
                setRolls(prev => ({ ...prev, [p.id]: String(val) }));
                onSubmitRoll(p.id, val);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InitiativeRoll;
