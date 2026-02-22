import Link from 'next/link';

const highlights = [
  { title: '24h Advance Validation', detail: 'Every order is pre-scheduled so your food is always prepared fresh, never rushed.' },
  { title: 'Curated Andhra Menu', detail: 'Classic biryanis, pulusu, fry items, and festive specials with bold home-style flavor.' },
  { title: 'Reliable Delivery Slots', detail: 'Pick your preferred date/time and we prepare your order for that exact slot.' }
];

export default function Home() {
  return (
    <main className="mx-auto w-[92%] max-w-6xl py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="animate-[fadeIn_700ms_ease-out]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brandGold">Pre-Order Only Cloud Kitchen</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">Authentic Andhra Feasts, Crafted Fresh for Your Chosen Delivery Slot</h1>
          <p className="mt-4 text-stone-700">
            Foodie brings premium Andhra pre-order dining with handcrafted meals for family gatherings, celebrations, and planned events.
            Reserve now and get freshly cooked food delivered on schedule.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/preorder"
              className="rounded-full bg-brandRed px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#720000]"
            >
              Pre-Order Now
            </Link>
            <a
              className="rounded-full border border-brandGold px-6 py-3 font-semibold text-brandBrown shadow-sm transition hover:bg-brandGold/10"
              href="https://wa.me/447440591222"
            >
              WhatsApp Quick Order
            </a>
          </div>
          <p className="mt-4 font-semibold text-brandRed">Orders are accepted for delivery slots at least 24 hours in advance.</p>
        </div>
        <div className="animate-[fadeIn_900ms_ease-out]">
          <img
            className="rounded-2xl shadow-2xl"
            src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1400&q=80"
            alt="Authentic Andhra thali with warm lighting and steam rising"
          />
        </div>
      </section>
    </main>
  );
}
