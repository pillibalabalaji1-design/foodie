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

  useEffect(() => {
    let mounted = true;

    const loadMenu = () => {
      api
        .get('/api/menu', { headers: { 'Cache-Control': 'no-cache' } })
        .then((res) => {
          if (mounted) setMenu(res.data);
        })
        .catch(() => {
          if (mounted) setMenu([]);
        });
    };

    loadMenu();
    const interval = window.setInterval(loadMenu, 5000);

    const onFocus = () => loadMenu();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'foodie_menu_updated_at') loadMenu();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

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
