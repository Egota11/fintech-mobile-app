import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme, { createAppTheme } from './theme';

// Sayfa bileşenleri
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import TaxPlanning from './pages/TaxPlanning';
import CashFlow from './pages/CashFlow';
import FinancialAdvice from './pages/FinancialAdvice';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';

// Layout bileşeni
import MainLayout from './components/common/MainLayout';

// ChatBot bileşeni
import ChatBot from './components/ChatBot';

// Auth durumu için basit bir kontrol (gerçek uygulamada JWT kontrolü yapılacak)
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Test amaçlı kullanıcı oturumu açma (gerçek uygulamada kaldırılacak)
if (!isAuthenticated()) {
  localStorage.setItem('token', 'test-token');
}

// Korumalı rota bileşeni
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const [showChatBot, setShowChatBot] = useState(true);
  const [generalSettings, setGeneralSettings] = useState({
    currencySymbol: '₺',
    language: 'tr',
    dateFormat: 'DD.MM.YYYY',
    theme: 'light',
    enableNotifications: true,
    showChatBot: true
  });
  
  useEffect(() => {
    // ChatBot görünürlük ayarını ve diğer genel ayarları kontrol et
    const generalSettingsData = localStorage.getItem('generalSettings');
    if (generalSettingsData) {
      const parsedSettings = JSON.parse(generalSettingsData);
      setShowChatBot(parsedSettings.showChatBot !== false);
      setGeneralSettings(parsedSettings);
      
      // Tema değişikliğini uygula
      if (parsedSettings.theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      
      // Para birimi ve diğer ayarları global değişkenlere ata
      window.appSettings = {
        ...parsedSettings,
        currency: parsedSettings.currencySymbol || '₺',
        language: parsedSettings.language || 'tr'
      };
    }
  }, []);
  
  // Tema oluştur
  const currentTheme = createAppTheme(generalSettings.theme);
  
  // Mobil önizleme sayfasına git
  const openMobilePreview = () => {
    window.open('/mobile-preview.html', '_blank');
  };
  
  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout 
              generalSettings={generalSettings} 
              showMobilePreview={true}
              onOpenMobilePreview={openMobilePreview}
            />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard generalSettings={generalSettings} />} />
          <Route path="expenses" element={<Expenses generalSettings={generalSettings} />} />
          <Route path="income" element={<Income generalSettings={generalSettings} />} />
          <Route path="tax-planning" element={<TaxPlanning generalSettings={generalSettings} />} />
          <Route path="cash-flow" element={<CashFlow generalSettings={generalSettings} />} />
          <Route path="financial-advice" element={<FinancialAdvice generalSettings={generalSettings} />} />
          <Route path="admin-panel" element={<AdminPanel generalSettings={generalSettings} />} />
        </Route>
      </Routes>
      
      {/* ChatBot tüm sayfalarda görünür */}
      {isAuthenticated() && showChatBot && <ChatBot />}
    </ThemeProvider>
  );
}

export default App; 