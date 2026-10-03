import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live/';

  const connect = useCallback(() => {
    try {
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[SKYVENT Realtime] Connected to WebSocket stream');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventType, data } = message;

          // Dispatch to registered listener callbacks
          if (eventType && listenersRef.current.has(eventType)) {
            listenersRef.current.get(eventType).forEach((cb) => cb(data));
          }

          // Global real-time toast feedback
          if (eventType === 'attendance_updated' && data) {
            toast.info(`Check-in: ${data.attendee_name} entered '${data.event_title}'`);
          } else if (eventType === 'ticket_purchased' && data) {
            toast.success(`New Ticket: Pass #${data.ticket_number} reserved!`);
          } else if (eventType === 'inventory_updated' && data) {
            if (data.stock_quantity <= 5) {
              toast.warning(`Low Stock: ${data.product_name || 'Item'} (${data.stock_quantity} left)`);
            }
          }
        } catch (e) {
          console.error('[SKYVENT Realtime] Parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[SKYVENT Realtime] Disconnected. Reconnecting in 4s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };

      ws.onerror = (err) => {
        console.warn('[SKYVENT Realtime] WebSocket connection issue (will retry):', err);
        ws.close();
      };
    } catch (e) {
      console.warn('[SKYVENT Realtime] Could not initiate WebSocket:', e);
    }
  }, [WS_URL]);

  useEffect(() => {
    connect();

    // Heartbeat ping every 25s
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);

    return () => {
      if (listenersRef.current.has(eventType)) {
        listenersRef.current.get(eventType).delete(callback);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
