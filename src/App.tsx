import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Users from './pages/Users';
import Projects from './pages/Projects';

export default function App() {
  const { user, setUser, setUserRole, setLoading, loading } = useAuthStore();

  useEffect(() => {
    // DEV BYPASS: Automatically log in as an Admin for development
    setUser({ uid: 'dev-admin', email: 'dev@example.com', displayName: 'Dev Admin' } as any);
    setUserRole('Admin');
    setLoading(false);
  }, [setUser, setUserRole, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F3F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="users" element={<Users />} />
          <Route path="projects" element={<Projects />} />
          {/* Add other routes here as we build them */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
