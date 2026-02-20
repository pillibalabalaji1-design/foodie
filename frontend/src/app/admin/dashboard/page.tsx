'use client';

import { FormEvent, useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { api } from '@/lib/api';

type MenuItem = { id: number; name: string; description: string; price: number };
type Order = { id: number; customerName: string; status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' };

export default function DashboardPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadData() {
    const [menuRes, orderRes] = await Promise.all([api.get('/api/menu'), api.get('/api/orders')]);
    setMenu(menuRes.data);
    setOrders(orderRes.data);
  }

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  async function createMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api.post('/api/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    event.currentTarget.reset();
    await loadData();
  }

  async function editMenu(item: MenuItem) {
    const name = window.prompt('Name', item.name) || item.name;
    const description = window.prompt('Description', item.description) || item.description;
    const price = Number(window.prompt('Price', String(item.price)) || item.price);
    await api.put(`/api/menu/${item.id}`, { name, description, price });
    await loadData();
  }

  async function deleteMenu(id: number) {
    await api.delete(`/api/menu/${id}`);
    await loadData();
  }

  async function updateStatus(id: number, status: Order['status']) {
    await api.put(`/api/orders/${id}`, { status });
    await loadData();
  }

  return (
    <AdminGuard>
      <main className="mx-auto grid w-[92%] max-w-6xl gap-8 py-10 md:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-2xl font-semibold">Add Menu Item</h2>
          <form onSubmit={createMenu} className="grid gap-2">
            <input name="name" required className="rounded border p-2" placeholder="Name" />
            <textarea name="description" required className="rounded border p-2" placeholder="Description" />
            <input name="price" required type="number" step="0.01" className="rounded border p-2" placeholder="Price" />
            <input name="image" required type="file" accept="image/*" className="rounded border p-2" />
            <button className="rounded bg-brandRed p-2 font-semibold text-white">Create</button>
          </form>
          <ul className="mt-4 space-y-2">
            {menu.map((item) => (
              <li key={item.id} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editMenu(item)} className="text-sm text-brandGreen">Edit</button>
                    <button onClick={() => deleteMenu(item.id)} className="text-sm text-red-700">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-2xl font-semibold">Orders</h2>
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
        </section>
      </main>
    </AdminGuard>
  );
}
