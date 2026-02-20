'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export default function PreOrderPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    const formData = new FormData(event.currentTarget);
    const deliveryDate = String(formData.get('deliveryDate') ?? '');

    const payload = {
      customerName: formData.get('customerName'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      deliveryDate: new Date(deliveryDate).toISOString(),
      items: {
        selectedItems: formData.get('items'),
        quantity: formData.get('quantity'),
        instructions: formData.get('instructions')
      }
    };

    try {
      await api.post('/api/orders', payload);
      setMessage('Thank you! Your pre-order request has been received.');
      event.currentTarget.reset();
    } catch {
      setError('Unable to place your pre-order right now. Please check your details and try again.');
    }
  }

  return (
    <main className="mx-auto w-[92%] max-w-3xl py-12">
      <h1 className="text-3xl font-semibold">Pre-Order Request</h1>
      <p className="mb-4 font-semibold text-brandRed">Orders must be placed at least 24–48 hours in advance.</p>
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl bg-white p-5 shadow">
        <input required name="customerName" className="rounded border p-2" placeholder="Name" />
        <input required name="phone" className="rounded border p-2" placeholder="Phone number" />
        <textarea required name="address" className="rounded border p-2" placeholder="Delivery address" />
        <input required name="deliveryDate" type="datetime-local" className="rounded border p-2" />
        <input required name="items" className="rounded border p-2" placeholder="Selected items" />
        <input required name="quantity" className="rounded border p-2" placeholder="Quantity" />
        <textarea name="instructions" className="rounded border p-2" placeholder="Special instructions" />
        <button className="rounded bg-brandRed p-2 font-semibold text-white">Submit Request</button>
      </form>
      <p className="mt-3 text-brandGreen">{message}</p>
      <p className="mt-2 text-sm text-red-700">{error}</p>
    </main>
  );
}
