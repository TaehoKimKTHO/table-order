import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">🍽️ 테이블오더</h1>
        <div className="space-y-3">
          <Link href="/admin" className="block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
            관리자 대시보드
          </Link>
        </div>
      </div>
    </div>
  )
}
