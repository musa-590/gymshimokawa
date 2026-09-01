import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSupabase } from './providers/supabase-provider'
import { LoginPage } from './pages/login'
import { DashboardLayout } from './layouts/dashboard-layout'

const DashboardHome = lazy(() => import('./pages/dashboard/home').then((m) => ({ default: m.DashboardHome })))
const ClientesPage = lazy(() => import('./pages/dashboard/clientes').then((m) => ({ default: m.ClientesPage })))
const MembresiasPage = lazy(() => import('./pages/dashboard/membresias').then((m) => ({ default: m.MembresiasPage })))
const PersonalPage = lazy(() => import('./pages/dashboard/personal').then((m) => ({ default: m.PersonalPage })))
const ProductosPage = lazy(() => import('./pages/dashboard/productos').then((m) => ({ default: m.ProductosPage })))
const PromocionesPage = lazy(() => import('./pages/dashboard/promociones').then((m) => ({ default: m.PromocionesPage })))
const CajaPage = lazy(() => import('./pages/dashboard/caja').then((m) => ({ default: m.CajaPage })))
const AsistenciaPage = lazy(() => import('./pages/dashboard/asistencia').then((m) => ({ default: m.AsistenciaPage })))
const EgresosPage = lazy(() => import('./pages/dashboard/egresos').then((m) => ({ default: m.EgresosPage })))
const RecordatoriosPage = lazy(() => import('./pages/dashboard/recordatorios').then((m) => ({ default: m.RecordatoriosPage })))
const UsuariosPage = lazy(() => import('./pages/dashboard/usuarios').then((m) => ({ default: m.UsuariosPage })))
const ExportarPage = lazy(() => import('./pages/dashboard/exportar').then((m) => ({ default: m.ExportarPage })))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabase()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
          Verificando sesión...
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
    </div>
  )
}

export default function App() {
  const { user } = useSupabase()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="membresias" element={<MembresiasPage />} />
          <Route path="personal" element={<PersonalPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="promociones" element={<PromocionesPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path="asistencia" element={<AsistenciaPage />} />
          <Route path="egresos" element={<EgresosPage />} />
          <Route path="recordatorios" element={<RecordatoriosPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="exportar" element={<ExportarPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
