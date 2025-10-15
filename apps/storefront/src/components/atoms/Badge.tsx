// apps/storefront/src/components/atoms/Badge.tsx

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success';
  className?: string; // Allow className to be passed
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const baseClasses = 'px-2 py-1 text-xs font-bold rounded-full inline-block';

  const variantClasses = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
  };

  // Combine the base, variant, and any passed-in classes
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return <span className={combinedClasses}>{children}</span>;
}