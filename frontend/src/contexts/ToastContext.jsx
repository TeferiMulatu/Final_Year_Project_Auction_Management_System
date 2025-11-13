import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext()

let idCounter = 1

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = idCounter++
    setToasts((t) => [...t, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter(x => x.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter(x => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded-md shadow-md text-sm flex items-start space-x-3 ${
            t.type === 'success' ? 'bg-green-50 text-green-800' :
            t.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            <div className="flex-1">
              {t.message}
            </div>
            <button onClick={() => removeToast(t.id)} className="text-xs text-gray-500">Dismiss</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext
