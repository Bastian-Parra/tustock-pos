import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Customer } from '@/types'
import { Search, X, User } from 'lucide-react'

interface Props {
  selectedCustomerId: string | null
  onSelect: (customer: Customer | null) => void
}

export default function CustomerSearch({ selectedCustomerId, onSelect }: Props) {
  const { tenant } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load selected customer if id provided
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null)
      return
    }
    supabase
      .from('customers')
      .select('*')
      .eq('id', selectedCustomerId)
      .single()
      .then(({ data }) => {
        if (data) setSelectedCustomer(data as Customer)
      })
  }, [selectedCustomerId])

  // Search customers
  useEffect(() => {
    if (!query.trim() || !tenant?.id) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(6)
      setResults(data as Customer[] || [])
      setLoading(false)
    }, 250)
    return () => clearTimeout(timeout)
  }, [query, tenant?.id])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    onSelect(customer)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedCustomer(null)
    onSelect(null)
    setQuery('')
  }

  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <User size={14} className="text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 truncate">{selectedCustomer.name}</p>
          {selectedCustomer.phone && (
            <p className="text-xs text-blue-600 truncate">{selectedCustomer.phone}</p>
          )}
        </div>
        <button onClick={handleClear} className="text-blue-400 hover:text-blue-600 shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {open && query.trim() && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => handleSelect(c)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition"
              >
                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
