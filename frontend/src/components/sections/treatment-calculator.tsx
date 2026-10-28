'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, MoveHorizontal, Sparkles } from 'lucide-react';

const goals = [
  'Straighter teeth',
  'Replace a missing tooth',
  'A brighter smile',
  'Complete makeover',
] as const;
const methods = ['Aligners', 'Veneers', 'Implants'] as const;
type Goal = (typeof goals)[number];
type Method = (typeof methods)[number];

export function TreatmentCalculator() {
  const [goal, setGoal] = useState<Goal>(goals[0]);
  const [method, setMethod] = useState<Method>(methods[0]);
  const [previewAngle, setPreviewAngle] = useState(0);

  const estimate = useMemo(() => {
    let min = 12_000;
    let max = 38_000;
    let time = '2–4 visits';
    let complexity = 42;
    let specialist = 'Aesthetic dentist';
    let methodNote = `${method} is an initial preference; your clinician will confirm whether it suits your goals.`;

    if (goal === 'Straighter teeth') {
      min = 28_000;
      max = 62_000;
      time = '6–18 months';
      complexity = 64;
      specialist = 'Orthodontist';
      if (method === 'Veneers') {
        min = 22_000;
        max = 60_000;
        time = '2–4 visits';
        complexity = 56;
        specialist = 'Aesthetic dentist';
      } else if (method === 'Implants') {
        methodNote = 'Implants are not typically used to straighten teeth. Ask your clinician about suitable options.';
      }
    }

    if (goal === 'Replace a missing tooth') {
      min = 45_000;
      max = 90_000;
      time = '3–6 months';
      complexity = 78;
      specialist = 'Implant specialist';
      if (method !== 'Implants') {
        methodNote = 'Implants are the usual option for replacing a missing tooth; your clinician can discuss alternatives.';
      }
    }

    if (goal === 'A brighter smile') {
      min = 8_000;
      max = 20_000;
      time = '1–2 visits';
      complexity = 24;
      specialist = 'Aesthetic dentist';
      if (method === 'Veneers') {
        min = 20_000;
        max = 48_000;
        time = '2–4 visits';
        complexity = 52;
      } else {
        methodNote = `${method} is not typically used for tooth whitening. Ask your clinician about suitable options.`;
      }
    }

    if (goal === 'Complete makeover') {
      min = 55_000;
      max = 120_000;
      time = '4–8 visits';
      complexity = 86;
      specialist = 'Multidisciplinary team';
    }

    return { min, max, time, complexity, specialist, methodNote };
  }, [goal, method]);

  return (
    <section className="bg-[#2c1d18] px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.85fr_1fr]">
          <div className="space-y-3">
            <fieldset className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <legend className="px-2 text-xs font-semibold">01 <span className="ml-2 text-white/55">What would you love to change?</span></legend>
              <div className="mt-3 grid gap-2">
                {goals.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-xs transition ${
                      goal === option ? 'bg-[#d57f6d] text-white' : 'text-white/65 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span>{option}</span>
                    <input
                      type="radio"
                      name="treatment-goal"
                      value={option}
                      checked={goal === option}
                      onChange={() => setGoal(option)}
                      className="size-4 accent-[#2c1d18]"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <legend className="px-2 text-xs font-semibold">02 <span className="ml-2 text-white/55">Your preferred method</span></legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {methods.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={method === option}
                    onClick={() => setMethod(option)}
                    className={`rounded-full border px-4 py-2.5 text-[11px] transition ${
                      method === option
                        ? 'border-[#d57f6d] bg-[#d57f6d] text-white'
                        : 'border-white/15 text-white/65 hover:border-white/40'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <p className="text-xs font-semibold">A helpful first conversation</p>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Your choices help frame the discussion. A clinician will confirm what is appropriate for your smile.
              </p>
            </div>
          </div>

          <div className="relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#60473c] via-[#392820] to-[#281c17] p-6">
            <div className="absolute size-64 rounded-full border border-white/10" />
            <div className="absolute size-48 rounded-full border border-white/10" />
            <div className="absolute size-32 rounded-full border border-white/10" />
            <div
              className="relative flex size-44 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] shadow-[0_0_70px_rgba(213,127,109,0.16)]"
              style={{ transform: `perspective(700px) rotateY(${previewAngle}deg)`, transition: 'transform 300ms ease-out' }}
            >
              <NextImage
                src="/smile-illustration.svg"
                alt="Illustration of a smile"
                width={240}
                height={240}
                className="size-36 rounded-full object-cover opacity-90"
              />
              <span className="absolute -right-2 top-7 grid size-8 place-items-center rounded-full bg-[#d57f6d]">
                <Sparkles className="size-3.5" />
              </span>
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-white/50">Your smile, in focus</p>
            <label className="mt-4 flex w-full max-w-[220px] items-center gap-3 text-[10px] text-white/45">
              <MoveHorizontal className="size-3.5 shrink-0" />
              <input
                aria-label="Rotate smile preview"
                type="range"
                min="-180"
                max="180"
                value={previewAngle}
                onChange={(event) => setPreviewAngle(Number(event.target.value))}
                className="h-1 w-full accent-[#d57f6d]"
              />
              <span>360°</span>
            </label>
          </div>

          <div className="flex flex-col rounded-[1.5rem] bg-[#faf0eb] p-6 text-[#2c1d18] sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b6b5c]">Your starting estimate</p>
              <span className="rounded-full bg-[#ead6cd] px-3 py-1.5 text-[9px] font-medium text-[#855949]">Planning only</span>
            </div>
            <p className="mt-5 font-serif text-3xl leading-tight tracking-tight">{goal}</p>
            <div className="mt-5 flex items-center gap-5">
              <div
                className="relative grid size-[92px] shrink-0 place-items-center rounded-full"
                style={{ background: `conic-gradient(#d57f6d ${estimate.complexity}%, #e8d8d1 ${estimate.complexity}% 100%)` }}
              >
                <span className="grid size-[72px] place-items-center rounded-full bg-[#faf0eb] text-center">
                  <span>
                    <span className="block text-lg font-semibold">{estimate.complexity}</span>
                    <span className="text-[8px] uppercase tracking-wider text-[#89776f]">complexity</span>
                  </span>
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#89776f]">Estimated journey</p>
                <p className="mt-1 text-lg font-semibold">{estimate.time}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-[#e5d4cb] pt-5 text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-[#85716a]">Recommended specialist</span>
                <span className="text-right font-semibold">{estimate.specialist}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#85716a]">Selected method</span>
                <span className="text-right font-semibold">{method}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#85716a]">Estimated range</span>
                <span className="text-right font-semibold">{estimate.min.toLocaleString()}–{estimate.max.toLocaleString()} ETB</span>
              </div>
              <p className="pt-1 text-[9px] leading-4 text-[#94827b]">{estimate.methodNote}</p>
              <p className="pt-1 text-[9px] leading-4 text-[#94827b]">
                This is an illustrative planning range, not a clinic quote or guaranteed fee. Your clinician will confirm the plan and price after an examination.
              </p>
            </div>
            <Link
              href="/appointment"
              className="mt-auto inline-flex items-center justify-between rounded-full bg-[#2c1d18] px-5 py-4 text-xs font-semibold text-white transition hover:bg-[#49332b]"
            >
              <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-[#e2a99a]" />Talk through your options</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
