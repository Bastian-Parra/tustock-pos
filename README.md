# Ventas POS - Sistema de Punto de Venta Desktop

Sistema POS (Point of Sale) desarrollado con Electron para la aplicación Ventas-App. Comparte la misma base de datos Supabase y mantiene la arquitectura multi-tenant.

## 🚀 Características

- ✅ **Multi-tenant**: Comparte datos con la aplicación web
- ✅ **Autenticación**: Login con Supabase Auth
- ✅ **Búsqueda de productos**: Por nombre, SKU o código de barras
- ✅ **Escáner de código de barras**: Soporte para escáneres USB
- ✅ **Carrito de venta**: Gestión completa de items
- ✅ **Múltiples métodos de pago**: Efectivo, tarjeta, transferencia, QR
- ✅ **Descuentos**: Aplicación de descuentos por venta
- ✅ **Actualización de stock**: Automática al completar venta
- ✅ **Registro de movimientos**: Historial de inventario

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn
- Variables de entorno de Supabase (mismas que la web app)

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

3. **Desarrollo:**
```bash
npm run dev
```

Esto iniciará:
- Vite dev server en `http://localhost:5173`
- Electron app

## 📦 Build

### Desarrollo
```bash
npm run build:main    # Compilar main process
npm run build:renderer # Compilar renderer (React)
```

### Producción
```bash
npm run build
```

Esto generará los ejecutables en la carpeta `release/`:
- **Windows**: `.exe` y instalador NSIS
- **macOS**: `.dmg`
- **Linux**: `.AppImage`

## 🏗️ Estructura del Proyecto

```
pos-desktop/
├── electron/          # Proceso principal de Electron
│   ├── main.ts       # Entry point de Electron
│   └── preload.ts    # Script de preload (bridge)
├── src/
│   ├── components/   # Componentes React
│   │   ├── Login.tsx
│   │   ├── POS.tsx
│   │   ├── ProductSearch.tsx
│   │   └── Cart.tsx
│   ├── hooks/        # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   └── useOrders.ts
│   ├── lib/          # Utilidades
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── store/        # Zustand stores
│   │   ├── authStore.ts
│   │   └── posStore.ts
│   ├── types/        # TypeScript types
│   │   └── index.ts
│   ├── App.tsx       # Componente principal
│   └── main.tsx      # Entry point React
├── assets/           # Iconos y recursos
├── dist/             # Build output
└── release/          # Ejecutables finales
```

## 🔧 Configuración

### Variables de Entorno

El proyecto usa las mismas variables de Supabase que la aplicación web:
- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Clave anónima de Supabase

### Multi-Tenant

El sistema mantiene la arquitectura multi-tenant:
- Cada usuario pertenece a un tenant
- Los datos se filtran automáticamente por `tenant_id`
- La autenticación carga el tenant del usuario

## 🎯 Uso

### Iniciar Sesión
1. Ingresa tu email y contraseña
2. El sistema cargará automáticamente tu tenant y productos

### Buscar Productos
- **Búsqueda manual**: Escribe nombre, SKU o código de barras
- **Escáner USB**: Escanea directamente con un escáner de código de barras USB
  - El sistema detecta automáticamente la entrada rápida del escáner
  - Busca el producto y lo agrega al carrito

### Agregar al Carrito
- Click en un producto para agregarlo
- O escanea con el código de barras
- Ajusta cantidades con los botones +/-

### Completar Venta
1. Selecciona método de pago (Efectivo, Tarjeta, Transferencia, QR)
2. Opcional: Aplica descuento
3. Click en "Completar Venta"
4. El sistema:
   - Crea la orden
   - Actualiza el stock
   - Registra el movimiento de inventario
   - Limpia el carrito

## 🔌 Integración con Web App

El POS comparte completamente los datos con la web app:
- ✅ Mismos productos
- ✅ Mismas órdenes
- ✅ Mismo inventario
- ✅ Mismos clientes
- ✅ Mismo tenant

Las ventas realizadas en el POS aparecen inmediatamente en el dashboard web.

## 🐛 Troubleshooting

### El escáner no funciona
- Asegúrate de que el escáner esté configurado en modo "HID Keyboard"
- Verifica que el campo de búsqueda tenga el foco
- Prueba escaneando directamente en el campo de búsqueda

### Error de conexión a Supabase
- Verifica las variables de entorno en `.env`
- Asegúrate de que las credenciales sean correctas
- Revisa la consola de Electron (DevTools) para más detalles

### Build falla
- Asegúrate de tener todas las dependencias instaladas
- Verifica que TypeScript compile sin errores
- Revisa los logs de electron-builder

## 📝 Scripts Disponibles

- `npm run dev` - Desarrollo (Vite + Electron)
- `npm run dev:react` - Solo Vite dev server
- `npm run electron` - Solo Electron (requiere build previo)
- `npm run build` - Build completo para producción
- `npm run build:main` - Compilar solo main process
- `npm run build:renderer` - Compilar solo renderer

## 🔒 Seguridad

- El preload script usa `contextIsolation` para seguridad
- No se expone `nodeIntegration` en el renderer
- Las credenciales de Supabase se mantienen seguras
- La autenticación usa Supabase Auth con persistencia local

## 📄 Licencia

MIT

## 👥 Contribuir

Este proyecto es parte de Ventas-App. Para contribuir, sigue las mismas convenciones que la aplicación web principal.
