// src/components/ui/avatar/index.tsx

import React from 'react';

// ============================================================
// INTERFACES
// ============================================================

export interface AvatarProps {
  src?: string;                    // URL de l'image avatar
  alt?: string;                    // Texte alternatif
  children?: React.ReactNode;      // Initiales ou contenu personnalisé (fallback)
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  status?: 'online' | 'offline' | 'busy' | 'none';
  className?: string;
  onClick?: () => void;
}

// ============================================================
// CONSTANTES
// ============================================================

const sizeClasses = {
  xsmall: 'h-6 w-6 max-w-6 text-xs',
  small: 'h-8 w-8 max-w-8 text-sm',
  medium: 'h-10 w-10 max-w-10 text-base',
  large: 'h-12 w-12 max-w-12 text-lg',
  xlarge: 'h-14 w-14 max-w-14 text-xl',
  xxlarge: 'h-16 w-16 max-w-16 text-2xl',
};

const statusSizeClasses = {
  xsmall: 'h-1.5 w-1.5 max-w-1.5',
  small: 'h-2 w-2 max-w-2',
  medium: 'h-2.5 w-2.5 max-w-2.5',
  large: 'h-3 w-3 max-w-3',
  xlarge: 'h-3.5 w-3.5 max-w-3.5',
  xxlarge: 'h-4 w-4 max-w-4',
};

const statusColorClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  none: '',
};

const statusBorderClasses = {
  xsmall: 'border-[1.5px]',
  small: 'border-[2px]',
  medium: 'border-[2px]',
  large: 'border-[2.5px]',
  xlarge: 'border-[2.5px]',
  xxlarge: 'border-[3px]',
};

const bgColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Génère une couleur de fond cohérente basée sur le nom
 */
function getBackgroundColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % bgColors.length;
  return bgColors[index];
}

/**
 * Extrait les initiales d'un nom
 */
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

/**
 * Avatar - Composant d'avatar avec support image et fallback
 * 
 * @param {AvatarProps} props
 * @example
 * // Avec image
 * <Avatar src="/path/to/image.jpg" alt="John Doe" size="large" />
 * 
 * // Avec initiales (fallback)
 * <Avatar alt="John Doe" size="large">
 *   JD
 * </Avatar>
 * 
 * // Avec statut en ligne
 * <Avatar src="/path/to/image.jpg" status="online" />
 * 
 * // Avec nom uniquement (génération automatique des initiales)
 * <Avatar alt="John Doe" size="large" />
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  children,
  size = 'medium',
  status = 'none',
  className = '',
  onClick,
}) => {
  const sizeClass = sizeClasses[size];
  const statusSize = statusSizeClasses[size];
  const statusColor = statusColorClasses[status] || '';
  const statusBorder = statusBorderClasses[size];

  // Déterminer le contenu du fallback
  let fallbackContent: React.ReactNode = children;
  
  // Si pas d'enfants mais un alt, générer les initiales
  if (!fallbackContent && alt && alt !== 'Avatar') {
    fallbackContent = getInitials(alt);
  }
  
  // Si toujours pas de contenu, utiliser '?'
  if (!fallbackContent) {
    fallbackContent = '?';
  }

  // Couleur de fond pour le fallback
  const bgColor = alt && alt !== 'Avatar' 
    ? getBackgroundColor(alt) 
    : 'bg-gray-400';

  const hasImage = !!src;

  return (
    <div
      className={`
        relative 
        rounded-full 
        flex-shrink-0
        ${sizeClass}
        ${className}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Avatar Image ou Fallback */}
      {hasImage ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div
          className={`
            w-full h-full 
            rounded-full 
            ${bgColor} 
            flex items-center justify-center 
            text-white font-medium
          `}
        >
          {fallbackContent}
        </div>
      )}

      {/* Status Indicator */}
      {status !== 'none' && (
        <span
          className={`
            absolute bottom-0 right-0 
            rounded-full 
            border-white dark:border-gray-900
            ${statusSize}
            ${statusColor}
            ${statusBorder}
          `}
        />
      )}
    </div>
  );
};

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

/**
 * AvatarGroup - Groupe d'avatars empilés
 */
export const AvatarGroup: React.FC<{
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}> = ({ children, max = 5, size = 'medium', className = '' }) => {
  const childrenArray = React.Children.toArray(children);
  const visible = childrenArray.slice(0, max);
  const remaining = childrenArray.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visible.map((child, index) => (
        <div key={index} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
          {React.cloneElement(child as React.ReactElement, { size })}
        </div>
      ))}
      {remaining > 0 && (
        <div className={`
          ring-2 ring-white dark:ring-gray-800 rounded-full
          ${sizeClasses[size]}
          bg-gray-200 dark:bg-gray-700
          flex items-center justify-center
          text-xs font-medium text-gray-600 dark:text-gray-300
        `}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

/**
 * AvatarWithName - Avatar avec nom à côté
 */
export const AvatarWithName: React.FC<AvatarProps & { 
  name: string; 
  subtitle?: string;
  orientation?: 'horizontal' | 'vertical';
}> = ({ 
  name, 
  subtitle, 
  orientation = 'horizontal',
  size = 'medium',
  ...avatarProps 
}) => {
  const isVertical = orientation === 'vertical';

  return (
    <div className={`flex ${isVertical ? 'flex-col items-center' : 'items-center gap-3'}`}>
      <Avatar alt={name} size={size} {...avatarProps} />
      <div className={isVertical ? 'text-center mt-1' : ''}>
        <div className="font-medium text-gray-900 dark:text-white text-sm">
          {name}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// EXPORTATION PAR DÉFAUT
// ============================================================

export default Avatar;

// ============================================================
// UTILISATION DANS AgentList.tsx
// ============================================================

/* Exemple d'utilisation :

import { Avatar } from '../ui/avatar';

// Dans AgentList :
<Avatar 
  alt={`${agent.user.profile.firstName} ${agent.user.profile.lastName}`}
  size="medium"
  status={agent.active ? 'online' : 'offline'}
  className="flex-shrink-0"
>
  {agent.user.profile.firstName.charAt(0)}
  {agent.user.profile.lastName.charAt(0)}
</Avatar>

// Ou simplement avec les initiales automatiques :
<Avatar 
  alt={`${agent.user.profile.firstName} ${agent.user.profile.lastName}`}
  size="medium"
  status={agent.active ? 'online' : 'offline'}
/>

// Avec image :
<Avatar 
  src={agent.user.profile.avatarUrl}
  alt={`${agent.user.profile.firstName} ${agent.user.profile.lastName}`}
  size="large"
  status="online"
/>

*/