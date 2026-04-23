import { useState, useEffect } from 'react'
import { Printer, X, Save, RefreshCw } from 'lucide-react'
import { PrinterConfig, loadPrinterConfig, savePrinterConfig, getAvailablePrinters } from '@/lib/ticket-printer'
import toast from 'react-hot-toast'

interface PrinterSettingsProps {
  isOpen: boolean
  onClose: () => void
}

interface PrinterInfo {
  name: string
  displayName: string
  isDefault: boolean
}

export default function PrinterSettings({ isOpen, onClose }: PrinterSettingsProps) {
  const [config, setConfig] = useState<PrinterConfig>(loadPrinterConfig())
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setConfig(loadPrinterConfig())
      fetchPrinters()
    }
  }, [isOpen])

  async function fetchPrinters() {
    setLoadingPrinters(true)
    try {
      const list = await getAvailablePrinters()
      setPrinters(list)
    } catch (error) {
      console.error('Error fetching printers:', error)
    } finally {
      setLoadingPrinters(false)
    }
  }

  function handleSave() {
    savePrinterConfig(config)
    toast.success('Configuración de impresora guardada')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Printer className="text-blue-600" size={20} />
            </div>
            <h2 className="font-bold text-gray-900">Configuración de Impresora</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Seleccionar impresora */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Impresora</label>
              <button
                onClick={fetchPrinters}
                disabled={loadingPrinters}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCw size={12} className={loadingPrinters ? 'animate-spin' : ''} />
                Actualizar
              </button>
            </div>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              value={config.printerName || ''}
              onChange={(e) => setConfig({ ...config, printerName: e.target.value || null })}
            >
              <option value="">Impresora por defecto del sistema</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName} {p.isDefault ? '(Por defecto)' : ''}
                </option>
              ))}
            </select>
            {printers.length === 0 && !loadingPrinters && (
              <p className="text-xs text-gray-400 mt-1">
                No se detectaron impresoras. Verifica que estén instaladas.
              </p>
            )}
          </div>

          {/* Ancho de papel */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Ancho de Papel</label>
            <div className="grid grid-cols-2 gap-2">
              {(['58mm', '80mm'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setConfig({ ...config, paperWidth: w })}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                    config.paperWidth === w
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {w}
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {w === '58mm' ? 'Mini (Portátil)' : 'Estándar'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamaño de fuente */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tamaño de Letra</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'small' as const, label: 'Pequeña' },
                { value: 'normal' as const, label: 'Normal' },
                { value: 'large' as const, label: 'Grande' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setConfig({ ...config, fontSize: value })}
                  className={`p-2 border-2 rounded-lg text-sm transition ${
                    config.fontSize === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-imprimir */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Imprimir automáticamente</label>
              <p className="text-xs text-gray-500">Al completar una venta</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, autoPrint: !config.autoPrint })}
              className={`relative w-11 h-6 rounded-full transition ${
                config.autoPrint ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.autoPrint ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          {/* Mostrar vista previa */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Mostrar vista previa</label>
              <p className="text-xs text-gray-500">Antes de enviar a imprimir</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, showPreview: !config.showPreview })}
              className={`relative w-11 h-6 rounded-full transition ${
                config.showPreview ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.showPreview ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          {/* Mensaje de pie */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mensaje al pie del ticket</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={config.footerMessage}
              onChange={(e) => setConfig({ ...config, footerMessage: e.target.value })}
              placeholder="¡Gracias por su compra!"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
