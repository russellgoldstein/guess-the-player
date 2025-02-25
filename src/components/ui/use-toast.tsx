'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';

interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    toast: (toast: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Maximum number of toasts to show at once
const MAX_TOASTS = 3;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = ({ title, description, variant = 'default', duration = 3000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);

        // Check if a similar toast already exists (same title and description)
        const hasSimilarToast = toasts.some(
            t => t.title === title && t.description === description
        );

        if (hasSimilarToast) {
            return;
        }

        setToasts(prev => {
            // If we already have the maximum number of toasts, remove the oldest one
            if (prev.length >= MAX_TOASTS) {
                return [...prev.slice(1), { id, title, description, variant, duration }];
            }
            return [...prev, { id, title, description, variant, duration }];
        });
    };

    const dismiss = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastContainer = () => {
    const { toasts, dismiss } = useToast();

    return (
        <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.duration, onDismiss]);

    return (
        <div
            className={`p-4 rounded-md shadow-md flex items-start justify-between transform transition-all duration-300 ease-in-out translate-y-0 opacity-100 ${toast.variant === 'destructive' ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
                }`}
            role="alert"
        >
            <div className="flex-1">
                <h3 className={`font-medium ${toast.variant === 'destructive' ? 'text-red-800' : 'text-gray-900'}`}>
                    {toast.title}
                </h3>
                {toast.description && (
                    <p className={`text-sm mt-1 ${toast.variant === 'destructive' ? 'text-red-700' : 'text-gray-500'}`}>
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                onClick={onDismiss}
                className={`ml-4 p-1 rounded-full ${toast.variant === 'destructive'
                    ? 'text-red-500 hover:bg-red-100'
                    : 'text-gray-400 hover:bg-gray-100'
                    }`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}; 