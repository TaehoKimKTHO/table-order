import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '테이블오더',
  description: '디지털 테이블 주문 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
