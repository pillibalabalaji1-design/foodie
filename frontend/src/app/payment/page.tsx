'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type CheckoutItem = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type CheckoutPayload = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  deliveryDate: string;
  specialInstructions?: string;
  items: CheckoutItem[];
  totalAmount: number;
};

type PaymentMethod = 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export default function PaymentPage() {
  const router = useRouter();
  const [checkout, setCheckout] = useState<CheckoutPayload | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ orderCode: string; message: string } | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem('foodie_checkout_payload');
    if (!raw) {
      router.replace('/preorder');
      return;
    }

    try {
      setCheckout(JSON.parse(raw));
    } catch {
      router.replace('/preorder');
    }
  }, [router]);

  const total = useMemo(() => checkout?.items.reduce((sum, item) => sum + item.subtotal, 0) || 0, [checkout]);

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkout) return;
    setError('');
    setIsSubmitting(true);

    try {
      const createPayload = new FormData();
      createPayload.append('customerName', checkout.customerName);
      createPayload.append('email', checkout.email);
      createPayload.append('phone', checkout.phone);
      createPayload.append('address', checkout.address);
      createPayload.append('deliveryDate', new Date(checkout.deliveryDate).toISOString());
      createPayload.append('specialInstructions', checkout.specialInstructions || '');
      createPayload.append('paymentMethod', paymentMethod);
      createPayload.append('paymentReference', paymentReference);
      createPayload.append(
        'items',
        JSON.stringify(
          checkout.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        )
      );

      if (paymentReceipt) createPayload.append('paymentReceipt', paymentReceipt);

      const created = await api.post('/api/payment/create', createPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const confirmed = await api.post(`/api/payment/confirm/${created.data.orderId}`);

      setSuccess({ orderCode: confirmed.data.orderCode, message: confirmed.data.message });
      window.sessionStorage.removeItem('foodie_checkout_payload');
    } catch {
      setError('Unable to confirm payment right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!checkout) return null;

  if (success) {
    return (
      <main className="mx-auto w-[92%] max-w-3xl py-12">
        <section className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-3xl font-semibold">Your pre-order has been successfully placed.</h1>
          <p className="mt-3 text-stone-700">Order ID: <span className="font-semibold text-brandRed">{success.orderCode}</span></p>
          <p className="mt-1 text-stone-700">{success.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-[92%] max-w-4xl py-12">
      <h1 className="text-3xl font-semibold">Payment</h1>
      <section className="mt-6 rounded-xl bg-white p-5 shadow">
        <h2 className="text-xl font-semibold">Order Summary</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b"><th className="py-2">Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {checkout.items.map((item, index) => (
              <tr className="border-b" key={`${item.menuItemId}-${index}`}>
                <td className="py-2">{item.name}</td>
                <td>{item.quantity}</td>
                <td>{gbp.format(item.unitPrice)}</td>
                <td>{gbp.format(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-right font-semibold">Total Amount (GBP): {gbp.format(total)}</p>
      </section>

      <section className="mt-6 rounded-xl bg-white p-5 shadow">
        <h2 className="text-xl font-semibold">Choose Payment Method</h2>
        <form className="mt-3 grid gap-3" onSubmit={handleConfirm}>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.currentTarget.value as PaymentMethod)} className="rounded border p-2">
            <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          {paymentMethod === 'BANK_TRANSFER' ? (
            <div className="rounded border border-brandRed/30 bg-brandBeige p-3 text-sm">
              <p><strong>Bank Name:</strong> Foodie National Bank</p>
              <p><strong>Account Name:</strong> Foodie Foods Pvt Ltd</p>
              <p><strong>Account Number:</strong> 002233445566</p>
              <p><strong>Reference:</strong> Use your phone number + name</p>
              <input value={paymentReference} onChange={(event) => setPaymentReference(event.currentTarget.value)} required className="mt-3 w-full rounded border p-2" placeholder="Transfer reference" />
              <input type="file" accept="image/*,.pdf" onChange={(event) => setPaymentReceipt(event.currentTarget.files?.[0] || null)} className="mt-2 w-full rounded border p-2" />
            </div>
          ) : null}

          <button disabled={isSubmitting} className="rounded bg-brandRed p-2 font-semibold text-white disabled:opacity-70">
            {isSubmitting ? 'Confirming Order...' : 'Confirm Order'}
          </button>
        </form>
        {error ? <p className="mt-2 text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
