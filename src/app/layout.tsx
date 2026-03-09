import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '테이블오더',
  description: '테이블오더 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
