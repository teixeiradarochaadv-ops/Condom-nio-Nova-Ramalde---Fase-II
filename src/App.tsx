import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Chat from './components/Chat';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('adminToken', 'fake-admin-token');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminToken');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route 
            path="/admin" 
            element={
              isAdmin ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <AdminLogin onLogin={handleLogin} />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
