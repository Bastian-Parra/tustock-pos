import { formatCurrency } from '@/lib/utils'

export interface TicketData {
  // Negocio
  businessName: string
  businessAddress?: string
  businessPhone?: string
  businessRut?: string

  // Orden
  orderNumber: string
  date: string
  cashierName: string

  // Items
  items: {
    name: string
    quantity: number
    unitPrice: number
    total: number
  }[]

  // Totales
  subtotal: number
  discount: number
  tax: number
  taxRate: number
  total: number

  // Pago
  paymentMethod: string
  amountPaid?: number
  change?: number

  // Footer
  footerMessage?: string
}

export interface PrinterConfig {
  printerName: string | null
  paperWidth: '58mm' | '80mm'
  autoPrint: boolean
  showPreview: boolean
  fontSize: 'small' | 'normal' | 'large'
  footerMessage: string
}

const DEFAULT_CONFIG: PrinterConfig = {
  printerName: null,
  paperWidth: '80mm',
  autoPrint: true,
  showPreview: false,
  fontSize: 'normal',
  footerMessage: '¡Gracias por su compra!',
}

export function loadPrinterConfig(): PrinterConfig {
  try {
    const saved = localStorage.getItem('pos-printer-config')
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    }
  } catch {}
  return DEFAULT_CONFIG
}

export function savePrinterConfig(config: PrinterConfig) {
  localStorage.setItem('pos-printer-config', JSON.stringify(config))
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  qr: 'QR',
  other: 'Otro',
}

function getFontSize(size: PrinterConfig['fontSize']): string {
  switch (size) {
    case 'small': return '10px'
    case 'large': return '14px'
    default: return '12px'
  }
}

export function generateTicketHTML(data: TicketData, config: PrinterConfig = DEFAULT_CONFIG): string {
  const width = config.paperWidth === '58mm' ? '220px' : '302px'
  const fontSize = getFontSize(config.fontSize)

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="text-align:left;padding:1px 0;">${item.name}</td>
      <td style="text-align:center;padding:1px 0;">${item.quantity}</td>
      <td style="text-align:right;padding:1px 0;">${formatCurrency(item.total)}</td>
    </tr>
    ${item.quantity > 1 ? `<tr><td colspan="3" style="text-align:left;color:#666;font-size:${config.fontSize === 'small' ? '8px' : '10px'};padding:0 0 2px 4px;">${item.quantity} x ${formatCurrency(item.unitPrice)}</td></tr>` : ''}
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      width: ${width};
      padding: 8px;
      color: #000;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 2px 0; border-bottom: 1px solid #000; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3) { text-align: right; }
    .total-row td { padding: 2px 0; }
    .grand-total { font-size: ${config.fontSize === 'small' ? '14px' : '16px'}; font-weight: bold; }
    .footer { margin-top: 8px; font-size: ${config.fontSize === 'small' ? '9px' : '10px'}; color: #333; }
    @media print {
      @page {
        margin: 0;
        size: ${config.paperWidth} auto;
      }
      body { width: 100%; padding: 4px; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center bold" style="font-size:${config.fontSize === 'small' ? '14px' : '16px'};">
    ${data.businessName}
  </div>
  ${data.businessRut ? `<div class="center" style="margin-top:2px;">RUT: ${data.businessRut}</div>` : ''}
  ${data.businessAddress ? `<div class="center" style="font-size:${config.fontSize === 'small' ? '9px' : '10px'};">${data.businessAddress}</div>` : ''}
  ${data.businessPhone ? `<div class="center" style="font-size:${config.fontSize === 'small' ? '9px' : '10px'};">Tel: ${data.businessPhone}</div>` : ''}

  <div class="divider"></div>

  <!-- Orden Info -->
  <div style="display:flex;justify-content:space-between;">
    <span>Ticket: ${data.orderNumber}</span>
  </div>
  <div style="display:flex;justify-content:space-between;">
    <span>${data.date}</span>
  </div>
  <div>Cajero: ${data.cashierName}</div>

  <div class="divider"></div>

  <!-- Items -->
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cant</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="double-divider"></div>

  <!-- Totales -->
  <table class="total-row">
    <tr>
      <td>Subtotal</td>
      <td class="right">${formatCurrency(data.subtotal)}</td>
    </tr>
    ${data.discount > 0 ? `
    <tr>
      <td>Descuento</td>
      <td class="right">-${formatCurrency(data.discount)}</td>
    </tr>
    ` : ''}
    <tr>
      <td>IVA (${(data.taxRate * 100).toFixed(0)}%)</td>
      <td class="right">${formatCurrency(data.tax)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <table>
    <tr class="grand-total">
      <td>TOTAL</td>
      <td class="right">${formatCurrency(data.total)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <!-- Pago -->
  <div>
    <span class="bold">Pago: </span>${PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod}
  </div>
  ${data.amountPaid ? `
  <div>
    <span>Recibido: </span>${formatCurrency(data.amountPaid)}
  </div>
  <div class="bold">
    <span>Vuelto: </span>${formatCurrency(data.change || 0)}
  </div>
  ` : ''}

  <div class="divider"></div>

  <!-- Footer -->
  <div class="center footer">
    ${data.footerMessage || config.footerMessage || '¡Gracias por su compra!'}
  </div>
  <div class="center footer" style="margin-top:4px;">
    ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
  </div>
</body>
</html>`
}

export async function printTicket(data: TicketData, config?: PrinterConfig): Promise<boolean> {
  const cfg = config || loadPrinterConfig()
  const html = generateTicketHTML(data, cfg)

  // Check if running in Electron
  if (window.electronAPI?.print) {
    try {
      await window.electronAPI.print({
        html,
        printerName: cfg.printerName || undefined,
        silent: !cfg.showPreview,
      })
      return true
    } catch (error) {
      console.error('Error printing ticket:', error)
      return false
    }
  }

  // Fallback: open in new window for browser printing
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    setTimeout(() => printWindow.close(), 2000)
    return true
  }

  return false
}

export async function getAvailablePrinters(): Promise<Array<{ name: string; displayName: string; isDefault: boolean }>> {
  if (window.electronAPI?.getPrinters) {
    return await window.electronAPI.getPrinters()
  }
  return []
}
