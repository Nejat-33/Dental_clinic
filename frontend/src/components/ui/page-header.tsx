import { Container } from '@/components/ui/container';

type Props = { eyebrow?: string; title: string; description?: string };

export function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <section className="bg-linear-to-b from-brand-50 to-white">
      <Container className="py-14 text-center sm:py-20">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{description}</p>}
      </Container>
    </section>
  );
}