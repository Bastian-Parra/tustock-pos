import { create } from 'zustand'
import { POSItem, Product } from '@/types'

interface POSStore {
  items: POSItem[]
  customerId: string | null
  discount: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'other' | null
  
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setCustomer: (customerId: string | null) => void
  setDiscount: (discount: number) => void
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer' | 'qr' | 'other' | null) => void
  
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const usePOSStore = create<POSStore>((set, get) => ({
  items: [],
  customerId: null,
  discount: 0,
  paymentMethod: null,
  
  addItem: (product, quantity = 1) => {
    const existingItem = get().items.find(item => item.product.id === product.id)
    const availableStock = product.stock || 0
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      // Si ya existe, incrementar cantidad
      if (newQuantity > availableStock) {
        throw new Error('Stock insuficiente')
      }

      set({
        items: get().items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        ),
      })
    } else {

      if (availableStock <= 0) {
        throw new Error('Producto sin stock disponible')
      }
      // Si no existe, agregar nuevo item
      set({
        items: [...get().items, { product, quantity }],
      })
    }
  },
  
  removeItem: (productId) => {
    set({
      items: get().items.filter(item => item.product.id !== productId),
    })
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    const item = get().items.find(item => item.product.id === productId)

    if (item) {
      const availableStock = item.product.stock || 0
      if (quantity > availableStock) {
        throw new Error('Stock insuficiente')
      }
    }
    
    set({
      items: get().items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ),
    })
  },
  
  clearCart: () => {
    set({
      items: [],
      customerId: null,
      discount: 0,
      paymentMethod: null,
    })
  },
  
  setCustomer: (customerId) => {
    set({ customerId })
  },
  
  setDiscount: (discount) => {
    set({ discount: Math.max(0, discount) })
  },
  
  setPaymentMethod: (paymentMethod) => {
    set({ paymentMethod })
  },
  
  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const discountAmount = get().discount
    return subtotal - discountAmount
  },
  
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
