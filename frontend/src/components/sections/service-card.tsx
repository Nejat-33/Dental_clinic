import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Smile } from 'lucide-react';
import type { Service } from '@/types/api';

export function ServiceCard({ service: s }: { service: Service }) {
  return (
    <Link
      href={`/services/${s.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-16/10 bg-brand-50">
        {s.imageUrl ? (
          <Image
            src={s.imageUrl}
            alt={s.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-brand-600">
            <Smile className="size-10" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900">{s.name}</h3>
        {s.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.shortDescription}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          Learn more
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}