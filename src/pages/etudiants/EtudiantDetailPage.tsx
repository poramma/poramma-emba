import React from 'react';
import { useParams } from 'react-router-dom';

const EtudiantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Détail de l'étudiant</h1>
      <p>ID: {id}</p>
    </div>
  );
};

export default EtudiantDetailPage;
