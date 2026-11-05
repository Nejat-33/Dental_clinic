import { BadgeCheck, HeartHandshake, ScanLine } from 'lucide-react';

const highlights = [
  {
    title: '100% Digital Workflow',
    description: 'Precision 3D imaging & computer-guided treatments',
    Icon: ScanLine,
  },
  {
    title: 'Painless & Gentle Care',
    description: 'Advanced sedation options and ultra-comfortable recovery',
    Icon: HeartHandshake,
  },
  {
    title: 'ISO Certified Sterilization',
    description: 'Hospital-grade hygiene protocols for complete safety',
    Icon: BadgeCheck,
  },
];

export default function SmileEstimator() {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-3">
      {highlights.map(({ title, description, Icon }) => (
        <article
          key={title}
          className="rounded-3xl border border-[#eee2dc] bg-white p-6 shadow-[0_16px_40px_-30px_rgba(80,48,36,0.3)]"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-[#f7ebe6] text-[#d57f6d]">
            <Icon className="size-5" strokeWidth={1.7} />
          </span>
          <h3 className="mt-5 font-serif text-xl tracking-tight text-[#2c1d18]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#817068]">{description}</p>
        </article>
      ))}
    </div>
  );
}
