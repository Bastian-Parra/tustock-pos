import { useState } from 'react'
import { useCashSession } from '@/hooks/useCashSession'
import OpenCashDialog from './OpenCashDialog'
import CloseCashDialog from './CloseCashDialog'
import CashMovementDialog from './CashMovementDialog'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

export default function CashShift() {
  const {
    activeSession,
    movements,
    isLoading,
    openSession,
    closeSession,
    createMovement,
  } = useCashSession()

  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showMovementDialog, setShowMovementDialog] = useState(false)

  const handleOpenSession = async (data: any) => {
    await openSession(data)
    setShowOpenDialog(false)
  }

  const handleCloseSession = async (data: any) => {
    await closeSession(data)
    setShowCloseDialog(false)
  }

  const handleCreateMovement = async (data: any) => {
    await createMovement(data)
    setShowMovementDialog(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // No session open - show a banner prompting to open cash
  if (!activeSession) {
    return (
      <>
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 font-medium">
              No hay caja abierta. Debes abrir una sesión para registrar ventas.
            </p>
          </div>
          <button
            onClick={() => setShowOpenDialog(true)}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
          >
            Abrir Caja
          </button>
        </div>

        {showOpenDialog && (
          <OpenCashDialog
            onOpen={handleOpenSession}
            onClose={() => setShowOpenDialog(false)}
          />
        )}
      </>
    )
  }

  // Session is open - show status bar
  return (
    <>
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-green-200">Caja Abierta</p>
            <p className="font-semibold">
              {new Date(activeSession.opened_at).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-200">Ventas Totales</p>
            <p className="font-semibold text-lg">
              {formatCurrency(activeSession.total_sales)}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-200">Efectivo en Caja</p>
            <p className="font-semibold text-lg">
              {formatCurrency(
                activeSession.opening_amount + activeSession.total_cash_sales
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMovementDialog(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
            title="Registrar retiro o ingreso de efectivo"
          >
            <TrendingUp size={18} />
            <TrendingDown size={18} />
            Movimientos
          </button>
          <button
            onClick={() => setShowCloseDialog(true)}
            className="bg-white text-green-700 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Cerrar Caja
          </button>
        </div>
      </div>

      {showCloseDialog && (
        <CloseCashDialog
          session={activeSession}
          movements={movements}
          onClose={handleCloseSession}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}

      {showMovementDialog && (
        <CashMovementDialog
          onSubmit={handleCreateMovement}
          onClose={() => setShowMovementDialog(false)}
        />
      )}
    </>
  )
}
