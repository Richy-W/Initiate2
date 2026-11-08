import React, { useState } from 'react';

interface Props {
  resourceKey: string;
  label: string;
  currentUses: number;
  maxUses: number;
  onSpend: (resourceKey: string, amount: number) => Promise<void> | void;
  onSetOverride?: (resourceKey: string, scope: 'character' | 'resource', maxUses: number) => Promise<void> | void;
}

const ResourceCounterControls: React.FC<Props> = ({
  resourceKey,
  label,
  currentUses,
  maxUses,
  onSpend,
  onSetOverride,
}) => {
  const [amount, setAmount] = useState(1);
  const [overrideValue, setOverrideValue] = useState(maxUses);

  const safeAmount = Math.max(1, Number(amount) || 1);
  const canSpend = currentUses > 0;

  return (
    <div>
      <div>{label}</div>
      <div>
        {currentUses}/{maxUses}
      </div>
      <div>
        <button type="button" onClick={() => onSpend(resourceKey, 1)} disabled={!canSpend}>
          -1
        </button>
        <button type="button" onClick={() => onSpend(resourceKey, safeAmount)} disabled={!canSpend}>
          Spend
        </button>
        <input
          aria-label={`${label}-spend-amount`}
          type="number"
          min={1}
          value={safeAmount}
          onChange={(e) => setAmount(Number(e.target.value) || 1)}
        />
      </div>
      {onSetOverride && (
        <div>
          <input
            aria-label={`${label}-override-max`}
            type="number"
            min={0}
            value={Math.max(0, Number(overrideValue) || 0)}
            onChange={(e) => setOverrideValue(Number(e.target.value) || 0)}
          />
          <button type="button" onClick={() => onSetOverride(resourceKey, 'character', Math.max(0, Number(overrideValue) || 0))}>
            Override Character
          </button>
          <button type="button" onClick={() => onSetOverride(resourceKey, 'resource', Math.max(0, Number(overrideValue) || 0))}>
            Override Resource
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceCounterControls;
