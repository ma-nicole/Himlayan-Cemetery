import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  // Return null if not in provider (allows optional usage)
  return context;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 4000,
      action: options.action,
      actionLabel: options.actionLabel,
    };

    setToasts(prev => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, options) => 
    addToast(message, { ...options, type: 'success' }), [addToast]);
  
  const error = useCallback((message, options) => 
    addToast(message, { ...options, type: 'error' }), [addToast]);
  
  const warning = useCallback((message, options) => 
    addToast(message, { ...options, type: 'warning' }), [addToast]);
  
  const info = useCallback((message, options) => 
    addToast(message, { ...options, type: 'info' }), [addToast]);

  const value = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <div className="toast-icon">{icons[toast.type]}</div>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
        {toast.action && (
          <button className="toast-action" onClick={toast.action}>
            {toast.actionLabel || 'Undo'}
          </button>
        )}
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className="toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
    </div>
  );
};

export default ToastContext;
