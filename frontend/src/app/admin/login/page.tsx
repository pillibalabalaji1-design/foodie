'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { logFrontend } from '@/lib/logger';

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').toLowerCase().trim();

    await logFrontend('info', 'admin.login.submit', { email });

    try {
      const res = await api.post('/api/auth/login', {
        email,
        password: form.get('password')
      });

      await logFrontend('info', 'admin.login.success', { email, status: res.status });
      window.localStorage.setItem('foodie_token', res.data.token);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      const backendMessage = response?.data?.message;
      const displayMessage = backendMessage ?? 'Invalid credentials. Please check your email and password.';

      await logFrontend('warn', 'admin.login.failure', {
        email,
        status: response?.status,
        backendMessage: backendMessage ?? null
      });

      setError(displayMessage);
    }
  }

  return (
    <main className="mx-auto w-[92%] max-w-md py-12">
      <h1 className="mb-4 text-3xl font-semibold">Admin Login</h1>
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl bg-white p-5 shadow">
        <input name="email" required type="email" className="rounded border p-2" placeholder="admin@foodie.com" />
        <div className="relative">
          <input
            name="password"
            required
            minLength={8}
            type={showPassword ? 'text' : 'password'}
            className="w-full rounded border p-2 pr-12"
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-sm text-stone-600"
            aria-label={showPassword ? 'Hide password' : 'View password'}
            title={showPassword ? 'Hide password' : 'View password'}
          >
            👁
          </button>
        </div>
        <button className="rounded bg-brandRed p-2 font-semibold text-white">Login</button>
      </form>
      <p className="mt-2 text-sm text-red-700">{error}</p>
    </main>
  );
}
