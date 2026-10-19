'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Props = { value: string | null; onChange: (url: string | null) => void };

export function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { url } = await api<{ url: string }>('/upload', { method: 'POST', body: form });
      onChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-8 text-slate-400" />
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-brand-600" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
        <Button variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {value ? 'Replace image' : 'Upload image'}
        </Button>
        {value && (
          <Button variant="outline" disabled={uploading} onClick={() => onChange(null)}>
            <Trash2 className="size-4" /> Remove
          </Button>
        )}
        <p className="w-full text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB.</p>
      </div>
    </div>
  );
}