// src/store/agentProfileStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AgentProfileData, AgentPreferences, ActivityLogEntry } from '../types/profile';
import { UserProfile, AgentAvailability } from '../types/auth';
import { api } from '../lib/api';

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface AgentProfileState {
  profileData: AgentProfileData | null;
  activities: ActivityLogEntry[];
  hasMoreActivities: boolean;
  isLoading: boolean;
  isLoadingActivities: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<AgentPreferences>) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  updateSignature: (file: File) => Promise<void>;
  removeSignature: () => Promise<void>;
  updateAvailability: (availabilities: AgentAvailability[]) => Promise<void>;
  fetchActivities: (offset?: number) => Promise<void>;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

export const useAgentProfileStore = create<AgentProfileState>()(
  immer((set) => ({
    // État initial
    profileData: null,
    activities: [],
    hasMoreActivities: false,
    isLoading: false,
    isLoadingActivities: false,
    error: null,

    fetchProfile: async () => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data } = await api.get('/profile');
        set((state) => { state.profileData = data.data; });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement du profil';
        });
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updateProfile: async (data) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data: response } = await api.patch('/profile', data);
        set((state) => {
          if (state.profileData) state.profileData.profile = response.data;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updatePreferences: async (preferences) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        const { data: response } = await api.patch('/profile/preferences', preferences);
        set((state) => {
          if (state.profileData) state.profileData.preferences = response.data;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    updatePassword: async (data) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await api.post('/profile/password', data);
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    // NOT WIRED — needs packages/storage (MinIO) on the backend, Phase 7.
    // Left as client-side-only so the UI doesn't hard-crash if exercised.
    updateSignature: async (file) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await new Promise((r) => setTimeout(r, 400));
        set((state) => {
          if (state.profileData) {
            state.profileData.agent.signatureUrl = URL.createObjectURL(file);
          }
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de téléversement';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    // NOT WIRED — see updateSignature above.
    removeSignature: async () => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await new Promise((r) => setTimeout(r, 200));
        set((state) => {
          if (state.profileData) state.profileData.agent.signatureUrl = null;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de suppression';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    // NOT WIRED — availabilities belong to ambassade-api's schedule
    // tables, which don't exist before Phase 6.
    updateAvailability: async (availabilities) => {
      set((state) => { state.isLoading = true; state.error = null; });

      try {
        await new Promise((r) => setTimeout(r, 200));
        set((state) => {
          if (state.profileData) state.profileData.availabilities = availabilities;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de mise à jour';
        });
        throw err;
      } finally {
        set((state) => { state.isLoading = false; });
      }
    },

    // Activité personnelle = ses propres lignes du journal d'audit (paginées, 20 par page).
    fetchActivities: async (offset = 0) => {
      set((state) => { state.isLoadingActivities = true; state.error = null; });

      try {
        const limit = 20;
        const page = Math.floor(offset / limit) + 1;
        const { data } = await api.get('/audit/me', { params: { page, limit } });
        set((state) => {
          state.activities = offset === 0 ? data.data : [...state.activities, ...data.data];
          state.hasMoreActivities = !!data.meta?.hasNext;
        });
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Erreur de chargement des activités';
        });
      } finally {
        set((state) => { state.isLoadingActivities = false; });
      }
    },
  }))
);
