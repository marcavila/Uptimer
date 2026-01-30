import type { KeyboardEvent, ReactNode } from 'react';

// Status Badge Component
interface BadgeProps {
  variant: 'up' | 'down' | 'maintenance' | 'paused' | 'unknown' | 'info';
  children: ReactNode;
  size?: 'sm' | 'md';
}

const badgeStyles = {
  up: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  down: 'bg-red-50 text-red-700 ring-red-600/20',
  maintenance: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paused: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  unknown: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  info: 'bg-slate-100 text-slate-600 ring-slate-500/10',
};

export function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${badgeStyles[variant]} ${sizeClass}`}>
      {children}
    </span>
  );
}

// Status Dot Component
interface StatusDotProps {
  status: 'up' | 'down' | 'maintenance' | 'paused' | 'unknown';
  pulse?: boolean;
}

const dotColors = {
  up: 'bg-emerald-500',
  down: 'bg-red-500',
  maintenance: 'bg-blue-500',
  paused: 'bg-amber-500',
  unknown: 'bg-slate-400',
};

export function StatusDot({ status, pulse = false }: StatusDotProps) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {pulse && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColors[status]}`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotColors[status]}`} />
    </span>
  );
}

// Card Component
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const hoverClass = hover ? 'hover:shadow-soft-lg hover:border-slate-200 cursor-pointer' : '';
  const clickProps = onClick ? {
    onClick,
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      // Only handle keys when the Card itself is focused (not inner interactive children).
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onClick();
      }
    },
    role: 'button',
    tabIndex: 0,
  } : {};

  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 shadow-soft transition-all duration-200 ${hoverClass} ${className}`}
      {...clickProps}
    >
      {children}
    </div>
  );
}

// Button Component
export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean | undefined;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

const buttonVariants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150
        ${buttonVariants[variant]} ${buttonSizes[size]}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
    >
      {children}
    </button>
  );
}
