export interface CashSession {
  id: string
  tenant_id: string
  cashier_id: string
  
  // Apertura
  opened_at: string
  opening_amount: number
  opening_notes?: string
  
  // Cierre
  closed_at?: string
  closing_amount?: number
  expected_amount?: number
  difference?: number
  closing_notes?: string
  
  // Totales
  total_sales: number
  total_cash_sales: number
  total_card_sales: number
  total_transfer_sales: number
  total_qr_sales: number
  total_other_sales: number
  
  // Metadata
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
}

export interface CashMovement {
  id: string
  cash_session_id: string
  tenant_id: string
  user_id: string
  type: 'withdrawal' | 'deposit'
  amount: number
  reason: string
  notes?: string
  created_at: string
}

export interface CashSessionWithMovements extends CashSession {
  movements: CashMovement[]
}

export interface OpenCashSessionData {
  opening_amount: number
  opening_notes?: string
}

export interface CloseCashSessionData {
  closing_amount: number
  closing_notes?: string
}

export interface CreateCashMovementData {
  type: 'withdrawal' | 'deposit'
  amount: number
  reason: string
  notes?: string
}
