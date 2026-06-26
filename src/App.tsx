import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';

// Pages (Customer)
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import Register from './pages/Register';

// Customer Protected Routes Wrapper
const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-purple-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-purple-500/30">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Routes (Protected) */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <div className="p-8 text-center">Profile Page Coming Soon</div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/show/:id" 
                element={
                  <ProtectedRoute>
                    <div className="p-8 text-center">Show Details & Seat Selection Coming Soon</div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout/:id" 
                element={
                  <ProtectedRoute>
                    <div className="p-8 text-center">Checkout Page Coming Soon</div>
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes (Protected, Admin Only) */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="p-8 text-center text-red-400">Admin Layout Coming Soon</div>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}