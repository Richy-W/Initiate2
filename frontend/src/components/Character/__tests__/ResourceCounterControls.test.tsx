import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ResourceCounterControls from '../ResourceCounterControls';

describe('ResourceCounterControls', () => {
  it('supports quick and numeric spend actions', async () => {
    const onSpend = jest.fn().mockResolvedValue(undefined);

    render(
      <ResourceCounterControls
        resourceKey="species:dragonborn:breath_weapon"
        label="Breath Weapon"
        currentUses={3}
        maxUses={3}
        onSpend={onSpend}
      />
    );

    fireEvent.click(screen.getByText('-1'));
    expect(onSpend).toHaveBeenCalledWith('species:dragonborn:breath_weapon', 1);

    fireEvent.change(screen.getByLabelText('Breath Weapon-spend-amount'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Spend'));
    expect(onSpend).toHaveBeenCalledWith('species:dragonborn:breath_weapon', 2);
  });

  it('supports both character and resource override scopes', async () => {
    const onSpend = jest.fn().mockResolvedValue(undefined);
    const onSetOverride = jest.fn().mockResolvedValue(undefined);

    render(
      <ResourceCounterControls
        resourceKey="class:fighter:second_wind"
        label="Second Wind"
        currentUses={1}
        maxUses={1}
        onSpend={onSpend}
        onSetOverride={onSetOverride}
      />
    );

    fireEvent.change(screen.getByLabelText('Second Wind-override-max'), { target: { value: '4' } });
    fireEvent.click(screen.getByText('Override Character'));
    fireEvent.click(screen.getByText('Override Resource'));

    expect(onSetOverride).toHaveBeenCalledWith('class:fighter:second_wind', 'character', 4);
    expect(onSetOverride).toHaveBeenCalledWith('class:fighter:second_wind', 'resource', 4);
  });
});
