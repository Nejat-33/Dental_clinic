import { cn } from '@/lib/cn';

const variants = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  light: 'bg-white text-brand-700 hover:bg-brand-50',
};

const sizes = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    'disabled:pointer-events-none disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}