import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyPDFs from './pages/MyPDFs.jsx'
import Chat from './pages/Chat.jsx'
import Tasks from './pages/Tasks.jsx'
import { Program, Search } from './pages/ProgramAndSearch.jsx'

function ProtectedLayout({ children }) {
  const user = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (user === null) nav('/login')
  }, [user])

  if (user === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--off-white)' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--off-white)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const user = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/programa" element={<ProtectedLayout><Program /></ProtectedLayout>} />
      <Route path="/mis-pdfs" element={<ProtectedLayout><MyPDFs /></ProtectedLayout>} />
      <Route path="/chat/:docId" element={<ProtectedLayout><Chat /></ProtectedLayout>} />
      <Route path="/tareas" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
      <Route path="/buscar" element={<ProtectedLayout><Search /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
