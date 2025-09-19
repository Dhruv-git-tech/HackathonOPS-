import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import TeamManagement from './components/TeamManagement';
import DataImport from './components/DataImport';
import CertificateGeneration from './components/CertificateGeneration';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            {user.role === 'admin' && (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/teams" element={<TeamManagement />} />
                <Route path="/import" element={<DataImport />} />
                <Route path="/certificates" element={<CertificateGeneration />} />
              </>
            )}
            {user.role === 'judge' && (
              <>
                <Route path="/" element={<JudgeDashboard />} />
                <Route path="/dashboard" element={<JudgeDashboard />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;