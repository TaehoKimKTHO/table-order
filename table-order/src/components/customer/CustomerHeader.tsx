'use client';

interface CustomerHeaderProps {
  storeName: string;
  tableNumber: number;
}

export default function CustomerHeader({ storeName, tableNumber }: CustomerHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-5 py-4 text-white"
      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
      data-testid="customer-header"
    >
      <h1 className="text-xl font-bold">{storeName}</h1>
      <span
        className="rounded-full bg-white/25 px-3.5 py-1.5 text-sm font-semibold"
        data-testid="table-badge"
      >
        테이블 {tableNumber}
      </span>
    </header>
  );
}
