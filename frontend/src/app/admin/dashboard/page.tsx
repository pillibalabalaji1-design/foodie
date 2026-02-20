'use client';

import { FormEvent, useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { getSessionUserFromToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { logFrontend } from '@/lib/logger';

type MenuItem = { id: number; name: string; description: string; price: number };
type Order = { id: number; customerName: string; status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' };
type User = { id: number; name: string; email: string; role: 'ADMIN' | 'USER'; createdAt: string };

export default function DashboardPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [backendLogs, setBackendLogs] = useState<string[]>([]);
  const [frontendLogs, setFrontendLogs] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadData(admin: boolean) {
    const requests: Promise<unknown>[] = [
      api.get('/api/menu').then((r) => setMenu(r.data))
    ];

    if (admin) {
      requests.push(api.get('/api/orders').then((r) => setOrders(r.data)));
      requests.push(
        api.get('/api/users').then((r) => setUsers(r.data)),
        api.get('/api/logs/backend').then((r) => setBackendLogs(r.data.logs || [])),
        api.get('/api/logs/frontend').then((r) => setFrontendLogs(r.data.logs || []))
      );
    }

    await Promise.all(requests);
  }

  useEffect(() => {
    const token = window.localStorage.getItem('foodie_token');
    const session = getSessionUserFromToken(token);
    const admin = session?.role === 'ADMIN';
    setIsAdmin(admin);

    loadData(admin).catch(async (error) => {
      await logFrontend('error', 'admin.dashboard.load_failed', {
        message: error instanceof Error ? error.message : 'unknown_error'
      });
    });
  }, []);

  async function createMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api.post('/api/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    event.currentTarget.reset();
    await loadData(isAdmin);
  }

  async function editMenu(item: MenuItem) {
    const name = window.prompt('Name', item.name) || item.name;
    const description = window.prompt('Description', item.description) || item.description;
    const price = Number(window.prompt('Price', String(item.price)) || item.price);
    await api.put(`/api/menu/${item.id}`, { name, description, price });
    await loadData(isAdmin);
  }

  async function deleteMenu(id: number) {
    await api.delete(`/api/menu/${id}`);
    await loadData(isAdmin);
  }

  async function updateStatus(id: number, status: Order['status']) {
    await api.put(`/api/orders/${id}`, { status });
    await loadData(isAdmin);
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await api.post('/api/users', {
      name: formData.get('name'),
      email: String(formData.get('email') ?? '').toLowerCase().trim(),
      password: formData.get('password'),
      role: formData.get('role')
    });

    event.currentTarget.reset();
    await loadData(true);
  }

  async function removeUser(id: number) {
    await api.delete(`/api/users/${id}`);
    await loadData(true);
  }

  return (
    <AdminGuard allowRoles={['ADMIN', 'USER']}>
      <main className="mx-auto grid w-[92%] max-w-6xl gap-8 py-10 md:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-2xl font-semibold">Menu Management</h2>
          {isAdmin ? (
            <form onSubmit={createMenu} className="grid gap-2">
              <input name="name" required className="rounded border p-2" placeholder="Name" />
              <textarea name="description" required className="rounded border p-2" placeholder="Description" />
              <input name="price" required type="number" step="0.01" className="rounded border p-2" placeholder="Price" />
              <input name="image" required type="file" accept="image/*" className="rounded border p-2" />
              <button className="rounded bg-brandRed p-2 font-semibold text-white">Create</button>
            </form>
          ) : (
            <p className="text-sm text-stone-700">Only admins can create or modify menu items.</p>
          )}

          <ul className="mt-4 space-y-2">
            {menu.map((item) => (
              <li key={item.id} className="rounded border p-2">
                <div className="flex items-center justify-between gap-3">
                  <span>{item.name}</span>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => editMenu(item)} className="text-sm text-brandGreen">Edit</button>
                      <button onClick={() => deleteMenu(item.id)} className="text-sm text-red-700">Delete</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-2xl font-semibold">Orders</h2>
          {isAdmin ? (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="rounded border p-3">
                  <p className="font-semibold">#{order.id} {order.customerName}</p>
                  <div className="mt-2 flex gap-2">
                    {(['PENDING', 'CONFIRMED', 'DELIVERED'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(order.id, status)}
                        className={`rounded px-2 py-1 text-xs ${order.status === status ? 'bg-brandGreen text-white' : 'bg-stone-100'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-700">Only admins can view and update all orders.</p>
          )}
        </section>

        {isAdmin && (
          <>
            <section className="rounded-xl bg-white p-5 shadow">
              <h2 className="mb-3 text-2xl font-semibold">User Management</h2>
              <form onSubmit={createUser} className="grid gap-2">
                <input name="name" required className="rounded border p-2" placeholder="Name" />
                <input name="email" required type="email" className="rounded border p-2" placeholder="Email" />
                <input name="password" required minLength={8} type="password" className="rounded border p-2" placeholder="Temporary Password" />
                <select name="role" className="rounded border p-2" defaultValue="USER">
                  <option value="ADMIN">admin</option>
                  <option value="USER">user</option>
                </select>
                <button className="rounded bg-brandRed p-2 font-semibold text-white">Create User</button>
              </form>

              <ul className="mt-4 space-y-2 text-sm">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center justify-between rounded border p-2">
                    <span>{user.name} ({user.email}) - {user.role}</span>
                    <button className="text-red-700" onClick={() => removeUser(user.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl bg-white p-5 shadow md:col-span-2">
              <h2 className="mb-3 text-2xl font-semibold">Logs (Admin)</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Backend Logs</h3>
                  <pre className="max-h-64 overflow-auto rounded bg-stone-100 p-2 text-xs">{backendLogs.join('\n') || 'No logs yet'}</pre>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Frontend Logs</h3>
                  <pre className="max-h-64 overflow-auto rounded bg-stone-100 p-2 text-xs">{frontendLogs.join('\n') || 'No logs yet'}</pre>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </AdminGuard>
  );
}
