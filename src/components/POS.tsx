import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import ProductSearch from './ProductSearch'
import Cart from './Cart'
import CashShift from './CashShift'
import PrinterSettings from './PrinterSettings'
import { LogOut, User, Building2, Printer } from 'lucide-react'

export default function POS() {
  const { user, tenant } = useAuthStore()
  const { logout } = useAuth()
  const [showPrinterSettings, setShowPrinterSettings] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Cash Shift Status Bar */}
      <CashShift />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema POS</h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 size={16} />
                <span>{tenant?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                <span>{user?.full_name || user?.email}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrinterSettings(true)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Configurar Impresora"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Productos - 70% */}
        <div className="w-[60%] border-r border-gray-200 bg-white">
          <ProductSearch />
        </div>

        {/* Carrito - 30% */}
        <div className="w-[40%]">
          <Cart />
        </div>
      </div>

      {/* Printer Settings Dialog */}
      <PrinterSettings
        isOpen={showPrinterSettings}
        onClose={() => setShowPrinterSettings(false)}
      />
    </div>
  )
}
