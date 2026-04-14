import React from 'react';
import { CharacterWizard } from '../../components/CharacterCreation/CharacterWizard';

const CharacterCreatePage: React.FC = () => {
  return (
    <div className="character-create-page">
      <CharacterWizard />
    </div>
  );
};

export default CharacterCreatePage;