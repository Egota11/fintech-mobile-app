import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Dil dosyalarını yükle
const loadLanguageSettings = () => {
  // localStorage'dan ayarları al
  const generalSettings = localStorage.getItem('generalSettings');
  
  if (generalSettings) {
    const parsedSettings = JSON.parse(generalSettings);
    // Dil ayarını HTML lang özelliğine ata
    document.documentElement.lang = parsedSettings.language || 'tr';
    
    // Tema sınıfını ata (karanlık tema için)
    if (parsedSettings.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
};

// Sayfa yüklendiğinde dil ayarlarını uygula
loadLanguageSettings();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 