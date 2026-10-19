'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useImageField } from '@/lib/use-image-field';
import type { AdminService } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { ImageUpload } from '@/components/admin/image-upload';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  shortDescription: z.string().trim().max(200, 'Keep it under 200 characters'),
  description: z.string().trim().min(10, 'Please write at least 10 characters').max(5000),
  duration: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && +v >= 5 && +v <= 480), 'Enter minutes between 5 and 480'),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function ServiceForm({ service, onDone }: { service?: AdminService; onDone: () => void }) {
  const queryClient = useQueryClient();
  const img = useImageField(service?.imageUrl ?? null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? '',
      shortDescription: service?.shortDescription ?? '',
      description: service?.description ?? '',
      duration: service?.duration ? String(service.duration) : '',
      isActive: service?.isActive ?? true,
    },
  });

  async function onSubmit(v: Values) {
    const body = {
      name: v.name,
      shortDescription: v.shortDescription || null,
      description: v.description,
      duration: v.duration ? Number(v.duration) : null,
      isActive: v.isActive,
      // Only send the image when it changed: seed data may hold relative paths the API rejects as URLs
      ...(img.changed || !service ? { imageUrl: img.image } : {}),
    };

    try {
      await api(service ? `/services/${service.id}` : '/services', {
        method: service ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      img.commit();
      toast.success(service ? 'Service updated' : 'Service created');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach(({ path, message }) => {
          if (path in v) setError(path as keyof Values, { message });
        });
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Could not save the service');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <span className="mb-2 block text-sm font-medium text-slate-800">Image</span>
        <ImageUpload value={img.image} onChange={img.change} />
      </div>

      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <input id="name" className={inputClass} aria-invalid={!!errors.name} {...register('name')} />
      </Field>

      <Field label="Short description" htmlFor="shortDescription" optional error={errors.shortDescription?.message}>
        <input id="shortDescription" className={inputClass} aria-invalid={!!errors.shortDescription} {...register('shortDescription')} />
      </Field>

      <Field label="Full description" htmlFor="description" error={errors.description?.message}>
        <textarea id="description" rows={5} className={inputClass} aria-invalid={!!errors.description} {...register('description')} />
      </Field>

      <Field label="Duration (minutes)" htmlFor="duration" optional error={errors.duration?.message}>
        <input id="duration" inputMode="numeric" placeholder="30" className={inputClass} aria-invalid={!!errors.duration} {...register('duration')} />
      </Field>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
        <input type="checkbox" className="size-4 accent-brand-600" {...register('isActive')} />
        Visible on the website
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {service ? 'Save changes' : 'Create service'}
        </Button>
      </div>
    </form>
  );
}