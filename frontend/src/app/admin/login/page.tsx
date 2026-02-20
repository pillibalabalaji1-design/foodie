'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');

    console.info('[admin.login] submitting login request', { email, endpoint: '/api/auth/login' });

    try {
      const res = await api.post('/api/auth/login', {
        email,
        password: form.get('password')
      });

      console.info('[admin.login] login success', {
        email,
        status: res.status,
        role: res.data?.user?.role
      });

      window.localStorage.setItem('foodie_token', res.data.token);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      const backendMessage = response?.data?.message;

      console.error('[admin.login] login failed', {
        email,
        status: response?.status,
        backendMessage: backendMessage ?? null
      });

      setError(backendMessage ?? 'Invalid credentials');
    }
  }

  return (
    <main className="mx-auto w-[92%] max-w-md py-12">
      <h1 className="mb-4 text-3xl font-semibold">Admin Login</h1>
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl bg-white p-5 shadow">
        <input name="email" required type="email" className="rounded border p-2" placeholder="admin@foodie.com" />
        <input name="password" required type="password" className="rounded border p-2" placeholder="Password" />
        <button className="rounded bg-brandRed p-2 font-semibold text-white">Login</button>
      </form>
      <p className="mt-2 text-sm text-red-700">{error}</p>
    </main>
  );
}
