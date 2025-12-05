import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './contexts/ToastContext'
import socket from './services/socket'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Connect socket once for all visitors (authenticated or not) so public pages can receive broadcasts
try {
  socket.connect()
} catch (e) {
  // swallow connection errors here — components will also call connect when needed
  // eslint-disable-next-line no-console
  console.warn('Socket connect error:', e && e.message ? e.message : e)
}
