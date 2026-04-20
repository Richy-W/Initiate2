import React from 'react';
import { useParams } from 'react-router-dom';
import { CharacterWizard } from '../../components/CharacterCreation/CharacterWizard';
import { CharacterEditor } from '../../components/CharacterEditing/CharacterEditor';

const CharacterCreatePage: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();

  return (
    <div className="character-create-page">
      {characterId ? <CharacterEditor characterId={characterId} /> : <CharacterWizard />}
    </div>
  );
};

export default CharacterCreatePage;