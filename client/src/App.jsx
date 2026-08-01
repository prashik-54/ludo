import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Room from './pages/Room.jsx';
import { ToastProvider } from './components/Toast.jsx';
import AnimatedBackground from './components/AnimatedBackground.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AnimatedBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
