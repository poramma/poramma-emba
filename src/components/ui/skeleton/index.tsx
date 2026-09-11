// ============================================================
// src/components/ui/skeleton.tsx
// ============================================================

import React from 'react';
import { cn } from '../../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  width,
  height,
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md';

  const variantClasses = {
    default: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded-sm h-4',
    card: 'rounded-xl h-32',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant], className)}
          style={style}
        />
      ))}
    </>
  );
};

// Variantes prédéfinies pour usage rapide
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3 p-4', className)}>
    <Skeleton variant="text" width="40%" />
    <Skeleton variant="text" />
    <Skeleton variant="text" width="80%" />
    <div className="flex gap-2 mt-4">
      <Skeleton variant="circle" className="w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="50%" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`h-${i}`} variant="text" width="60%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={rowIdx}
        className="grid gap-4 items-center"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, colIdx) => (
          <Skeleton key={`${rowIdx}-${colIdx}`} variant="text" />
        ))}
      </div>
    ))}
  </div>
);