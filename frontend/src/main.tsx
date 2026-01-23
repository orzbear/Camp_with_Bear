import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Version identifier for deployment verification
console.log("🚀 Campmate Frontend V1.0.2 - Relative Path Version (/api)");
console.log("📍 API_BASE:", import.meta.env.VITE_API_BASE || '/api');
console.log("🌐 VITE_API_BASE env var:", import.meta.env.VITE_API_BASE);
console.log("🔧 Build time:", new Date().toISOString());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

