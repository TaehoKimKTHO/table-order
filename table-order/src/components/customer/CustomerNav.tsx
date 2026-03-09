'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CustomerNavProps {
  cartItemCount: number;
}

const tabs = [
  { href: '/customer', label: '🍴 메뉴', id: 'menu' },
  { href: '/customer/cart', label: '🛒 장바구니', id: 'cart' },
  { href: '/customer/orders', label: '📋 주문내역', id: 'orders' },
];

export default function CustomerNav({ cartItemCount }: CustomerNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex border-b-2 border-gray-100 bg-gray-50" data-testid="customer-nav">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/customer'
            ? pathname === '/customer'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`relative flex-1 py-3.5 text-center text-sm font-medium transition-colors ${
              isActive ? 'text-orange-500' : 'text-gray-400'
            }`}
            data-testid={`customer-nav-${tab.id}`}
          >
            {tab.label}
            {tab.id === 'cart' && cartItemCount > 0 && (
              <span className="ml-1 inline-block rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
                {cartItemCount}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-orange-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
