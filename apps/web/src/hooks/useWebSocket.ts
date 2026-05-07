import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl } from '../lib/api';
import type { NetworkMessage } from '@nofus/shared';

interface UseWebSocketOptions {
  roomCode: string;
  token?: string;
  playerName?: string;
  playerId?: string;
  onMessage: (message: NetworkMessage) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: Omit<NetworkMessage, "senderId">) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  roomCode,
  token,
  playerName,
  playerId,
  onMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Build query params
    const params: Record<string, string> = {};
    if (token) params.token = token;
    if (playerName) params.name = playerName;
    if (playerId) params.playerId = playerId;

    const url = getWebSocketUrl(roomCode, params);
    console.log("Connecting to WebSocket", url);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");

      // Attempt reconnection after 2 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 2000);
    };

    ws.onerror = () => {
      console.error("WebSocket error");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as NetworkMessage;
        console.log("Received message:", message);
        onMessageRef.current(message);
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    wsRef.current = ws;
  }, [roomCode, token, playerName, playerId]);

  const disconnect = useCallback(() => {
    console.log("Disconnecting WebSocket");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (message: Omit<NetworkMessage, "senderId">) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket not connected, cannot send message");
      }
    },
    []
  );

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return disconnect;
  }, []);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect,
  };
}
