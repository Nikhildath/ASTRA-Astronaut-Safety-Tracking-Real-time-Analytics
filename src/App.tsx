import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'

import { Home } from './pages/Home'
import { StressRelief } from './pages/StressRelief'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        <Route index element={<Home />} />
        <Route path="/stress-relief" element={<StressRelief />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
