import { app, BrowserWindow, ipcMain, dialog, session } from 'electron'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Mantener referencia global de la ventana
let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  // Rutas para preload y assets
  const preloadPath = isDev
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, 'preload.js')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    show: false,
  })

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
  
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Este método se llamará cuando Electron haya terminado de inicializarse
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // En macOS es común recrear una ventana cuando se hace clic en el icono del dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// =====================================================
// PRINTER IPC Handlers
// =====================================================

// Listar impresoras disponibles
ipcMain.handle('printer-list', async () => {
  if (!mainWindow) return []
  const printers = mainWindow.webContents.getPrintersAsync
    ? await mainWindow.webContents.getPrintersAsync()
    : []
  return printers.map((p: any) => ({
    name: p.name,
    displayName: p.displayName || p.name,
    isDefault: p.isDefault,
    status: p.status,
  }))
})

// Imprimir ticket HTML en una ventana oculta
ipcMain.handle('printer-print', async (_event, { html, printerName, silent }: { html: string; printerName?: string; silent?: boolean }) => {
  return new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    printWindow.webContents.on('did-finish-load', () => {
      const options: Electron.WebContentsPrintOptions = {
        silent: silent !== false,
        printBackground: true,
        margins: { marginType: 'none' },
      }

      if (printerName) {
        options.deviceName = printerName
      }

      printWindow.webContents.print(options, (success, failureReason) => {
        printWindow.close()
        if (success) {
          resolve({ success: true })
        } else {
          reject(new Error(failureReason || 'Print failed'))
        }
      })
    })

    printWindow.webContents.on('did-fail-load', () => {
      printWindow.close()
      reject(new Error('Failed to load print content'))
    })
  })
})

// =====================================================
// APP IPC Handlers
// =====================================================
ipcMain.handle('app-version', () => {
  return app.getVersion()
})

ipcMain.handle('app-quit', () => {
  app.quit()
})

ipcMain.handle('app-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('app-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  dialog.showErrorBox('Error', error.message)
})
