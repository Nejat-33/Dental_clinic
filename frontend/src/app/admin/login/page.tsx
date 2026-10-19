import type { Metadata } from 'next';
import { Smile } from 'lucide-react';
import { site } from '@/config/site';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-600 text-white">
            <Smile className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">{site.name}</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}