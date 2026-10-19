'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useImageField } from '@/lib/use-image-field';
import type { AdminDoctor } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { ImageUpload } from '@/components/admin/image-upload';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  specialization: z.string().trim().min(2, 'Please enter a specialization').max(100),
  bio: z.string().trim().max(3000, 'Keep it under 3000 characters'),
  education: z.string().trim().max(1000, 'Keep it under 1000 characters'),
  experience: z.string().trim().max(1000, 'Keep it under 1000 characters'),
  languages: z.string().trim().max(200, 'Keep it under 200 characters'),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function DoctorForm({ doctor, onDone }: { doctor?: AdminDoctor; onDone: () => void }) {
  const queryClient = useQueryClient();
  const img = useImageField(doctor?.imageUrl ?? null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: doctor?.name ?? '',
      specialization: doctor?.specialization ?? '',
      bio: doctor?.bio ?? '',
      education: doctor?.education ?? '',
      experience: doctor?.experience ?? '',
      languages: doctor?.languages ?? '',
      isActive: doctor?.isActive ?? true,
    },
  });

  async function onSubmit(v: Values) {
    const body = {
      name: v.name,
      specialization: v.specialization,
      bio: v.bio || null,
      education: v.education || null,
      experience: v.experience || null,
      languages: v.languages || null,
      isActive: v.isActive,
      ...(img.changed || !doctor ? { imageUrl: img.image } : {}),
    };

    try {
      await api(doctor ? `/doctors/${doctor.id}` : '/doctors', {
        method: doctor ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      img.commit();
      toast.success(doctor ? 'Doctor updated' : 'Doctor added');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach(({ path, message }) => {
          if (path in v) setError(path as keyof Values, { message });
        });
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Could not save the doctor');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <span className="mb-2 block text-sm font-medium text-slate-800">Photo</span>
        <ImageUpload value={img.image} onChange={img.change} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <input id="name" placeholder="Dr. Meron Alemu" className={inputClass} aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Specialization" htmlFor="specialization" error={errors.specialization?.message}>
          <input id="specialization" placeholder="Orthodontist" className={inputClass} aria-invalid={!!errors.specialization} {...register('specialization')} />
        </Field>
      </div>

      <Field label="Bio" htmlFor="bio" optional error={errors.bio?.message}>
        <textarea id="bio" rows={4} className={inputClass} aria-invalid={!!errors.bio} {...register('bio')} />
      </Field>

      <Field label="Education" htmlFor="education" optional error={errors.education?.message}>
        <input id="education" className={inputClass} aria-invalid={!!errors.education} {...register('education')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Experience" htmlFor="experience" optional error={errors.experience?.message}>
          <input id="experience" placeholder="10 years" className={inputClass} aria-invalid={!!errors.experience} {...register('experience')} />
        </Field>
        <Field label="Languages" htmlFor="languages" optional error={errors.languages?.message}>
          <input id="languages" placeholder="Amharic, English" className={inputClass} aria-invalid={!!errors.languages} {...register('languages')} />
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
        <input type="checkbox" className="size-4 accent-brand-600" {...register('isActive')} />
        Visible on the website
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {doctor ? 'Save changes' : 'Add doctor'}
        </Button>
      </div>
    </form>
  );
}