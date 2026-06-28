import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages (Customer)
import { Home } from './pages/Home';
import { MovieDetails } from './pages/MovieDetails';
import { ShowDetails } from './pages/ShowDetails';
import { Login } from './pages/Login';
import Register from './pages/Register';
import { Checkout } from './pages/Checkout';
import { Tickets } from './pages/Tickets';
import { TicketDetails } from './pages/TicketDetails';
import { Profile } from './pages/Profile';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { SalesReports } from './pages/admin/SalesReports';
import { ManageMovies } from './pages/ManageMovies';
import { ManageStudios } from './pages/ManageStudios';
import { ManageShows } from './pages/admin/ManageShows';

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
            <ErrorBoundary>
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
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tickets" 
                  element={
                    <ProtectedRoute>
                      <Tickets />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ticket/:id" 
                  element={
                    <ProtectedRoute>
                      <TicketDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/movie/:id" 
                  element={
                    <ProtectedRoute>
                      <MovieDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/show/:id" 
                  element={
                    <ProtectedRoute>
                      <ShowDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout/:id" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Routes (Protected, Admin Only) */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout>
                        <Routes>
                          <Route path="library" element={<ManageMovies />} />
                          <Route path="studios" element={<ManageStudios />} />
                          <Route path="schedules" element={<ManageShows />} />
                          <Route path="reports" element={<SalesReports />} />
                          <Route path="*" element={<SalesReports />} />
                        </Routes>
                      </AdminLayout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}