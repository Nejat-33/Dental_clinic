import { cn } from '@/lib/cn';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
};

export function SectionHeading({ eyebrow, title, description, center = true }: Props) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-slate-600">{description}</p>}
    </div>
  );
}