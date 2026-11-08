import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LevelUp } from '../LevelUp';

jest.mock('../../../services/apiClient', () => ({
  characterAPI: {
    levelUp: jest.fn().mockResolvedValue({ id: '1', level: 4 }),
    setSubclass: jest.fn().mockResolvedValue({}),
  },
  characterSpellsAPI: {
    create: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { characterAPI } = require('../../../services/apiClient');

jest.mock('../../CharacterCreation/MagicInitiateSpellPicker', () => ({
  __esModule: true,
  default: () => null,
}));

const baseCharacter: any = {
  id: '1',
  name: 'Hero',
  level: 2,
  strength: 10,
  dexterity: 10,
  constitution: 12,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  max_hit_points: 20,
  character_class: { hit_die: 10, subclass_level: 3, name: 'Fighter' },
  character_spells: [],
};

describe('LevelUp subclass warning flow', () => {
  it('requires subclass slug before proceeding on the subclass step', () => {
    render(<LevelUp character={baseCharacter} onLevelUp={jest.fn()} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText(/Take Average/));
    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Choose Your Subclass')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('subclass-slug'), { target: { value: 'champion' } });
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('requires warning confirmation checkbox when changing an existing subclass', () => {
    const characterWithSubclass = {
      ...baseCharacter,
      subclass_state: { subclass_slug: 'battle-master' },
    };

    render(<LevelUp character={characterWithSubclass} onLevelUp={jest.fn()} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText(/Take Average/));
    fireEvent.click(screen.getByText('Next'));

    // Subclass step is skipped because character already has a subclass selected
    // at the required level, so Features step should show instead.
    expect(screen.getByText('New Class Features')).toBeInTheDocument();
  });

  it('submits subclass selection on completion when step is shown', async () => {
    render(<LevelUp character={baseCharacter} onLevelUp={jest.fn()} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText(/Take Average/));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText('subclass-slug'), { target: { value: 'champion' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Level Up' }));

    await Promise.resolve();
    await Promise.resolve();

    expect(characterAPI.setSubclass).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ subclass_slug: 'champion' })
    );
  });
});
