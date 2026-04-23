import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Product, ProductBatch } from '@/types'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ProductWithBatches extends Product {
  batches?: ProductBatch[]
  nearest_expiry?: string | null
  days_until_expiry?: number | null
}

export function useProducts() {
  const { tenant } = useAuthStore()
  const [products, setProducts] = useState<ProductWithBatches[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!tenant?.id) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          batches:product_batches(
            id, batch_code, quantity, expiry_date, 
            initial_quantity, cost_per_unit, status,
            tenant_id, product_id, created_at, updated_at
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      
      const enriched: ProductWithBatches[] = ((data as ProductWithBatches[]) || []).map(product => {
        if (product.is_perishable && product.batches && product.batches.length > 0) {
          const activeBatches = product.batches
            .filter(b => b.status === 'active' && new Date(b.expiry_date) >= new Date())
            .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
          
          const nearestBatch = activeBatches[0]
          const daysUntil = nearestBatch 
            ? Math.ceil((new Date(nearestBatch.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null

          return {
            ...product,
            nearest_expiry: nearestBatch?.expiry_date || null,
            days_until_expiry: daysUntil,
          }
        }
        return { ...product, nearest_expiry: null, days_until_expiry: null }
      })
      
      setProducts(enriched)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, searchQuery])

  // Fetch products on mount and when dependencies change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Supabase Realtime subscription for web-POS sync
  useEffect(() => {
    if (!tenant?.id) return

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`products-sync-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          fetchProducts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_batches',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [tenant?.id, fetchProducts])

  // Local stock-updated event listener (for same-app updates)
  useEffect(() => {
    const handleStockUpdate = () => {
      fetchProducts()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('stock-updated', handleStockUpdate as EventListener)
      return () => {
        window.removeEventListener('stock-updated', handleStockUpdate as EventListener)
      }
    }
  }, [fetchProducts])

  const searchByBarcode = async (barcode: string): Promise<Product | null> => {
    if (!tenant?.id) return null

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single()

      if (error || !data) return null
      return data as Product
    } catch (error) {
      console.error('Error searching by barcode:', error)
      return null
    }
  }

  return {
    products,
    loading,
    searchQuery,
    setSearchQuery,
    searchByBarcode,
    refetch: fetchProducts,
  }
}
