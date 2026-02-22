import Link from 'next/link';

const highlights = [
  { title: '24h Advance Validation', detail: 'Every order is pre-scheduled so your food is always prepared fresh, never rushed.' },
  { title: 'Curated Andhra Menu', detail: 'Classic biryanis, pulusu, fry items, and festive specials with bold home-style flavor.' },
  { title: 'Reliable Delivery Slots', detail: 'Pick your preferred date/time and we prepare your order for that exact slot.' }
];

export default function Home() {
  return (
    <main className="bg-brandBeige">
      <section className="mx-auto grid w-[92%] max-w-6xl gap-10 py-12 md:grid-cols-2 md:py-16">
        <div className="animate-[fadeIn_700ms_ease-out] self-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brandGold">Pre-Order Premium Kitchen</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-brandBrown md:text-6xl">Andhra Soul Food, Elevated for Planned Celebrations</h1>
          <p className="mt-5 max-w-xl text-base text-stone-700 md:text-lg">
            Foodie is a pre-order-only cloud kitchen crafted for families, house parties, and festive gatherings. Reserve your meal now,
            and we’ll deliver it hot and fresh in your selected slot.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/preorder"
              className="rounded-full bg-brandRed px-7 py-3 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#720000]"
            >
              Book Your Pre-Order
            </Link>
            <Link
              href="/menu"
              className="rounded-full border border-brandGold bg-white/60 px-7 py-3 font-semibold text-brandBrown shadow-sm transition hover:bg-brandGold/10"
            >
              Explore Menu
            </Link>
          </div>
          <p className="mt-4 font-semibold text-brandRed">Same-day ordering is disabled. Minimum 24-hour advance booking applies.</p>
        </div>

        <div className="animate-[fadeIn_900ms_ease-out]">
          <img
            className="rounded-3xl shadow-2xl ring-1 ring-black/5"
            src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1500&q=80"
            alt="Authentic Andhra thali with warm lighting and steam rising"
          />
        </div>
      </section>

      <section className="mx-auto w-[92%] max-w-6xl pb-14">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl bg-white p-5 shadow-lg shadow-brandRed/5 transition hover:-translate-y-1 hover:shadow-xl">
              <h3 className="text-lg font-semibold text-brandBrown">{item.title}</h3>
              <p className="mt-2 text-sm text-stone-700">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
