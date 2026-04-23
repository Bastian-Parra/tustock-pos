import { useState } from 'react'
import { DollarSign, X, AlertCircle } from 'lucide-react'
import { CloseCashSessionData } from '@/types/cash-session'
import { CashSession, CashMovement } from '@/types/cash-session'
import { formatCurrency } from '@/lib/utils'

interface CloseCashDialogProps {
  session: CashSession
  movements: CashMovement[]
  onClose: (data: CloseCashSessionData) => Promise<void>
  onCancel: () => void
}

export default function CloseCashDialog({
  session,
  movements,
  onClose,
  onCancel,
}: CloseCashDialogProps) {
  const [formData, setFormData] = useState<CloseCashSessionData>({
    closing_amount: 0,
    closing_notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calcular monto esperado
  const totalDeposits = movements
    .filter((m) => m.type === 'deposit')
    .reduce((sum, m) => sum + m.amount, 0)

  const totalWithdrawals = movements
    .filter((m) => m.type === 'withdrawal')
    .reduce((sum, m) => sum + m.amount, 0)

  const expectedAmount =
    session.opening_amount +
    session.total_cash_sales +
    totalDeposits -
    totalWithdrawals

  const difference = formData.closing_amount - expectedAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onClose(formData)
    } catch (error) {
      console.error('Error closing cash:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Cierre de Caja</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumen de la sesión */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen del Día</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Apertura</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(session.opening_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(session.total_sales)}
                </p>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">💵 Efectivo</span>
                <span className="font-medium">{formatCurrency(session.total_cash_sales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">💳 Tarjeta</span>
                <span className="font-medium">{formatCurrency(session.total_card_sales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">🏦 Transferencia</span>
                <span className="font-medium">{formatCurrency(session.total_transfer_sales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">📱 QR</span>
                <span className="font-medium">{formatCurrency(session.total_qr_sales)}</span>
              </div>
              {session.total_other_sales > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Otro</span>
                  <span className="font-medium">{formatCurrency(session.total_other_sales)}</span>
                </div>
              )}
            </div>

            {movements.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Movimientos de Efectivo</p>
                {totalDeposits > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">+ Ingresos</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(totalDeposits)}
                    </span>
                  </div>
                )}
                {totalWithdrawals > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">- Retiros</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(totalWithdrawals)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Efectivo Esperado</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(expectedAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de cierre */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efectivo Contado en Caja *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.closing_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    closing_amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-lg font-semibold"
                placeholder="0.00"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Cuenta el efectivo físico en la caja
              </p>
            </div>

            {/* Diferencia */}
            {formData.closing_amount > 0 && (
              <div
                className={`p-4 rounded-lg ${
                  Math.abs(difference) < 0.01
                    ? 'bg-green-50 border border-green-200'
                    : difference > 0
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${
                      Math.abs(difference) < 0.01
                        ? 'text-green-600'
                        : difference > 0
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {Math.abs(difference) < 0.01
                        ? '✓ Cuadra perfecto'
                        : difference > 0
                        ? 'Sobrante en caja'
                        : 'Faltante en caja'}
                    </p>
                    {Math.abs(difference) >= 0.01 && (
                      <p className="text-sm text-gray-700 mt-1">
                        Diferencia:{' '}
                        <span className="font-semibold">
                          {difference > 0 ? '+' : ''}
                          {formatCurrency(difference)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas de Cierre (Opcional)
              </label>
              <textarea
                value={formData.closing_notes}
                onChange={(e) =>
                  setFormData({ ...formData, closing_notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                placeholder="Ej: Explicación de diferencias, observaciones del día..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formData.closing_amount === 0}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
