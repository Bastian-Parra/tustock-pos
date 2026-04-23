import { useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { CreateOrderData, Order } from '@/types'

export function useOrders() {
  const { tenant, user } = useAuthStore()
  const processingOrders = new Set<string>() // Evitar doble procesamiento
  const lastOrderTime = useRef<number>(0) // Evitar llamadas rápidas

  const createOrder = async (orderData: CreateOrderData) => {
    console.log('🚀 createOrder INICIADO - Timestamp:', Date.now());
    console.log('� createOrder CALL STACK:', new Error().stack);
    console.log('�📋 OrderData items:', orderData.items.length);
    
    if (!tenant?.id || !user?.id) {
      throw new Error('No tenant or user')
    }

    // Crear ID único para esta orden
    const orderKey = `${orderData.items.map(i => i.product_id).join('-')}-${Date.now()}`
    
    // Evitar llamadas muy rápidas (menos de 1 segundo)
    const now = Date.now()
    if (now - lastOrderTime.current < 1000) {
      console.log('🚫 Llamada muy rápida, ignorando:', now - lastOrderTime.current, 'ms')
      throw new Error('Espere antes de hacer otra venta')
    }
    
    lastOrderTime.current = now
    
    // Evitar doble procesamiento
    if (processingOrders.has(orderKey)) {
      console.log('🚫 Orden ya está siendo procesada:', orderKey)
      throw new Error('Orden ya está siendo procesada')
    }
    
    processingOrders.add(orderKey)
    console.log('🔄 Procesando orden:', orderKey)

    try {
      // Calcular totales
    const subtotal = orderData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = orderData.items.reduce((sum, item) => sum + item.tax, 0)
    const discount = orderData.discount || 0
    // El subtotal ya incluye IVA (precios con IVA incluido), tax es solo informativo
    const total = subtotal - discount

    // Generar número de orden
    const orderNumber = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle()

    if (existingOrder) {
      console.log("Orden duplicada detectada, abortando...")
      return existingOrder as Order
    }

    // Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        order_number: orderNumber,
        customer_id: orderData.customer_id || null,
        cashier_id: user.id,
        subtotal,
        tax,
        discount,
        total,
        payment_method: orderData.payment_method,
        source: 'pos',
        status: 'completed',
        payment_status: 'paid',
        notes: orderData.notes || null,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Crear items de orden
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal,
        }))
      )

    if (itemsError) throw itemsError

    // Actualizar stock usando RPC (mismo método que web)
    console.log('🔄 Actualizando stock para', orderData.items.length, 'items');
    
    for (const item of orderData.items) {
      console.log('📦 Procesando item:', item.product_name, 'cantidad:', item.quantity);
      
      // Usar el mismo RPC que el web para consistencia
      console.log('🔄 Llamando a decrement_stock RPC para:', item.product_name, 'cantidad:', item.quantity);
      
      console.log('🔄 RPC CALL - Antes de llamar a decrement_stock');
      console.log('📊 RPC Params:', { product_id: item.product_id, quantity: item.quantity });
      
      const { error: stockError, data: stockResult } = await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity
      })

      console.log('🔄 RPC RESULT - Error:', stockError);
      console.log('🔄 RPC RESULT - Data:', stockResult);

      if (stockError) {
        console.error('❌ Error updating stock:', stockError)
        // No lanzar error para no afectar la venta
      } else {
        console.log('✅ Stock actualizado correctamente con RPC para:', item.product_name, 'Resultado:', stockResult);
      }
    }

    // Actualizar totales del cliente si hay customer_id
    if (orderData.customer_id) {
      const { data: currentCustomer } = await supabase
        .from('customers')
        .select('total_purchases, total_orders')
        .eq('id', orderData.customer_id)
        .single()

      if (currentCustomer) {
        await supabase
          .from('customers')
          .update({
            total_purchases: (currentCustomer.total_purchases || 0) + total,
            total_orders: (currentCustomer.total_orders || 0) + 1,
          })
          .eq('id', orderData.customer_id)
      }
    }

    console.log('🏁 createOrder FINALIZADO - Timestamp:', Date.now());
    
    // Forzar refresco de productos en todo el sistema
    if (typeof window !== 'undefined') {
      const productIds = orderData.items.map(item => item.product_id);
      console.log('🚀 Disparando evento stock-updated con productIds:', productIds);
      
      const event = new CustomEvent('stock-updated', { 
        detail: { productIds: productIds }
      });
      
      console.log('🚀 Evento creado:', event);
      console.log('🚀 Enviando evento...');
      window.dispatchEvent(event);
      console.log('🚀 Evento enviado');
    }
    
    return order as Order
    } finally {
      // Limpiar del procesamiento
      processingOrders.delete(orderKey)
      console.log('✅ Orden procesada y liberada:', orderKey)
    }
  }

  return {
    createOrder,
  }
}
