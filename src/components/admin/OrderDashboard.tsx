'use client'

import type { Order, RestaurantTable, TableSession } from '@/types'

interface TableWithSession extends RestaurantTable {
  activeSession?: TableSession
  totalAmount?: number
}

interface TableGroup {
  table: TableWithSession
  orders: Order[]
  totalAmount: number
}

interface Props {
  tableGroups: TableGroup[]
  loading: boolean
  newOrderIds: Set<number>
  onStatusChange: (orderId: number, newStatus: string) => void
  onDeleteOrder: (orderId: number) => void
  onCompleteTable: (tableId: number) => void
}

const statusConfig = {
  pending: { label: '대기중', btnClass: 'bg-status-wait-bg text-status-wait', next: 'preparing' },
  preparing: { label: '조리중', btnClass: 'bg-status-prep-bg text-status-prep', next: 'completed' },
  completed: { label: '완료', btnClass: 'bg-status-done-bg text-status-done', next: null },
} as const

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원'
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function OrderDashboard({
  tableGroups, loading, newOrderIds, onStatusChange, onDeleteOrder, onCompleteTable,
}: Props) {
  if (loading) {
    return (
      <>
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">로딩 중...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader />
      <div className="flex-1 p-10 overflow-y-auto">
        {tableGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-lg">
            현재 활성 주문이 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 pb-10">
            {tableGroups.map((group) => (
              <TableCard
                key={group.table.id}
                group={group}
                newOrderIds={newOrderIds}
                onStatusChange={onStatusChange}
                onDeleteOrder={onDeleteOrder}
                onCompleteTable={onCompleteTable}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function DashboardHeader() {
  return (
    <header className="bg-surface px-10 py-6 border-b border-border flex justify-between items-center">
      <h1 className="text-2xl font-extrabold text-text tracking-tight">전체 매장 현황</h1>
      <div className="flex gap-6">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-text-muted">
          <span className="w-2.5 h-2.5 rounded-full bg-status-wait" /> 주문 수락 대기
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-text-muted">
          <span className="w-2.5 h-2.5 rounded-full bg-status-prep" /> 주방 조리중
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-text-muted">
          <span className="w-2.5 h-2.5 rounded-full bg-status-done" /> 서빙 완료
        </div>
      </div>
    </header>
  )
}

function TableCard({
  group, newOrderIds, onStatusChange, onDeleteOrder, onCompleteTable,
}: {
  group: TableGroup
  newOrderIds: Set<number>
  onStatusChange: (orderId: number, newStatus: string) => void
  onDeleteOrder: (orderId: number) => void
  onCompleteTable: (tableId: number) => void
}) {
  const hasNewOrder = group.orders.some((o) => newOrderIds.has(o.id))

  return (
    <div
      className={`bg-surface rounded-[20px] border border-border shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
        hasNewOrder ? 'animate-pulse border-status-wait' : ''
      }`}
    >
      {/* Table Header */}
      <div className="px-6 py-5 bg-surface-alt border-b border-border flex justify-between items-center">
        <span className="text-[22px] font-extrabold text-text flex items-center gap-2.5">
          <span className="inline-block w-2 h-5 bg-primary rounded" />
          Table {group.table.tableNumber}
        </span>
        <span className="text-xl font-extrabold text-text">{formatPrice(group.totalAmount)}</span>
      </div>

      {/* Order List */}
      <div className="flex-1 max-h-[350px] overflow-y-auto">
        {group.orders.map((order) => (
          <div key={order.id} className="border-b border-dashed border-border px-6 py-4 last:border-0">
            <div className="flex justify-between mb-3 text-[13px] font-semibold text-text-muted">
              <span>주문번호 #{order.orderNumber}</span>
              <div className="flex items-center gap-2">
                <span>{formatTime(order.createdAt)}</span>
                <button
                  onClick={() => onDeleteOrder(order.id)}
                  className="text-text-muted hover:text-status-wait transition-colors cursor-pointer ml-1"
                  aria-label="주문 삭제"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {order.items?.map((item) => {
                const cfg = statusConfig[order.status]
                return (
                  <div key={item.id} className="flex items-center justify-between bg-bg px-4 py-2.5 rounded-[10px] border border-border">
                    <div className="flex items-center gap-3">
                      <span className="bg-surface text-text px-2 py-0.5 rounded-md text-[13px] font-extrabold border border-border">
                        {item.quantity}
                      </span>
                      <span className="text-sm font-semibold">{item.menuName}</span>
                    </div>
                    {cfg.next ? (
                      <button
                        onClick={() => onStatusChange(order.id, cfg.next!)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-transform active:scale-95 ${cfg.btnClass}`}
                      >
                        {cfg.label}
                      </button>
                    ) : (
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${cfg.btnClass}`}>
                        {cfg.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-border flex gap-3 bg-surface">
        <button className="flex-1 py-3.5 rounded-[10px] border border-border bg-surface text-text font-bold text-sm cursor-pointer hover:bg-surface-alt transition-colors active:scale-[0.98]">
          세션 관리
        </button>
        <button
          onClick={() => onCompleteTable(group.table.id)}
          className="flex-1 py-3.5 rounded-[10px] bg-text text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          결제 및 테이블 비우기
        </button>
      </div>
    </div>
  )
}
