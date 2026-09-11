// src/pages/profile/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, Key, Calendar, PenSquare, 
  Settings, Activity, UserCircle
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Tabs } from '../../components/ui/tabs';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { AgentProfileHeader } from '../../components/profile/AgentProfileHeader';
import { PersonalInfoCard } from '../../components/profile/PersonalInfoCard';
import { SecurityPanel } from '../../components/profile/SecurityPanel';
import { RoleAndPermissionsCard } from '../../components/profile/RoleAndPermissionsCard';
import { ServiceAssignmentsCard } from '../../components/profile/ServiceAssignmentsCard';
import { AvailabilitySchedule } from '../../components/profile/AvailabilitySchedule';
import { SignatureCard } from '../../components/profile/SignatureCard';
import { PreferencesPanel } from '../../components/profile/PreferencesPanel';
import { ActivityLogFeed } from '../../components/profile/ActivityLogFeed';
import { useAgentProfile } from '../../hooks/useAgentProfile';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { PermissionCode } from '../../types/auth';
import { AgentProfileData } from '../../types';


type TabType = 'identite' | 'securite' | 'fonction' | 'disponibilites' | 'signature' | 'preferences' | 'activite';

const TABS = [
  { id: 'identite', label: 'Identité', icon: UserCircle },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'fonction', label: 'Fonction & accès', icon: Key },
  { id: 'disponibilites', label: 'Disponibilités', icon: Calendar },
  { id: 'signature', label: 'Signature', icon: PenSquare },
  { id: 'preferences', label: 'Préférences', icon: Settings },
  { id: 'activite', label: 'Activité', icon: Activity },
];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { can } = usePermission();

  const {
    profileData,
    isLoading,
    updateProfile,
    updatePreferences,
    updatePassword,
    updateSignature,
    removeSignature,
    updateAvailability,
    fetchProfile,
    fetchActivities,
    activities,
    isLoadingActivities,
  } = useAgentProfile();

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    return tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'identite';
  });

  useEffect(() => {
    console.log("User Logged in ", user);
    if (user?.id) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (activeTab === 'activite') {
      fetchActivities();
    }
  }, [activeTab]);

  console.log("Profile Data : ", profileData);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabType);
    setSearchParams({ tab: tabId });
  };

  const canGenerateDocuments = can(PermissionCode.DOCUMENT_GENERATE);

  return (
    <PermissionGuard minRoleLevel={5} title="Profil">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête du profil */}
          <AgentProfileHeader
            agentData={profileData as AgentProfileData}
            onAvatarChange={async (file) => {
              // TODO: Upload de la photo de profil
              console.log('Avatar changé:', file);
            }}
            isLoading={isLoading}
          />

          {/* Onglets */}
          <Card className="p-4">
            <Tabs
              tabs={TABS.map(tab => ({
                id: tab.id,
                label: tab.label,
                icon: <tab.icon />,
              }))}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </Card>

          {/* Contenu des onglets */}
          <div className="space-y-6">
            {activeTab === 'identite' && (
              <PersonalInfoCard
                profile={profileData?.profile}
                user={profileData?.user}
                onSave={updateProfile}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'securite' && (
              <SecurityPanel
                user={profileData?.user}
                onPasswordChange={updatePassword}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'fonction' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RoleAndPermissionsCard
                  roles={profileData?.roles || []}
                  activeRole={profileData?.activeRole}
                />
                <ServiceAssignmentsCard
                  assignments={profileData?.assignments || []}
                />
              </div>
            )}

            {activeTab === 'disponibilites' && (
              <AvailabilitySchedule
                availabilities={profileData?.availabilities || []}
                exceptions={profileData?.exceptions || []}
                onAvailabilityUpdate={updateAvailability}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'signature' && canGenerateDocuments && (
              <SignatureCard
                signatureUrl={profileData?.agent?.signatureUrl || null}
                onUpload={updateSignature}
                onRemove={removeSignature}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'preferences' && (
              <PreferencesPanel
                preferences={profileData?.preferences}
                onChange={updatePreferences}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'activite' && (
              <ActivityLogFeed
                activities={activities}
                isLoading={isLoadingActivities}
                lastLoginAt={profileData?.user?.lastLoginAt || null}
                onLoadMore={() => fetchActivities(activities?.length || 0)}
              />
            )}
          </div>

          {/* Pied de confidentialité */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
            Ces informations sont traitées conformément à la politique de protection des données de l'Ambassade.
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ProfilePage;