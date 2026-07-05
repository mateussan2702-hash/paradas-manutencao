import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import DetalheParada from './pages/DetalheParada'
import CurvaS from './pages/CurvaS'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/parada/:id" element={<DetalheParada />} />
        <Route path="/curva" element={<CurvaS />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
