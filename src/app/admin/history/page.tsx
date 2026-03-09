'use client'

import { useState, useEffect } from 'react'
import type { RestaurantTable, TableSession, Order } from '@/types'

interface HistorySession {
  session: TableSession
  orders: Order[]
  totalAmount: number
}

interface TableOption extends RestaurantTable {
  activeSession?: unknown
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function calcDuration(start: string, end: string | null) {
  if (!end) return '-'
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diff / 60000) + '분'
}

export default function HistoryPage() {
  const [tables, setTables] = useState<TableOption[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10))
  const [sessions, setSessions] = useState<HistorySession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/tables')
      .then((r) => r.json())
      .then((d) => setTables(d.data || []))
  }, [])

  const handleSearch = async () => {
    if (!selectedTable) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      const res = await fetch(`/api/admin/tables/${selectedTable}/history?${params}`)
      const data = await res.json()
      setSessions(data.data?.sessions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="bg-surface px-10 py-6 border-b border-border">
        <h1 className="text-2xl font-extrabold text-text tracking-tight">이전 테이블 내역</h1>
        <div className="flex gap-4 items-center mt-6">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-3 bg-surface border border-border rounded-[10px] text-sm text-text outline-none"
          />
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-4 py-3 bg-surface border border-border rounded-[10px] text-sm text-text outline-none appearance-none pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
            }}
          >
            <option value="">모든 테이블</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>Table {t.tableNumber}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={!selectedTable}
            className="px-6 py-3 bg-text text-white rounded-[10px] font-bold text-sm cursor-pointer disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all"
          >
            기록 검색
          </button>
        </div>
      </header>

      <div className="flex-1 p-10 overflow-y-auto">
        {loading ? (
          <p className="text-text-muted">로딩 중...</p>
        ) : sessions.length === 0 ? (
          <p className="text-text-muted">조회 결과가 없습니다. 테이블을 선택하고 검색해주세요.</p>
        ) : (
          <div className="bg-surface rounded-[20px] border border-border shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="px-6 py-4 text-[13px] font-semibold text-text-muted">세션 ID</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-text-muted">테이블</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-text-muted">시간 및 이용 시간</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-text-muted">주문 내역 요약</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-text-muted text-right">최종 결제 금액</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const allItems = s.orders.flatMap((o) => o.items || [])
                  const table = tables.find((t) => t.id === s.session.tableId)
                  return (
                    <tr key={s.session.id} className="border-b border-border last:border-0 hover:bg-surface-alt">
                      <td className="px-6 py-6">
                        <span className="font-mono text-[15px] font-bold text-text">S-{String(s.session.id).padStart(4, '0')}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="inline-block bg-primary-bg text-primary px-2.5 py-1 rounded-md font-bold text-[13px]">
                          TABLE {table?.tableNumber || s.session.tableId}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-medium">
                          {formatTime(s.session.startedAt)} ~ {s.session.endedAt ? formatTime(s.session.endedAt) : '-'}
                        </div>
                        <span className="inline-block mt-1.5 text-xs text-text-muted bg-bg px-2 py-0.5 rounded">
                          {calcDuration(s.session.startedAt, s.session.endedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="font-semibold">총 {s.orders.length}건 주문</div>
                        <div className="text-[13px] text-text-muted mt-2 leading-relaxed">
                          {allItems.slice(0, 3).map((item, i) => (
                            <span key={i}>{item.menuName} x{item.quantity}{i < Math.min(allItems.length, 3) - 1 ? <br /> : ''}</span>
                          ))}
                          {allItems.length > 3 && <span><br />외 {allItems.length - 3}건</span>}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-lg font-extrabold text-text">
                          {s.totalAmount.toLocaleString('ko-KR')}원
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
