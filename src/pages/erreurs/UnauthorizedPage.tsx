import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <h2 className="text-2xl font-semibold mt-4">Accès interdit</h2>
        <p className="text-gray-600 mt-2">Vous n'avez pas les permissions nécessaires.</p>
        <Link to="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
