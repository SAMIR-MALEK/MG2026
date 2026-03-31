import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import BarcodePage from './pages/BarcodePage'
import MovementsPage from './pages/MovementsPage'
import InventoryPage from './pages/InventoryPage'
import InventorySheetPage from './pages/InventorySheetPage'
import OfficesPage from './pages/OfficesPage'
import CategoriesPage from './pages/CategoriesPage'
import RequestsPage from './pages/RequestsPage'
import MyRequestsPage from './pages/MyRequestsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import SuppliersPage from './pages/SuppliersPage'

function Guard({ children, admin }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">جارٍ التحميل...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<DashboardPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="barcode" element={<BarcodePage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/:id" element={<InventorySheetPage />} />
          <Route path="offices" element={<OfficesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="requests" element={<Guard admin><RequestsPage /></Guard>} />
          <Route path="my-requests" element={<MyRequestsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<Guard admin><UsersPage /></Guard>} />
          <Route path="suppliers" element={<Guard admin><SuppliersPage /></Guard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
