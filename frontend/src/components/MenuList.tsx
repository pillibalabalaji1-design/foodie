'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, api } from '@/lib/api';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export default function MenuList() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMenu = () => {
      if (mounted) setLoading(true);
      api
        .get('/api/menu', { params: { t: Date.now() }, headers: { 'Cache-Control': 'no-cache' } })
        .then((res) => {
          if (mounted) setMenu(res.data);
        })
        .catch(() => {
          if (mounted) setMenu([]);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    loadMenu();
    const interval = window.setInterval(loadMenu, 5000);

    const onFocus = () => loadMenu();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'foodie_menu_updated_at') loadMenu();
    };
    const onManualRefresh = () => loadMenu();

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    window.addEventListener('foodie-menu-updated', onManualRefresh);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('foodie-menu-updated', onManualRefresh);
    };
  }, []);

  if (loading) return <p className="text-stone-600">Loading menu...</p>;
  if (menu.length === 0) return <p className="rounded-xl bg-white p-4 text-stone-600 shadow">No menu items yet. Please check back soon.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {menu.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-xl bg-white shadow">
          <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.name} className="h-52 w-full object-cover" />
          <div className="p-4">
            <h3 className="text-xl font-semibold">{item.name}</h3>
            <p className="text-sm text-stone-600">{item.description}</p>
            <p className="mt-2 font-semibold text-brandRed">{gbp.format(item.price)} • Available for Pre-Order</p>
          </div>
        </article>
      ))}
    </div>
  );
}
