import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: 'border-[#0F8564] text-[#0F8564]',
  error: 'border-[#D13438] text-[#D13438]',
  info: 'border-[#E1DFDD] text-[#323130]',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // `action`/`durationMs` are optional — plain showToast(message, variant)
  // calls (the vast majority) behave exactly as before, 4s auto-dismiss with
  // no button. Undo-style toasts pass { action: { label, onClick }, durationMs }.
  const showToast = useCallback((message, variant = 'info', options = {}) => {
    const { action, durationMs = 4000 } = options;
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map(({ id, message, variant, action }) => {
          const Icon = ICONS[variant] ?? Info;
          return (
            <div
              key={id}
              className={cn(
                'flex items-center gap-2 rounded-md border bg-white px-4 py-2.5 text-sm shadow-md',
                COLORS[variant]
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
              {message}
              {action && (
                <button
                  onClick={() => {
                    action.onClick();
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                  }}
                  className="ml-2 flex-shrink-0 font-semibold underline hover:no-underline"
                >
                  {action.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
