import { create } from 'zustand';

export interface ToastItem {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastStore {
    toasts: ToastItem[];
    show: (type: ToastItem['type'], message: string) => void;
    dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    show: (type, message) => {
        const id = `toast-${++counter}`;
        set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 4000);
    },
    dismiss: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
}));
