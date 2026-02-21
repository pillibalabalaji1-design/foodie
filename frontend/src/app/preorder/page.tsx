'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, api } from '@/lib/api';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
};

type CartItem = MenuItem & {
  quantity: number;
};

type PaymentMethod = 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';

type PaymentOption = {
  value: PaymentMethod;
  label: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    referenceInstruction: string;
  };
};

const initialCheckout = {
  customerName: '',
  email: '',
  phone: '',
  address: '',
  deliveryDate: '',
  specialInstructions: '',
  paymentMethod: '' as '' | PaymentMethod,
  paymentReference: ''
};

export default function PreOrderPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [checkout, setCheckout] = useState(initialCheckout);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/menu').then((res) => setMenu(res.data)).catch(() => setMenu([]));
    api.get('/api/orders/payment/options').then((res) => setPaymentOptions(res.data.methods || [])).catch(() => setPaymentOptions([]));
  }, []);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalAmount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0), [cartItems]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: { ...item, quantity: existing ? existing.quantity + 1 : 1 }
      };
    });
  }

  function updateQuantity(itemId: number, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantity }
      };
    });
  }

  function handleCheckoutInput(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.currentTarget;
    setCheckout((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!cartItems.length) {
      setErrorMessage('Please add at least one menu item to your cart before checkout.');
      return;
    }

    if (!checkout.paymentMethod) {
      setErrorMessage('Please select a payment method.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('customerName', checkout.customerName);
      payload.append('email', checkout.email);
      payload.append('phone', checkout.phone);
      payload.append('address', checkout.address);
      payload.append('deliveryDate', new Date(checkout.deliveryDate).toISOString());
      payload.append('specialInstructions', checkout.specialInstructions);
      payload.append('paymentMethod', checkout.paymentMethod);
      payload.append('paymentReference', checkout.paymentReference);
      payload.append(
        'items',
        JSON.stringify(
          cartItems.map((item) => ({
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        )
      );

      if (paymentReceipt) {
        payload.append('paymentReceipt', paymentReceipt);
      }

      const { data } = await api.post('/api/orders', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setOrderCode(data.orderCode);
      setSuccessMessage(data.message || 'Your pre-order has been successfully placed.');
      setCart({});
      setCheckout(initialCheckout);
      setPaymentReceipt(null);
    } catch (error) {
      setErrorMessage('Unable to place your pre-order. Please verify all fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedBankOption = paymentOptions.find((option) => option.value === 'BANK_TRANSFER');

  if (successMessage) {
    return (
      <main className="mx-auto w-[92%] max-w-3xl py-12">
        <section className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-3xl font-semibold">Your pre-order has been successfully placed.</h1>
          <p className="mt-3 text-stone-700">Order ID: <span className="font-semibold text-brandRed">{orderCode}</span></p>
          <p className="mt-1 text-stone-700">{successMessage}</p>
        </section>
      </main>
    );
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
              <p className="mt-1 font-semibold text-brandRed">₹{item.price.toFixed(2)}</p>
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
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Subtotal</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="rounded bg-stone-200 px-2">-</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded bg-stone-200 px-2">+</button>
                      </div>
                    </td>
                    <td className="py-2">₹{item.price.toFixed(2)}</td>
                    <td className="py-2">₹{(item.price * item.quantity).toFixed(2)}</td>
                    <td className="py-2"><button type="button" onClick={() => updateQuantity(item.id, 0)} className="text-red-700">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-right text-lg font-semibold">Total: ₹{totalAmount.toFixed(2)}</p>
          </div>
        ) : (
          <p className="mt-3 text-stone-700">Your cart is empty.</p>
        )}
      </section>

      <section className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="text-2xl font-semibold">3 & 4. Checkout and Payment</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <input required name="customerName" value={checkout.customerName} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Full Name" />
          <input required type="email" name="email" value={checkout.email} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Email Address" />
          <input required name="phone" value={checkout.phone} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Phone Number" />
          <textarea required name="address" value={checkout.address} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Delivery Address" />
          <input required name="deliveryDate" type="datetime-local" value={checkout.deliveryDate} onChange={handleCheckoutInput} className="rounded border p-2" />
          <textarea name="specialInstructions" value={checkout.specialInstructions} onChange={handleCheckoutInput} className="rounded border p-2" placeholder="Special instructions" />

          <select required name="paymentMethod" value={checkout.paymentMethod} onChange={handleCheckoutInput} className="rounded border p-2">
            <option value="">Select payment method</option>
            {paymentOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {checkout.paymentMethod === 'BANK_TRANSFER' && selectedBankOption?.bankDetails ? (
            <div className="rounded border border-brandRed/30 bg-brandBeige p-3 text-sm">
              <p><strong>Bank Name:</strong> {selectedBankOption.bankDetails.bankName}</p>
              <p><strong>Account Name:</strong> {selectedBankOption.bankDetails.accountName}</p>
              <p><strong>Account Number:</strong> {selectedBankOption.bankDetails.accountNumber}</p>
              <p><strong>Reference:</strong> {selectedBankOption.bankDetails.referenceInstruction}</p>
              <input
                required
                name="paymentReference"
                value={checkout.paymentReference}
                onChange={handleCheckoutInput}
                className="mt-3 w-full rounded border p-2"
                placeholder="Transfer reference"
              />
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setPaymentReceipt(event.currentTarget.files?.[0] || null)}
                className="mt-2 w-full rounded border p-2"
              />
            </div>
          ) : null}

          <button disabled={isSubmitting} className="rounded bg-brandRed p-2 font-semibold text-white disabled:opacity-70">
            {isSubmitting ? 'Placing Pre-Order...' : 'Pre-Order / Checkout'}
          </button>
        </form>

        {errorMessage ? <p className="mt-3 text-red-700">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
