import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'
import { CreateCashMovementData } from '@/types/cash-session'

interface CashMovementDialogProps {
  onSubmit: (data: CreateCashMovementData) => Promise<void>
  onClose: () => void
}

export default function CashMovementDialog({ onSubmit, onClose }: CashMovementDialogProps) {
  const [type, setType] = useState<'withdrawal' | 'deposit'>('withdrawal')
  const [formData, setFormData] = useState({
    amount: 0,
    reason: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        type,
        amount: formData.amount,
        reason: formData.reason,
        notes: formData.notes,
      })
      onClose()
    } catch (error) {
      console.error('Error creating movement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Movimiento de Efectivo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`p-4 border-2 rounded-lg transition ${
                  type === 'withdrawal'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ArrowDownCircle
                  className={`w-6 h-6 mx-auto mb-2 ${
                    type === 'withdrawal' ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    type === 'withdrawal' ? 'text-red-900' : 'text-gray-600'
                  }`}
                >
                  Retiro
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`p-4 border-2 rounded-lg transition ${
                  type === 'deposit'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ArrowUpCircle
                  className={`w-6 h-6 mx-auto mb-2 ${
                    type === 'deposit' ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    type === 'deposit' ? 'text-green-900' : 'text-gray-600'
                  }`}
                >
                  Ingreso
                </p>
              </button>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-semibold"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo *
            </label>
            <select
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Selecciona un motivo</option>
              {type === 'withdrawal' ? (
                <>
                  <option value="Gastos operativos">Gastos operativos</option>
                  <option value="Pago a proveedor">Pago a proveedor</option>
                  <option value="Retiro del dueño">Retiro del dueño</option>
                  <option value="Cambio de billetes">Cambio de billetes</option>
                  <option value="Otro">Otro</option>
                </>
              ) : (
                <>
                  <option value="Aporte del dueño">Aporte del dueño</option>
                  <option value="Cambio de billetes">Cambio de billetes</option>
                  <option value="Corrección de arqueo">Corrección de arqueo</option>
                  <option value="Otro">Otro</option>
                </>
              )}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.reason || formData.amount <= 0}
              className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'withdrawal'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Registrando...' : type === 'withdrawal' ? 'Registrar Retiro' : 'Registrar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
