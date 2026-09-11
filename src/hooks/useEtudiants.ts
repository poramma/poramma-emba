// Recherche, filtrage, validation
import { useState, useCallback } from 'react';
import api from '../lib/api';

export const useEtudiants = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEtudiants = useCallback(async (filters?: any) => {
    setLoading(true);
    try {
      const response = await api.get('/etudiants', { params: filters });
      setEtudiants(response.data.data);
    } catch (error) {
      console.error('Error fetching etudiants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateEtudiant = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.patch();
      return response.data;
    } catch (error) {
      console.error('Error validating etudiant:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    etudiants,
    loading,
    fetchEtudiants,
    validateEtudiant,
  };
};
