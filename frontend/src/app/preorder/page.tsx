'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, api } from '@/lib/api';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
};

type CartItem = MenuItem & { quantity: number };

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const initialCheckout = {
  customerName: '',
  email: '',
  phone: '',
  address: '',
  deliveryDate: '',
  specialInstructions: ''
};

export default function PreOrderPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [checkout, setCheckout] = useState(initialCheckout);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    api.get('/api/menu').then((res) => setMenu(res.data)).catch(() => setMenu([]));
  }, []);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalAmount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0), [cartItems]);

  function addToCart(item: MenuItem) {
    setCart((prev) => ({ ...prev, [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 } }));
  }

  function updateQuantity(itemId: number, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      if (!prev[itemId]) return prev;
      return { ...prev, [itemId]: { ...prev[itemId], quantity } };
    });
  }

  function handleCheckoutInput(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.currentTarget;
    setCheckout((prev) => ({ ...prev, [name]: value }));
  }

  function handleProceedToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!cartItems.length) {
      setErrorMessage('Please add at least one item before proceeding to payment.');
      return;
    }

    const payload = {
      ...checkout,
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.quantity * item.price
      })),
      totalAmount
    };

    window.sessionStorage.setItem('foodie_checkout_payload', JSON.stringify(payload));
    setIsRedirecting(true);
    router.push('/payment');
  }

  return (
    <main className="mx-auto w-[92%] max-w-6xl py-12">
      <h1 className="text-3xl font-semibold">Pre-Order Request</h1>
      <p className="mb-6 font-semibold text-brandRed">Orders must be placed at least 24–48 hours in advance.</p>

      <section>
        <h2 className="mb-3 text-2xl font-semibold">1. Menu</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {menu.map((item) => (
            <article key={item.id} className="rounded-xl bg-white p-4 shadow">
              {item.imageUrl ? <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.name} className="mb-3 h-40 w-full rounded object-cover" /> : null}
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-stone-600">{item.description}</p>
              <p className="mt-1 font-semibold text-brandRed">{gbp.format(item.price)}</p>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => addToCart(item)} className="rounded bg-brandRed px-3 py-1 text-sm font-semibold text-white">Add</button>
                <button type="button" onClick={() => updateQuantity(item.id, (cart[item.id]?.quantity || 0) - 1)} className="rounded bg-stone-200 px-2 py-1">-</button>
                <span className="min-w-6 text-center">{cart[item.id]?.quantity || 0}</span>
                <button type="button" onClick={() => updateQuantity(item.id, (cart[item.id]?.quantity || 0) + 1)} className="rounded bg-stone-200 px-2 py-1">+</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-2xl font-semibold">2. Cart Summary</h2>
        {cartItems.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Item</th><th className="py-2">Qty</th><th className="py-2">Price</th><th className="py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{gbp.format(item.price)}</td>
                    <td className="py-2">{gbp.format(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-right text-lg font-semibold">Total: {gbp.format(totalAmount)}</p>
          </div>
        ) : (
          <p className="mt-3 text-stone-700">Your cart is empty.</p>
        )}
      </section>

      <section className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-2xl font-semibold">3. Checkout Details</h2>
        <form onSubmit={handleProceedToPayment} className="mt-4 grid gap-3">
          <input required name="customerName" value={checkout.customerName} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Full Name" />
          <input required type="email" name="email" value={checkout.email} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Email Address" />
          <input required name="phone" value={checkout.phone} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Phone Number" />
          <textarea required name="address" value={checkout.address} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Delivery Address" />
          <input required name="deliveryDate" type="datetime-local" value={checkout.deliveryDate} onChange={handleCheckoutInput} className="rounded border p-2" />
          <textarea name="specialInstructions" value={checkout.specialInstructions} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Special instructions" />

          <button disabled={isRedirecting} className="rounded bg-brandRed p-2 font-semibold text-white disabled:opacity-70">
            {isRedirecting ? 'Redirecting...' : 'Proceed to Payment'}
          </button>
        </form>
        {errorMessage ? <p className="mt-3 text-red-700">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
