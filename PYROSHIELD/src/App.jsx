import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Channels */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Civilian Portal Dashboard */}
        <Route path="/dashboard" element={<UserDashboard />} />

<Route path="/admin" element={<AdminDashboard />} />

        {/* Fallback Catch-All URL redirects to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
