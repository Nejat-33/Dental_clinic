import { cn } from '@/lib/cn';

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
      {message}{' '}
      <button className="font-semibold underline" onClick={onRetry}>
        Retry
      </button>
    </p>
  );
}

export function EmptyBox({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">{children}</p>;
}

export function FilterTabs({
  tabs, value, onChange,
}: { tabs: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.label}
          onClick={() => onChange(t.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition',
            value === t.value
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}