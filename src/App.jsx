import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Sidebar, { BottomNav } from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyPDFs from './pages/MyPDFs.jsx'
import Chat from './pages/Chat.jsx'
import FreeChat from './pages/FreeChat.jsx'
import Tasks from './pages/Tasks.jsx'
import { Program, Search } from './pages/ProgramAndSearch.jsx'
import { useTheme } from './components/UI.jsx'

function useIsMobile() { return window.innerWidth < 768 }

function Layout({ children }) {
  const isMobile = useIsMobile()
  const loc = useLocation()
  const isFullscreen = loc.pathname.startsWith('/chat/') || loc.pathname === '/marcos'
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, overflowY: isFullscreen ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
      </main>
      {isMobile && <BottomNav />}
    </div>
  )
}

function ProtectedLayout({ children }) {
  const user = useAuth()
  const nav = useNavigate()
  useTheme()
  useEffect(() => { if (user === null) nav('/login') }, [user])
  if (user === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #e0e0e0', borderTopColor: '#2d6a4f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!user) return null
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const user = useAuth()
  return (
    <Routes>
      <Route path="/login"        element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/"             element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/marcos"       element={<ProtectedLayout><FreeChat /></ProtectedLayout>} />
      <Route path="/programa"     element={<ProtectedLayout><Program /></ProtectedLayout>} />
      <Route path="/mis-pdfs"     element={<ProtectedLayout><MyPDFs /></ProtectedLayout>} />
      <Route path="/chat/:docId"  element={<ProtectedLayout><Chat /></ProtectedLayout>} />
      <Route path="/tareas"       element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
      <Route path="/buscar"       element={<ProtectedLayout><Search /></ProtectedLayout>} />
      <Route path="*"             element={<Navigate to="/" />} />
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
