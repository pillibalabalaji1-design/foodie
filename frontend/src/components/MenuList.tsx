'use client';

import { useEffect, useState } from 'react';
import { api, buildApiUrl } from '@/lib/api';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export default function MenuList() {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    api.get('/api/menu').then((res) => setMenu(res.data)).catch(() => setMenu([]));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {menu.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-xl bg-white shadow">
          <img src={buildApiUrl(item.imageUrl)} alt={item.name} className="h-52 w-full object-cover" />
          <div className="p-4">
            <h3 className="text-xl font-semibold">{item.name}</h3>
            <p className="text-sm text-stone-600">{item.description}</p>
            <p className="mt-2 font-semibold text-brandRed">₹{item.price.toFixed(2)} • Available for Pre-Order</p>
          </div>
        </article>
      ))}
    </div>
  );
}
