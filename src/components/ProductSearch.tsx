import { useProducts, ProductWithBatches } from '@/hooks/useProducts'
import { usePOSStore } from '@/store/posStore'
import { Search, Package, Barcode, AlertTriangle, Clock } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Product } from '@/types'

export default function ProductSearch() {
  const { products, loading, searchQuery, setSearchQuery, searchByBarcode } = useProducts()
  const { addItem } = usePOSStore()
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Escanear código de barras (detecta entrada rápida sin Enter)
  // Los escáneres de código de barras envían los datos muy rápido, sin pausas
  useEffect(() => {
    if (barcodeInput.length >= 3) {
      // Limpiar timeout anterior
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current)
      }

      // Si la entrada es muy rápida (menos de 100ms entre caracteres), probablemente es un código de barras
      // Esperar 300ms sin entrada para considerar que es un código de barras completo
      barcodeTimeoutRef.current = setTimeout(async () => {
        // Intentar buscar por código de barras primero
        if (barcodeInput.length >= 8) {
          const product = await searchByBarcode(barcodeInput)
          if (product) {
            addItem(product)
            setBarcodeInput('')
            setSearchQuery('')
            return
          }
        }
        // Si no se encuentra por código de barras, buscar por nombre/SKU
        if (barcodeInput.length > 0) {
          setSearchQuery(barcodeInput)
        }
      }, 300)
    }

    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current)
      }
    }
  }, [barcodeInput, searchByBarcode, addItem, setSearchQuery])

  const handleProductClick = (product: Product) => {
    console.log('🖱️ handleProductClick llamado para:', product.name);
    try {
      addItem(product)
      setSearchQuery('')
      setBarcodeInput('')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Error al agregar producto')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Barra de búsqueda */}
      <div className="p-4 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setBarcodeInput(e.target.value)
            }}
            placeholder="Buscar producto por nombre, SKU o código de barras..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Barcode className="text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Package size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No se encontraron productos</p>
            <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const p = product as ProductWithBatches
              const isExpiringSoon = p.days_until_expiry !== null && p.days_until_expiry !== undefined && p.days_until_expiry <= 7
              const isExpiryCritical = p.days_until_expiry !== null && p.days_until_expiry !== undefined && p.days_until_expiry <= 3

              return (
                <button
                  key={product.id}
                  disabled={product.stock <= 0}
                  onClick={() => handleProductClick(product)}
                  className={
                    product.stock <= 0
                      ? 'bg-gray-100 cursor-not-allowed rounded-lg p-4 text-left'
                      : `bg-white border rounded-lg p-4 hover:shadow-md transition text-left ${
                          isExpiryCritical ? 'border-red-300 bg-red-50' :
                          isExpiringSoon ? 'border-orange-300 bg-orange-50' :
                          'border-gray-200 hover:border-blue-500'
                        }`
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    {product.is_perishable && (
                      <Clock size={14} className="text-orange-500 ml-1 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                  {product.barcode && (
                    <p className="text-xs text-gray-400 mb-2">Código: {product.barcode}</p>
                  )}
                  {p.is_perishable && p.nearest_expiry && (
                    <div className={`flex items-center gap-1 text-xs mb-2 px-2 py-1 rounded ${
                      isExpiryCritical ? 'bg-red-100 text-red-700' :
                      isExpiringSoon ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      <AlertTriangle size={12} />
                      <span>
                        {p.days_until_expiry !== null && p.days_until_expiry !== undefined
                          ? p.days_until_expiry <= 0 
                            ? 'Vencido' 
                            : `Vence en ${p.days_until_expiry}d`
                          : `Vence: ${new Date(p.nearest_expiry).toLocaleDateString('es-CL')}`
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-blue-600">
                      ${product.price.toLocaleString('es-CL')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      product.stock > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
