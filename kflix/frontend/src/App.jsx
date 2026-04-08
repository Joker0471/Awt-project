import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar         from './components/Navbar';
import HomePage       from './pages/HomePage';
import MoviesPage     from './pages/MoviesPage';
import SeriesPage     from './pages/SeriesPage';
import LoginPage      from './pages/LoginPage';
import SignupPage     from './pages/SignupPage';
import AdminDashboard from './AdminDashboard.jsx';

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  return isLoggedIn ? <Navigate to="/" replace /> : children;
}

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/"      replace />;
  return children;
}

function Layout() {
  const location = useLocation();
  const hideNav = ['/login', '/signup', '/admin'].includes(location.pathname);
  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/"       element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/admin"  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}
