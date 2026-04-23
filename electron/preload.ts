import { contextBridge, ipcRenderer } from 'electron'

// Exponer APIs protegidas al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App controls
  getVersion: () => ipcRenderer.invoke('app-version'),
  quit: () => ipcRenderer.invoke('app-quit'),
  minimize: () => ipcRenderer.invoke('app-minimize'),
  maximize: () => ipcRenderer.invoke('app-maximize'),
  
  // Printer
  getPrinters: () => ipcRenderer.invoke('printer-list'),
  print: (options: { html: string; printerName?: string; silent?: boolean }) =>
    ipcRenderer.invoke('printer-print', options),

  // Platform info
  platform: process.platform,
})

// Tipos para TypeScript
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>
      quit: () => Promise<void>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      getPrinters: () => Promise<Array<{ name: string; displayName: string; isDefault: boolean; status: number }>>
      print: (options: { html: string; printerName?: string; silent?: boolean }) => Promise<{ success: boolean }>
      platform: string
    }
  }
}
