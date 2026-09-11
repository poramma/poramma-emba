// ============================================================
// src/components/ui/progress.tsx
// ============================================================

import React from 'react';
import { cn } from '../../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside';
  animated?: boolean;
  striped?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  barClassName,
  size = 'md',
  variant = 'default',
  showLabel = false,
  labelPosition = 'outside',
  animated = false,
  striped = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label outside */}
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progression</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}

      {/* Bar container */}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variant === 'default' ? 'bg-brand-500' : variantClasses[variant],
            animated && 'animate-progress',
            striped && 'progress-striped',
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Label inside */}
          {showLabel && labelPosition === 'inside' && size === 'lg' && (
            <span className="flex items-center justify-center h-full text-xs font-medium text-white px-2">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Circular Progress ──
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  className,
  showLabel = true,
  variant = 'default',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-500', variantColors[variant])}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-semibold text-gray-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// ── Step Progress ──
interface StepProgressProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isCompleted && 'bg-brand-500 text-white',
                    isCurrent && 'bg-brand-500 text-white ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  )}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 text-center max-w-[80px]',
                    isCompleted || isCurrent ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 -mt-6',
                    index < currentStep ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
