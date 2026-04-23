import { useState, useEffect } from 'react'
import { Printer, X, Check, Eye } from 'lucide-react'
import { TicketData, PrinterConfig, generateTicketHTML, printTicket, loadPrinterConfig } from '@/lib/ticket-printer'

interface PrintTicketDialogProps {
  isOpen: boolean
  onClose: () => void
  ticketData: TicketData | null
}

export default function PrintTicketDialog({ isOpen, onClose, ticketData }: PrintTicketDialogProps) {
  const [printing, setPrinting] = useState(false)
  const [printed, setPrinted] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [config, setConfig] = useState<PrinterConfig>(loadPrinterConfig())

  useEffect(() => {
    if (isOpen) {
      setPrinted(false)
      setPrinting(false)
      setConfig(loadPrinterConfig())

      // Auto-print si está configurado
      const cfg = loadPrinterConfig()
      if (cfg.autoPrint && ticketData && !cfg.showPreview) {
        handlePrint(cfg)
      }
    }
  }, [isOpen, ticketData])

  async function handlePrint(overrideConfig?: PrinterConfig) {
    if (!ticketData || printing) return
    setPrinting(true)
    try {
      const success = await printTicket(ticketData, overrideConfig || config)
      if (success) {
        setPrinted(true)
      }
    } catch (error) {
      console.error('Print error:', error)
    } finally {
      setPrinting(false)
    }
  }

  if (!isOpen || !ticketData) return null

  const previewHtml = generateTicketHTML(ticketData, config)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${printed ? 'bg-green-100' : 'bg-blue-100'}`}>
              {printed ? <Check className="text-green-600" size={20} /> : <Printer className="text-blue-600" size={20} />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {printed ? 'Ticket Impreso' : 'Imprimir Ticket'}
              </h2>
              <p className="text-sm text-gray-500">
                Venta {ticketData.orderNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Preview */}
        {showPreview ? (
          <div className="flex-1 overflow-auto p-4 bg-gray-50">
            <div className="mx-auto bg-white shadow-md" style={{ width: config.paperWidth === '58mm' ? '220px' : '302px' }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Resumen rápido */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items</span>
                <span className="font-medium">{ticketData.items.length} productos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Método de pago</span>
                <span className="font-medium capitalize">{ticketData.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-blue-600">${ticketData.total.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Impresora */}
            {config.printerName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Printer size={14} />
                <span>Impresora: <strong>{config.printerName}</strong></span>
              </div>
            )}

            {printed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <Check className="mx-auto text-green-600 mb-1" size={24} />
                <p className="text-sm font-medium text-green-800">Ticket enviado a imprimir</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            <Eye size={16} />
            {showPreview ? 'Ocultar' : 'Vista Previa'}
          </button>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            {printed ? 'Cerrar' : 'Omitir'}
          </button>

          <button
            onClick={() => handlePrint()}
            disabled={printing}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition text-sm font-medium"
          >
            <Printer size={16} />
            {printing ? 'Imprimiendo...' : printed ? 'Reimprimir' : 'Imprimir'}
          </button>
        </div>
      </div>
    </div>
  )
}
