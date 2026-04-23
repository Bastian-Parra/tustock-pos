import { useState } from 'react'
import { DollarSign, X } from 'lucide-react'
import { OpenCashSessionData } from '@/types/cash-session'

interface OpenCashDialogProps {
  onOpen: (data: OpenCashSessionData) => Promise<void>
  onClose: () => void
}

export default function OpenCashDialog({ onOpen, onClose }: OpenCashDialogProps) {
  const [formData, setFormData] = useState<OpenCashSessionData>({
    opening_amount: 0,
    opening_notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onOpen(formData)
      onClose()
    } catch (error) {
      console.error('Error opening cash:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Apertura de Caja</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Inicial en Efectivo *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.opening_amount}
              onChange={(e) =>
                setFormData({ ...formData, opening_amount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg font-semibold"
              placeholder="0.00"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el monto de efectivo con el que inicias el día
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.opening_notes}
              onChange={(e) =>
                setFormData({ ...formData, opening_notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              placeholder="Ej: Billetes de 1000, 2000, 5000..."
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
