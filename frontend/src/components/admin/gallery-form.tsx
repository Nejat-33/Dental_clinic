'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useImageField } from '@/lib/use-image-field';
import type { AdminGalleryImage } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { ImageUpload } from '@/components/admin/image-upload';

const schema = z.object({
  title: z.string().trim().max(150, 'Keep it under 150 characters'),
  category: z.string().trim().max(50, 'Keep it under 50 characters'),
  isPublished: z.boolean(),
});

type Values = z.infer<typeof schema>;

type Props = { item?: AdminGalleryImage; categories: string[]; onDone: () => void };

export function GalleryForm({ item, categories, onDone }: Props) {
  const queryClient = useQueryClient();
  const img = useImageField(item?.imageUrl ?? null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title ?? '',
      category: item?.category ?? '',
      isPublished: item?.isPublished ?? true,
    },
  });

  async function onSubmit(v: Values) {
    if (!img.image) {
      setImageError('Please upload an image');
      return;
    }

    const body = {
      title: v.title || null,
      category: v.category || null,
      isPublished: v.isPublished,
      // Only send the image when it changed or when creating
      ...(img.changed || !item ? { imageUrl: img.image } : {}),
    };

    try {
      await api(item ? `/gallery/${item.id}` : '/gallery', {
        method: item ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      img.commit();
      toast.success(item ? 'Image updated' : 'Image added');
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.errors?.length) {
        e.errors.forEach(({ path, message }) => {
          if (path in v) setError(path as keyof Values, { message });
          else if (path === 'imageUrl') setImageError(message);
        });
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Could not save the image');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <span className="mb-2 block text-sm font-medium text-slate-800">Image</span>
        <ImageUpload
          value={img.image}
          onChange={(url) => {
            img.change(url);
            setImageError(null);
          }}
        />
        {imageError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {imageError}
          </p>
        )}
      </div>

      <Field label="Title" htmlFor="title" optional error={errors.title?.message}>
        <input id="title" placeholder="Reception area" className={inputClass} aria-invalid={!!errors.title} {...register('title')} />
      </Field>

      <Field label="Category" htmlFor="category" optional error={errors.category?.message}>
        <input
          id="category"
          list="gallery-categories"
          placeholder="Clinic, Equipment, Team..."
          className={inputClass}
          aria-invalid={!!errors.category}
          {...register('category')}
        />
        <datalist id="gallery-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
        <input type="checkbox" className="size-4 accent-brand-600" {...register('isPublished')} />
        Visible on the website
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {item ? 'Save changes' : 'Add image'}
        </Button>
      </div>
    </form>
  );
}