import type { Metadata } from 'next';
import { ArrowDown, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { TreatmentCalculator } from '@/components/sections/treatment-calculator';

export const metadata: Metadata = {
  title: 'Smile Treatment Calculator',
  description: 'Explore a starting point for your dental treatment journey and estimated timeline.',
};

export default function CalculatorPage() {
  return (
    <>
      <section className="bg-[#fdf7f5] px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-20 lg:px-12">
        <Container className="grid max-w-[1440px] gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#eadbd3] bg-white/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a66e5e]">
              <Sparkles className="size-3.5 text-[#d57f6d]" />
              A first step, made simple
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.055em] text-[#2c1d18] sm:text-6xl lg:text-7xl">
              Imagine your smile journey.
            </h1>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-7 text-[#817068]">
              Explore an initial treatment goal and see an illustrative cost and timeline range. Your specialist will tailor the final plan after a consultation.
            </p>
            <a href="#estimator" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#a65f4f] transition hover:text-[#2c1d18]">
              Explore the estimator <ArrowDown className="size-3.5" />
            </a>
          </div>
        </Container>
      </section>
      <div id="estimator" className="scroll-mt-24">
        <TreatmentCalculator />
      </div>
    </>
  );
}
