"use client";

import { useState, useEffect } from 'react';
import { socketClientService } from '@/services/socket.client';
import { useAuth } from '@/contexts/AuthContext';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export function useSocket() {
  const { token, isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketClientService.disconnect();
      setConnectionState('disconnected');
      return;
    }

    const socket = socketClientService.connect(token);
    if (!socket) {
      setConnectionState('connected');
      return;
    }

    const onConnect = () => {
      setConnectionState('connected');
    };

    const onDisconnect = () => {
      setConnectionState('disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionState('reconnecting');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    // Track latency
    const interval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping', () => {
          setLatency(Date.now() - start);
        });
      }
    }, 10000);

    // Check initial status
    if (socket.connected) {
      setConnectionState('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      clearInterval(interval);
    };
  }, [token, isAuthenticated]);

  return { connectionState, latency, socket: socketClientService.getSocket() };
}
