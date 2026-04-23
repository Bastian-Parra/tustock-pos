import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
  CashSession,
  CashMovement,
  OpenCashSessionData,
  CloseCashSessionData,
  CreateCashMovementData,
} from '@/types/cash-session'
import toast from 'react-hot-toast'

export function useCashSession() {
  const { tenant, user } = useAuthStore()
  const [activeSession, setActiveSession] = useState<CashSession | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar sesión activa
  const loadActiveSession = async () => {
    if (!tenant || !user) {
      setActiveSession(null)
      setMovements([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .rpc('get_active_cash_session', {
          p_tenant_id: tenant.id,
          p_cashier_id: user.id,
        })

      if (error) throw error

      if (data && data.length > 0) {
        setActiveSession(data[0] as CashSession)
        await loadMovements(data[0].id)
      } else {
        setActiveSession(null)
        setMovements([])
      }
    } catch (error: any) {
      console.error('Error loading active session:', error)
      toast.error('Error al cargar sesión de caja')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar movimientos de efectivo
  const loadMovements = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('cash_session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMovements(data || [])
    } catch (error: any) {
      console.error('Error loading movements:', error)
    }
  }

  // Abrir caja
  const openSession = async (data: OpenCashSessionData) => {
    if (!tenant || !user) {
      toast.error('No hay sesión de usuario activa')
      return null
    }

    try {
      const { data: newSession, error } = await supabase
        .from('cash_sessions')
        .insert({
          tenant_id: tenant.id,
          cashier_id: user.id,
          opening_amount: data.opening_amount,
          opening_notes: data.opening_notes,
          status: 'open',
        })
        .select()
        .single()

      if (error) throw error

      setActiveSession(newSession)
      toast.success('Caja abierta exitosamente')
      return newSession
    } catch (error: any) {
      console.error('Error opening session:', error)
      toast.error('Error al abrir caja')
      return null
    }
  }

  // Cerrar caja
  const closeSession = async (data: CloseCashSessionData) => {
    if (!activeSession) {
      toast.error('No hay sesión activa')
      return null
    }

    try {
      // Calcular monto esperado
      const expectedAmount =
        activeSession.opening_amount +
        activeSession.total_cash_sales +
        movements
          .filter((m) => m.type === 'deposit')
          .reduce((sum, m) => sum + m.amount, 0) -
        movements
          .filter((m) => m.type === 'withdrawal')
          .reduce((sum, m) => sum + m.amount, 0)

      const difference = data.closing_amount - expectedAmount

      const { data: closedSession, error } = await supabase
        .from('cash_sessions')
        .update({
          closed_at: new Date().toISOString(),
          closing_amount: data.closing_amount,
          expected_amount: expectedAmount,
          difference: difference,
          closing_notes: data.closing_notes,
          status: 'closed',
        })
        .eq('id', activeSession.id)
        .select()
        .single()

      if (error) throw error

      setActiveSession(null)
      setMovements([])
      toast.success('Caja cerrada exitosamente')
      return closedSession
    } catch (error: any) {
      console.error('Error closing session:', error)
      toast.error('Error al cerrar caja')
      return null
    }
  }

  // Crear movimiento de efectivo
  const createMovement = async (data: CreateCashMovementData) => {
    if (!activeSession || !tenant || !user) {
      toast.error('No hay sesión activa')
      return null
    }

    try {
      const { data: newMovement, error } = await supabase
        .from('cash_movements')
        .insert({
          cash_session_id: activeSession.id,
          tenant_id: tenant.id,
          user_id: user.id,
          type: data.type,
          amount: data.amount,
          reason: data.reason,
          notes: data.notes,
        })
        .select()
        .single()

      if (error) throw error

      setMovements([newMovement, ...movements])
      toast.success(
        data.type === 'withdrawal' ? 'Retiro registrado' : 'Ingreso registrado'
      )
      
      // Recargar sesión para actualizar totales
      await loadActiveSession()
      
      return newMovement
    } catch (error: any) {
      console.error('Error creating movement:', error)
      toast.error('Error al registrar movimiento')
      return null
    }
  }

  // Cargar al montar y suscribir a cambios en tiempo real
  useEffect(() => {
    if (!tenant || !user) {
      setActiveSession(null)
      setMovements([])
      setIsLoading(false)
      return
    }

    loadActiveSession()

    // Suscripción en tiempo real para actualizar totales
    const subscription = supabase
      .channel('cash_session_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cash_sessions',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.status === 'open') {
            setActiveSession(payload.new as CashSession)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [tenant?.id, user?.id])

  return {
    activeSession,
    movements,
    isLoading,
    openSession,
    closeSession,
    createMovement,
    refreshSession: loadActiveSession,
  }
}
