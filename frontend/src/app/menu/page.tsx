import MenuList from '@/components/MenuList';

export default function MenuPage() {
  return (
    <main className="mx-auto w-[92%] max-w-6xl py-12">
      <h1 className="text-3xl font-semibold">Curated Andhra Menu</h1>
      <p className="mb-6 text-stone-700">Limited dishes. Maximum authenticity. Pre-order only.</p>
      <MenuList />
    </main>
  );
}
