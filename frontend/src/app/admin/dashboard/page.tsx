'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { api } from '@/lib/api';
import { logFrontend } from '@/lib/logger';

type MenuItem = { id: number; name: string; description: string; price: number };
type OrderItem = { name?: string; quantity?: number; unitPrice?: number; subtotal?: number };
type Order = {
  id: number;
  orderCode?: string;
  customerName: string;
  email?: string;
  phone?: string;
  address?: string;
  deliveryDate?: string;
  specialInstructions?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID';
  items?: OrderItem[] | Record<string, unknown>;
  totalAmount?: number;
  paymentMethod?: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
  paymentReference?: string;
  paymentReceiptUrl?: string;
  emailSent?: boolean;
  smsSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
type User = { id: number; name: string; email: string; role: 'ADMIN' | 'USER'; createdAt: string };

type OrderFilters = {
  search: string;
  status: 'ALL' | Order['status'];
  paymentMethod: 'ALL' | NonNullable<Order['paymentMethod']>;
  fromDate: string;
  toDate: string;
};

const initialOrderFilters: OrderFilters = {
  search: '',
  status: 'ALL',
  paymentMethod: 'ALL',
  fromDate: '',
  toDate: ''
};

function csvCell(value: unknown) {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export default function DashboardPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [backendLogs, setBackendLogs] = useState<string[]>([]);
  const [frontendLogs, setFrontendLogs] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [orderFilters, setOrderFilters] = useState<OrderFilters>(initialOrderFilters);
  const [menuMessage, setMenuMessage] = useState<string>('');

  async function loadData(admin: boolean) {
    const requests: Promise<unknown>[] = [api.get('/api/menu', { params: { t: Date.now() } }).then((r) => setMenu(r.data))];

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
    const init = async () => {
      const me = await api.get('/api/auth/me');
      const admin = me.data?.role === 'ADMIN';
      setIsAdmin(admin);
      await loadData(admin);
    };

    init().catch(async (error) => {
      await logFrontend('error', 'admin.dashboard.load_failed', {
        message: error instanceof Error ? error.message : 'unknown_error'
      });
    });
  }, []);

  function notifyMenuUpdated() {
    window.localStorage.setItem('foodie_menu_updated_at', String(Date.now()));
    window.dispatchEvent(new Event('foodie-menu-updated'));
  }

  async function createMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingMenu(true);
    setMenuMessage('');
    try {
      const data = new FormData(event.currentTarget);
      const tempItem: MenuItem = {
        id: -Date.now(),
        name: String(data.get('name') ?? ''),
        description: String(data.get('description') ?? ''),
        price: Number(data.get('price') ?? 0)
      };
      setMenu((prev) => [tempItem, ...prev]);

      await api.post('/api/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      event.currentTarget.reset();
      setMenuMessage('Menu item created successfully.');
      notifyMenuUpdated();
      await loadData(isAdmin);
    } catch {
      setMenuMessage('Could not create menu item. Please try again.');
      await loadData(isAdmin);
    } finally {
      setIsCreatingMenu(false);
    }
  }

  async function editMenu(item: MenuItem) {
    const name = window.prompt('Name', item.name) || item.name;
    const description = window.prompt('Description', item.description) || item.description;
    const price = Number(window.prompt('Price', String(item.price)) || item.price);
    await api.put(`/api/menu/${item.id}`, { name, description, price });
    notifyMenuUpdated();
    await loadData(isAdmin);
  }

  async function deleteMenu(id: number) {
    await api.delete(`/api/menu/${id}`);
    notifyMenuUpdated();
    await loadData(isAdmin);
  }

  async function updateStatus(id: number, status: Order['status']) {
    setUpdatingOrderId(id);
    try {
      await api.put(`/api/orders/${id}`, { status });
      await loadData(isAdmin);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingUser(true);
    try {
      const formData = new FormData(event.currentTarget);

      await api.post('/api/users', {
        name: formData.get('name'),
        email: String(formData.get('email') ?? '').toLowerCase().trim(),
        password: formData.get('password'),
        role: formData.get('role')
      });

      event.currentTarget.reset();
      await loadData(true);
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function removeUser(id: number) {
    await api.delete(`/api/users/${id}`);
    await loadData(true);
  }

  function getOrderItems(items: Order['items']): OrderItem[] {
    if (Array.isArray(items)) return items;

    if (items && typeof items === 'object') {
      const selectedItems = (items as { selectedItems?: unknown }).selectedItems;
      if (typeof selectedItems === 'string') {
        return selectedItems
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ name, quantity: 1 }));
      }
    }

    return [];
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search = orderFilters.search.trim().toLowerCase();
      if (search) {
        const haystack = [order.orderCode, order.customerName, order.email, order.phone, String(order.id)].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (orderFilters.status !== 'ALL' && order.status !== orderFilters.status) {
        return false;
      }

      if (orderFilters.paymentMethod !== 'ALL' && order.paymentMethod !== orderFilters.paymentMethod) {
        return false;
      }

      if (orderFilters.fromDate || orderFilters.toDate) {
        const createdAt = order.createdAt ? new Date(order.createdAt) : null;
        if (!createdAt) return false;

        if (orderFilters.fromDate) {
          const fromDate = new Date(`${orderFilters.fromDate}T00:00:00`);
          if (createdAt < fromDate) return false;
        }

        if (orderFilters.toDate) {
          const toDate = new Date(`${orderFilters.toDate}T23:59:59`);
          if (createdAt > toDate) return false;
        }
      }

      return true;
    });
  }, [orders, orderFilters]);

  function exportFilteredOrders() {
    const generatedAt = new Date();
    const lines: string[] = [];

    lines.push(`${csvCell('Report Generated At')},${csvCell(generatedAt.toISOString())}`);
    lines.push(`${csvCell('Filtered Orders Count')},${csvCell(filteredOrders.length)}`);
    lines.push(
      `${csvCell('Applied Filters')},${csvCell(
        `search=${orderFilters.search || 'ALL'}; status=${orderFilters.status}; paymentMethod=${orderFilters.paymentMethod}; fromDate=${
          orderFilters.fromDate || 'ANY'
        }; toDate=${orderFilters.toDate || 'ANY'}`
      )}`
    );
    lines.push('');

    lines.push(
      [
        'Order #',
        'Order ID',
        'Order Code',
        'Customer Name',
        'Email',
        'Phone',
        'Status',
        'Payment Method',
        'Payment Reference',
        'Total Amount',
        'Delivery Date',
        'Address',
        'Special Instructions',
        'Items Count',
        'Items Details',
        'Payment Receipt URL',
        'Email Sent',
        'SMS Sent',
        'Created At',
        'Updated At'
      ]
        .map(csvCell)
        .join(',')
    );

    filteredOrders.forEach((order, index) => {
      const orderItems = getOrderItems(order.items);
      const itemDetails = orderItems
        .map((item) => `${item.name || 'Item'} x${item.quantity || 1} @ ${typeof item.unitPrice === 'number' ? item.unitPrice : 0}`)
        .join(' | ');

      lines.push(
        [
          index + 1,
          order.id,
          order.orderCode || '',
          order.customerName,
          order.email || '',
          order.phone || '',
          order.status,
          order.paymentMethod || '',
          order.paymentReference || '',
          typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '',
          order.deliveryDate || '',
          order.address || '',
          order.specialInstructions || '',
          orderItems.length,
          itemDetails,
          order.paymentReceiptUrl || '',
          typeof order.emailSent === 'boolean' ? String(order.emailSent) : '',
          typeof order.smsSent === 'boolean' ? String(order.smsSent) : '',
          order.createdAt || '',
          order.updatedAt || ''
        ]
          .map(csvCell)
          .join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `foodie-orders-${generatedAt.toISOString().replace(/[:.]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <AdminGuard allowRoles={['ADMIN', 'USER']}>
      <main className="mx-auto grid w-[92%] max-w-6xl gap-8 py-10 md:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-2xl font-semibold">Menu Management</h2>
          {isAdmin ? (
            <form onSubmit={createMenu} className="grid gap-2">
              <input disabled={isCreatingMenu} name="name" required className="rounded border p-2" placeholder="Name" />
              <textarea
                disabled={isCreatingMenu}
                name="description"
                minLength={3}
                required
                className="rounded border p-2"
                placeholder="Description"
              />
              <input disabled={isCreatingMenu} name="price" required type="number" step="0.01" className="rounded border p-2" placeholder="Price" />
              <input disabled={isCreatingMenu} name="image" required type="file" accept="image/*" className="rounded border p-2" />
              <button disabled={isCreatingMenu} className="rounded bg-brandRed p-2 font-semibold text-white disabled:opacity-70">
                {isCreatingMenu ? 'Creating...' : 'Create'}
              </button>
              {menuMessage ? <p className="text-sm text-brandRed">{menuMessage}</p> : null}
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
                      <button onClick={() => editMenu(item)} className="text-sm text-brandBrown">
                        Edit
                      </button>
                      <button onClick={() => deleteMenu(item.id)} className="text-sm text-red-700">
                        Delete
                      </button>
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
            <>
              <div className="mb-4 grid gap-2 rounded border p-3 md:grid-cols-2">
                <input
                  value={orderFilters.search}
                  onChange={(event) => setOrderFilters((prev) => ({ ...prev, search: event.currentTarget.value }))}
                  className="rounded border p-2"
                  placeholder="Search by order/customer/email/phone"
                />
                <select
                  value={orderFilters.status}
                  onChange={(event) => setOrderFilters((prev) => ({ ...prev, status: event.currentTarget.value as OrderFilters['status'] }))}
                  className="rounded border p-2"
                >
                  <option value="ALL">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PAID">Paid</option>
                </select>
                <select
                  value={orderFilters.paymentMethod}
                  onChange={(event) =>
                    setOrderFilters((prev) => ({ ...prev, paymentMethod: event.currentTarget.value as OrderFilters['paymentMethod'] }))
                  }
                  className="rounded border p-2"
                >
                  <option value="ALL">All payment methods</option>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={orderFilters.fromDate}
                    onChange={(event) => setOrderFilters((prev) => ({ ...prev, fromDate: event.currentTarget.value }))}
                    className="rounded border p-2"
                  />
                  <input
                    type="date"
                    value={orderFilters.toDate}
                    onChange={(event) => setOrderFilters((prev) => ({ ...prev, toDate: event.currentTarget.value }))}
                    className="rounded border p-2"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-stone-700">
                    Showing <span className="font-semibold">{filteredOrders.length}</span> orders.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderFilters(initialOrderFilters)}
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={exportFilteredOrders}
                      className="rounded bg-brandRed px-3 py-2 text-sm font-semibold text-white"
                    >
                      Export to Excel (.csv)
                    </button>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {filteredOrders.map((order) => (
                  <li key={order.id} className="rounded border p-3">
                    <p className="font-semibold">#{order.id} {order.customerName}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
                      {getOrderItems(order.items).length ? (
                        getOrderItems(order.items).map((item, index) => (
                          <li key={`${order.id}-${index}`}>
                            {item.name || 'Item'} x{item.quantity || 1}
                            {typeof item.unitPrice === 'number' ? ` • ₹${item.unitPrice.toFixed(2)}` : ''}
                            {typeof item.subtotal === 'number' ? ` (Subtotal ₹${item.subtotal.toFixed(2)})` : ''}
                          </li>
                        ))
                      ) : (
                        <li>No item details available for this order.</li>
                      )}
                    </ul>
                    <p className="mt-2 text-sm text-stone-700">
                      Total: <span className="font-semibold">₹{(order.totalAmount || 0).toFixed(2)}</span>
                      {order.paymentMethod ? ` • ${order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash on Delivery'}` : ''}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {(['PENDING', 'CONFIRMED', 'PAID'] as const).map((status) => (
                        <button
                          key={status}
                          disabled={updatingOrderId === order.id}
                          onClick={() => updateStatus(order.id, status)}
                          className={`rounded px-2 py-1 text-xs ${order.status === status ? 'bg-brandBrown text-white' : 'bg-stone-100'} disabled:opacity-60`}
                        >
                          {updatingOrderId === order.id ? 'Updating...' : status}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-stone-700">Only admins can view and update all orders.</p>
          )}
        </section>

        {isAdmin && (
          <>
            <section className="rounded-xl bg-white p-5 shadow">
              <h2 className="mb-3 text-2xl font-semibold">User Management</h2>
              <form onSubmit={createUser} className="grid gap-2">
                <input disabled={isCreatingUser} name="name" required className="rounded border p-2" placeholder="Name" />
                <input disabled={isCreatingUser} name="email" required type="email" className="rounded border p-2" placeholder="Email" />
                <input disabled={isCreatingUser} name="password" required minLength={8} type="password" className="rounded border p-2" placeholder="Temporary Password" />
                <select disabled={isCreatingUser} name="role" className="rounded border p-2" defaultValue="USER">
                  <option value="ADMIN">admin</option>
                  <option value="USER">user</option>
                </select>
                <button disabled={isCreatingUser} className="rounded bg-brandRed p-2 font-semibold text-white disabled:opacity-70">
                  {isCreatingUser ? 'Creating User...' : 'Create User'}
                </button>
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
