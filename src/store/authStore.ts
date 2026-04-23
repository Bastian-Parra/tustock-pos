import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Profile, Tenant } from '@/types'

interface AuthStore {
  user: Profile | null
  tenant: Tenant | null
  setUser: (user: Profile | null) => void
  setTenant: (tenant: Tenant | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      setUser: (user) => set({ user }),
      setTenant: (tenant) => set({ tenant }),
      logout: () => set({ user: null, tenant: null }),
    }),
    {
      name: 'pos-auth-storage',
    }
  )
)
