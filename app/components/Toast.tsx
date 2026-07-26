'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Info, AlertCircle, X, Trash2, FolderPlus, PlusCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error' | 'warning';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    icon?: React.ReactNode;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        
        // Pick custom icon based on keywords if needed, or by type
        let icon: React.ReactNode = <Info size={16} className="text-blue-400" />;
        if (type === 'success') {
            if (message.toLowerCase().includes('category')) {
                icon = <FolderPlus size={16} className="text-emerald-400" />;
            } else if (message.toLowerCase().includes('channel') || message.toLowerCase().includes('added')) {
                icon = <PlusCircle size={16} className="text-emerald-400" />;
            } else {
                icon = <CheckCircle2 size={16} className="text-emerald-400" />;
            }
        } else if (type === 'info') {
            if (message.toLowerCase().includes('removed') || message.toLowerCase().includes('deleted')) {
                icon = <Trash2 size={16} className="text-rose-400" />;
            } else {
                icon = <Info size={16} className="text-indigo-400" />;
            }
        } else if (type === 'error') {
            icon = <AlertCircle size={16} className="text-rose-400" />;
        }

        setToasts((prev) => [...prev.slice(-4), { id, message, type, icon }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
                            toast.type === 'success'
                                ? 'bg-neutral-900/90 text-white border-emerald-500/30 shadow-emerald-950/20 dark:bg-neutral-900/95 dark:border-emerald-500/40'
                                : toast.type === 'error'
                                ? 'bg-neutral-900/90 text-white border-rose-500/30 shadow-rose-950/20 dark:bg-neutral-900/95 dark:border-rose-500/40'
                                : 'bg-neutral-900/90 text-white border-indigo-500/30 shadow-indigo-950/20 dark:bg-neutral-900/95 dark:border-neutral-800'
                        }`}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="flex-shrink-0">{toast.icon}</span>
                            <p className="text-xs font-medium text-neutral-200 truncate">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors flex-shrink-0"
                            aria-label="Close notification"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
