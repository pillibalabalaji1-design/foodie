import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Foodie | Authentic Andhra Pre-Order Kitchen',
  description: 'Authentic Andhra food for special moments. Pre-order only.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-brandBeige/95 backdrop-blur">
          <nav className="mx-auto flex w-[92%] max-w-6xl items-center justify-between py-4">
            <Link href="/" className="text-2xl font-semibold text-brandRed">Foodie</Link>
            <div className="flex gap-4 text-sm text-stone-700">
              <Link href="/menu">Menu</Link>
              <Link href="/preorder">Pre-Order</Link>
              <Link href="/admin/login">Admin</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
