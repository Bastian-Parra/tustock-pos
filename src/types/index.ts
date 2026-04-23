// ============================================================================
// TIPOS BASE DE LA APLICACIÓN
// ============================================================================

// Tipos de roles de usuario
export type UserRole = 'super_admin' | 'admin' | 'cashier' | 'customer'

// Tipos de planes de suscripción
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise'

// Estados de órdenes
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'

// Estados de pago
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'

// Fuentes de órdenes
export type OrderSource = 'pos' | 'ecommerce' | 'whatsapp' | 'manual'

// Métodos de pago
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'qr' | 'other'

// Dirección
export interface Address {
  street: string
  city: string
  state: string
  country: string
  postal_code: string
  additional_info?: string
}

// Tenant (Organización/Tienda)
export interface Tenant {
  id: string
  name: string
  slug: string
  subdomain: string | null
  logo_url: string | null
  settings: TenantSettings | null
  plan: SubscriptionPlan
  is_active: boolean
  created_at: string
  updated_at: string
}

// Configuración del tenant
export interface TenantSettings {
  currency?: string
  timezone?: string
  tax_rate?: number
  address?: Address
  phone?: string
  email?: string
}

// Perfil de Usuario
export interface Profile {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  tenant?: Tenant
}

// Producto
export interface Product {
  id: string
  tenant_id: string
  name: string
  description: string | null
  sku: string
  barcode: string | null
  price: number
  cost: number | null
  stock: number
  min_stock: number
  max_stock: number | null
  category_id: string | null
  image_url: string | null
  images: string[]
  is_active: boolean
  tax_rate: number
  is_perishable?: boolean
  expiry_reminder_days?: number
  has_batches?: boolean
  created_at: string
  updated_at: string
}

// Lote de producto (para productos perecibles)
export interface ProductBatch {
  id: string
  tenant_id: string
  product_id: string
  batch_code: string
  quantity: number
  expiry_date: string
  initial_quantity: number
  cost_per_unit: number
  status: 'active' | 'expired' | 'sold_out' | 'recalled'
  created_at: string
  updated_at: string
}

// Cliente
export interface Customer {
  id: string
  tenant_id: string
  profile_id: string | null
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: Address | null
  notes: string | null
  total_purchases: number
  total_orders: number
  created_at: string
  updated_at: string
}

// Item de Orden
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  sku: string | null
  quantity: number
  price: number
  cost: number | null
  discount: number
  tax: number
  subtotal: number
  created_at: string
  product?: Product
}

// Orden
export interface Order {
  id: string
  tenant_id: string
  order_number: string
  customer_id: string | null
  cashier_id: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string | null
  source: OrderSource
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  items?: OrderItem[]
}

// Item del POS
export interface POSItem {
  product: Product
  quantity: number
}

// Datos para crear orden
export interface CreateOrderData {
  customer_id?: string
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]
  payment_method: PaymentMethod
  source?: OrderSource
  notes?: string
  discount?: number
}
