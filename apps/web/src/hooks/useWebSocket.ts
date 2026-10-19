import { useEffect, useRef, useState, useCallback } from "react";
import { getWebSocketUrl } from "../lib/api";
import {
  MessageTypes,
  isTerminalCloseCode,
  type NetworkMessage,
} from "@defense/shared";

export interface TerminalClose {
  code: number;
  reason: string;
}

interface UseWebSocketOptions {
  roomCode: string;
  /**
   * Query params for the connection. Called on EVERY (re)connect attempt, so
   * reconnects always carry the latest identity (e.g. a playerId/token that
   * was assigned after the first connect). Return null to not connect.
   */
  getParams: () => Record<string, string> | null;
  onMessage: (message: NetworkMessage) => void;
  /** The server closed us with a terminal code; auto-reconnect is stopped. */
  onTerminalClose?: (close: TerminalClose) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: Omit<NetworkMessage, "senderId">) => boolean;
  connect: () => void;
  disconnect: () => void;
}

const HEARTBEAT_INTERVAL_MS = 15_000;
// How long to wait for any inbound message after a PING before declaring the
// socket dead (iOS keeps "OPEN" zombie sockets around after sleep).
const PONG_TIMEOUT_MS = 5_000;
const WAKE_PONG_TIMEOUT_MS = 3_000;
// A handshake that hangs this long (common right after phone wake) is retried.
const CONNECT_TIMEOUT_MS = 8_000;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 5_000;

export function useWebSocket({
  roomCode,
  getParams,
  onMessage,
  onTerminalClose,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const onMessageRef = useRef(onMessage);
  const getParamsRef = useRef(getParams);
  const onTerminalCloseRef = useRef(onTerminalClose);
  onMessageRef.current = onMessage;
  getParamsRef.current = getParams;
  onTerminalCloseRef.current = onTerminalClose;

  const stoppedRef = useRef(false);
  const attemptRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const pongTimerRef = useRef<number | null>(null);

  const clearTimer = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current !== null) {
      clearTimeout(ref.current);
      clearInterval(ref.current);
      ref.current = null;
    }
  };

  const clearAllTimers = useCallback(() => {
    clearTimer(retryTimerRef);
    clearTimer(connectTimerRef);
    clearTimer(heartbeatTimerRef);
    clearTimer(pongTimerRef);
  }, []);

  // Forward-declared so handlers can reference each other.
  const connectRef = useRef<() => void>(() => {});

  /** Drop the current socket (without triggering its onclose logic) and dial again. */
  const forceReconnect = useCallback(() => {
    const old = wsRef.current;
    wsRef.current = null;
    clearAllTimers();
    setIsConnected(false);
    if (old) {
      try {
        old.close();
      } catch {
        // ignore
      }
    }
    if (!stoppedRef.current) connectRef.current();
  }, [clearAllTimers]);

  const scheduleReconnect = useCallback(() => {
    if (stoppedRef.current) return;
    clearTimer(retryTimerRef);
    const delay =
      Math.min(BACKOFF_BASE_MS * 2 ** attemptRef.current, BACKOFF_MAX_MS) +
      Math.floor(Math.random() * 250);
    attemptRef.current += 1;
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      connectRef.current();
    }, delay);
  }, []);

  /** Send a PING; if nothing comes back in time, the socket is a zombie. */
  const probe = useCallback(
    (timeoutMs: number) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      try {
        ws.send(JSON.stringify({ type: MessageTypes.PING, payload: {} }));
      } catch {
        forceReconnect();
        return;
      }
      if (pongTimerRef.current !== null) return;
      pongTimerRef.current = window.setTimeout(() => {
        pongTimerRef.current = null;
        if (wsRef.current === ws) {
          console.warn("WebSocket heartbeat timed out, reconnecting");
          forceReconnect();
        }
      }, timeoutMs);
    },
    [forceReconnect],
  );

  const connect = useCallback(() => {
    if (stoppedRef.current) return;
    const current = wsRef.current;
    if (
      current &&
      (current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const params = getParamsRef.current();
    if (!params) return;

    clearTimer(retryTimerRef);
    const url = getWebSocketUrl(roomCode, params);
    console.log("Connecting to WebSocket", url.split("?")[0]);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    clearTimer(connectTimerRef);
    connectTimerRef.current = window.setTimeout(() => {
      connectTimerRef.current = null;
      if (wsRef.current === ws && ws.readyState === WebSocket.CONNECTING) {
        console.warn("WebSocket connect timed out, retrying");
        forceReconnect();
      }
    }, CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      if (wsRef.current !== ws) return;
      clearTimer(connectTimerRef);
      attemptRef.current = 0;
      setIsConnected(true);
      console.log("WebSocket connected");
      clearTimer(heartbeatTimerRef);
      heartbeatTimerRef.current = window.setInterval(
        () => probe(PONG_TIMEOUT_MS),
        HEARTBEAT_INTERVAL_MS,
      );
    };

    ws.onclose = (event) => {
      // A socket we already replaced (forceReconnect / superseded) is ignored.
      if (wsRef.current !== ws) return;
      wsRef.current = null;
      clearAllTimers();
      setIsConnected(false);
      console.log("WebSocket disconnected", event.code, event.reason);

      if (isTerminalCloseCode(event.code)) {
        stoppedRef.current = true;
        onTerminalCloseRef.current?.({ code: event.code, reason: event.reason });
        return;
      }
      scheduleReconnect();
    };

    ws.onerror = () => {
      console.error("WebSocket error");
    };

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;
      // Any inbound traffic proves the socket is alive.
      clearTimer(pongTimerRef);
      let message: NetworkMessage;
      try {
        message = JSON.parse(event.data) as NetworkMessage;
      } catch (err) {
        console.error("Failed to parse message:", err);
        return;
      }
      if (message.type === MessageTypes.PONG) return;
      onMessageRef.current(message);
    };
  }, [roomCode, probe, forceReconnect, scheduleReconnect, clearAllTimers]);
  connectRef.current = connect;

  const disconnect = useCallback(() => {
    console.log("Disconnecting WebSocket");
    stoppedRef.current = true;
    clearAllTimers();
    const ws = wsRef.current;
    wsRef.current = null;
    setIsConnected(false);
    ws?.close();
  }, [clearAllTimers]);

  const reconnect = useCallback(() => {
    stoppedRef.current = false;
    attemptRef.current = 0;
    connectRef.current();
  }, []);

  const sendMessage = useCallback(
    (message: Omit<NetworkMessage, "senderId">) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        return true;
      }
      console.warn("WebSocket not connected, cannot send message");
      return false;
    },
    [],
  );

  // Phone wake / tab refocus / network back / bfcache restore: reconnect right
  // away instead of waiting out the backoff, and probe "open" sockets because
  // they are frequently dead after sleep.
  useEffect(() => {
    const onWake = () => {
      if (document.visibilityState === "hidden") return;
      if (stoppedRef.current) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        attemptRef.current = 0;
        clearTimer(retryTimerRef);
        wsRef.current = null;
        connectRef.current();
      } else if (ws.readyState === WebSocket.OPEN) {
        probe(WAKE_PONG_TIMEOUT_MS);
      }
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("pageshow", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("pageshow", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [probe]);

  // Auto-connect on mount; tear down on unmount / room change.
  useEffect(() => {
    stoppedRef.current = false;
    attemptRef.current = 0;
    connectRef.current();
    return disconnect;
  }, [roomCode, disconnect]);

  return {
    isConnected,
    sendMessage,
    connect: reconnect,
    disconnect,
  };
}
