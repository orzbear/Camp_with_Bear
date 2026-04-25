import { ReactNode } from 'react';

type Variant = 'default' | 'brand' | 'amber' | 'teal' | 'outline';

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-600',
  brand:   'bg-brand-100 text-brand-800',
  amber:   'bg-amber-100 text-amber-800',
  teal:    'bg-teal-100 text-teal-800',
  outline: 'border border-gray-300 text-gray-600',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
