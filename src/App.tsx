import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import Login from './components/Login'
import POS from './components/POS'

function App() {
  const { isLoading } = useAuth()
  const { user } = useAuthStore()

  // Solo mostrar spinner si está cargando Y no hay usuario previo en el store
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      {user ? <POS /> : <Login />}
      <Toaster position="top-right" />
    </>
  )
}

export default App
