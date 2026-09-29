import React from 'react';
import { KlimaatAdvies } from '../types/wine';
import { getKlimaatAdviesInfo } from '../utils/klimaatAdvies';

interface KlimaatBadgeProps {
  advies: KlimaatAdvies | string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const KlimaatBadge: React.FC<KlimaatBadgeProps> = ({
  advies,
  showText = true,
  size = 'md',
  className = ''
}) => {
  const info = getKlimaatAdviesInfo(advies);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${info.badgeClass} ${sizeClasses} ${className}`}
      title={`${info.title}: ${info.description}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass}`} />
      <span className="font-bold">{info.score}</span>
      {showText && <span>{info.title}</span>}
    </span>
  );
};
