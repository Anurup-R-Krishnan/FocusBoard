import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const IS_DEV = Boolean((import.meta as any).env?.DEV);
const logDebug = (...args: any[]) => {
    if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
};

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                autoConnect: true,
            });

            this.socket.on('connect', () => {
                logDebug('🔗 Connected to real-time server:', this.socket?.id);
            });

            this.socket.on('disconnect', () => {
                logDebug('🔗 Disconnected from real-time server');
            });

            // Generic listener to push updates to interested components
            this.socket.on('data_updated', (payload) => {
                const { type, data } = payload;
                if (this.listeners.has(type)) {
                    this.listeners.get(type)?.forEach(callback => callback(data));
                }
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribe(type: string, callback: Function) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)?.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(type)?.delete(callback);
        };
    }
}

export const socketService = new SocketService();
