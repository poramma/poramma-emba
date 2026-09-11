// src/hooks/useAgentProfile.ts

import { useCallback, useMemo } from 'react';
import { useAgentProfileStore } from '../store/agentProfileStore';
import { AgentProfileData, AgentPreferences } from '../types/profile';

interface UseAgentProfileReturn {
  profileData: AgentProfileData | null;
  activities: any[];
  isLoading: boolean;
  isLoadingActivities: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<any>) => Promise<void>;
  updatePreferences: (preferences: Partial<AgentPreferences>) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  updateSignature: (file: File) => Promise<void>;
  removeSignature: () => Promise<void>;
  updateAvailability: (availabilities: any[]) => Promise<void>;
  fetchActivities: (offset?: number) => Promise<void>;
}

export const useAgentProfile = (): UseAgentProfileReturn => {
  const store = useAgentProfileStore();

  const {
    profileData,
    activities,
    isLoading,
    isLoadingActivities,
    error,
    fetchProfile,
    updateProfile,
    updatePreferences,
    updatePassword,
    updateSignature,
    removeSignature,
    updateAvailability,
    fetchActivities,
  } = store;

  return {
    profileData,
    activities,
    isLoading,
    isLoadingActivities,
    error,
    fetchProfile,
    updateProfile,
    updatePreferences,
    updatePassword,
    updateSignature,
    removeSignature,
    updateAvailability,
    fetchActivities,
  };
};