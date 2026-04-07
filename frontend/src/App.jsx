import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./components/Navbar";
import "./App.css";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <>
      <Navbar />
      <Dashboard />
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/profile/:username" element={<ProfilePage />} />
      <Route path="/" element={<ProtectedLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
