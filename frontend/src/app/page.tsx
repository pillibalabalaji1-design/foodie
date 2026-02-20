import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto w-[92%] max-w-6xl py-12">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brandGreen">Pre-Order Only</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">Authentic Andhra Flavours, Cooked Fresh for Your Special Moments</h1>
          <p className="mt-4 text-stone-700">Foodie is a curated Andhra kitchen for families and events. We cook fresh on schedule and deliver at your selected date/time.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/preorder" className="rounded-lg bg-brandRed px-4 py-2 font-semibold text-white">Pre-Order Now</Link>
            <a className="rounded-lg border border-brandGreen px-4 py-2 font-semibold text-brandGreen" href="https://wa.me/447440591222">WhatsApp</a>
          </div>
          <p className="mt-3 font-semibold text-brandRed">Orders must be placed at least 24–48 hours in advance.</p>
        </div>
        <img className="rounded-xl shadow" src="https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1200&q=80" alt="Andhra meal on banana leaf" />
      </section>
    </main>
  );
}
