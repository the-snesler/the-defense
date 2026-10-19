import type { ServerWebSocket } from 'bun';
import {
  type WebSocketData,
  type ConnectionRejection,
  getRoom,
  getHostSocket,
  getAllPlayerSockets,
  getPlayerSocket,
  setHostSocket,
  clearHostSocket,
  setPlayerSocket,
  clearPlayerSocket,
  getPlayer,
  addPlayer,
  reconnectPlayer,
  removePlayer,
  touchRoom,
} from './rooms';
import {
  CloseCodes,
  MessageTypes,
  PLAYER_NAME_MAX_LENGTH,
  SERVER_TARGET,
  isValidClientId,
  type KickPlayerPayload,
  type NetworkMessage,
} from '@defense/shared';

function send(ws: ServerWebSocket<WebSocketData>, message: NetworkMessage): void {
  ws.send(JSON.stringify(message));
}

function reject(
  ws: ServerWebSocket<WebSocketData>,
  rejection: ConnectionRejection,
): void {
  send(ws, {
    type: MessageTypes.ERROR,
    payload: { code: rejection.errorCode, message: rejection.message },
    senderId: SERVER_TARGET,
  });
  ws.close(rejection.closeCode, rejection.errorCode);
}

export function handleOpen(ws: ServerWebSocket<WebSocketData>): void {
  const { roomCode, role, playerId, rejection } = ws.data;

  if (rejection) {
    reject(ws, rejection);
    return;
  }

  const room = getRoom(roomCode);
  if (!room) {
    reject(ws, {
      closeCode: CloseCodes.ROOM_NOT_FOUND,
      errorCode: 'ROOM_NOT_FOUND',
      message: 'Room does not exist',
    });
    return;
  }
  touchRoom(roomCode);

  if (role === 'host') {
    const previous = setHostSocket(roomCode, ws);
    if (previous) {
      // A newer host connection wins; the stale one must not reconnect.
      previous.close(CloseCodes.SUPERSEDED, 'SUPERSEDED');
    }
    console.log(`Host connected to room ${roomCode}`);
    send(ws, {
      type: MessageTypes.HOST_CONNECTED,
      payload: {
        players: Array.from(room.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          isConnected: p.socket !== null,
        })),
      },
      senderId: SERVER_TARGET,
    });
    return;
  }

  if (role === 'player' && playerId) {
    const player = getPlayer(roomCode, playerId);
    if (!player) {
      reject(ws, {
        closeCode: CloseCodes.INVALID_IDENTITY,
        errorCode: 'INVALID_IDENTITY',
        message: 'Unknown player',
      });
      return;
    }

    const previous = setPlayerSocket(roomCode, playerId, ws);
    if (previous) {
      // The old socket (zombie connection from before a phone slept, or an
      // older tab) is replaced. clearPlayerSocket ignores it on close, so the
      // host is NOT told this player disconnected.
      console.log(`Player ${player.name} (${playerId}) superseded an older socket`);
      previous.close(CloseCodes.SUPERSEDED, 'SUPERSEDED');
    }
    const isReconnect = ws.data.isReconnect ?? false;
    console.log(
      `Player ${player.name} (${playerId}) ${isReconnect ? 'reconnected' : 'joined'} room ${roomCode}`,
    );

    // Confirm identity to the player first so it is persisted before any
    // state arrives.
    send(ws, {
      type: MessageTypes.ROOM_JOINED,
      payload: {
        playerId: player.id,
        reconnectToken: player.reconnectToken,
        isReconnect,
      },
      senderId: SERVER_TARGET,
    });

    // Notify host; it will (re)send this player's view.
    const hostSocket = getHostSocket(roomCode);
    if (hostSocket) {
      send(hostSocket, {
        type: MessageTypes.PLAYER_CONNECTED,
        payload: { playerId, playerName: player.name, isReconnect },
        senderId: playerId,
      });
    }
  }
}

function handleServerMessage(
  ws: ServerWebSocket<WebSocketData>,
  parsed: NetworkMessage,
): void {
  const { roomCode, role } = ws.data;
  if (role !== 'host') return;

  if (parsed.type === MessageTypes.KICK_PLAYER) {
    const payload = parsed.payload as Partial<KickPlayerPayload> | undefined;
    if (!payload?.playerId) return;
    const player = getPlayer(roomCode, payload.playerId);
    if (!player) return;
    const socket = player.socket;
    removePlayer(roomCode, payload.playerId);
    console.log(`Host kicked ${player.name} (${player.id}) from ${roomCode}: ${payload.code}`);
    if (socket) {
      reject(socket, {
        closeCode: CloseCodes.KICKED,
        errorCode: payload.code ?? 'KICKED',
        message: payload.message ?? 'Removed from the room',
      });
    }
  }
}

export function handleMessage(
  ws: ServerWebSocket<WebSocketData>,
  message: string | Buffer
): void {
  const { roomCode, role, playerId, rejection } = ws.data;
  if (rejection) return;

  let parsed: NetworkMessage;
  try {
    const text = typeof message === 'string' ? message : message.toString();
    parsed = JSON.parse(text);
  } catch {
    send(ws, {
      type: MessageTypes.ERROR,
      payload: { code: 'INVALID_JSON', message: 'Failed to parse message' },
      senderId: SERVER_TARGET,
    });
    return;
  }

  // Ignore traffic from sockets that have been superseded by a newer one for
  // the same identity (they are being closed).
  if (role === 'host' && getHostSocket(roomCode) !== ws) return;
  if (role === 'player' && (!playerId || getPlayerSocket(roomCode, playerId) !== ws)) {
    return;
  }

  touchRoom(roomCode);

  const { type, payload, target } = parsed;

  // Keep-alive: answered by the relay, never forwarded.
  if (type === MessageTypes.PING) {
    send(ws, { type: MessageTypes.PONG, payload: {}, senderId: SERVER_TARGET });
    return;
  }

  if (target === SERVER_TARGET) {
    handleServerMessage(ws, parsed);
    return;
  }

  // Determine sender ID
  const senderId = role === 'host' ? 'HOST' : playerId;

  // Create the message to forward (with senderId injected)
  const forwardMessage = JSON.stringify({
    type,
    payload,
    senderId,
  });

  // Players may only talk to the host. Otherwise any player could spoof
  // SYNC_STATE etc. to other players.
  if (role === 'player') {
    if (target === 'HOST') {
      getHostSocket(roomCode)?.send(forwardMessage);
    }
    return;
  }

  // Route based on target
  if (target === 'HOST') {
    // Host talking to itself: nothing to do.
  } else if (target === 'ALL') {
    for (const socket of getAllPlayerSockets(roomCode)) {
      socket.send(forwardMessage);
    }
  } else if (target) {
    getPlayerSocket(roomCode, target)?.send(forwardMessage);
  }
}

export function handleClose(ws: ServerWebSocket<WebSocketData>): void {
  const { roomCode, role, playerId, rejection } = ws.data;
  if (rejection) return;
  const room = getRoom(roomCode);

  if (!room) return;

  if (role === 'host') {
    // Keep room alive for host reconnection. Only clear if this is still the
    // current host socket (a superseded one closing must not detach the new).
    if (clearHostSocket(roomCode, ws)) {
      console.log(`Host disconnected from room ${roomCode}`);
    }
  } else if (role === 'player' && playerId) {
    const player = getPlayer(roomCode, playerId);
    if (player && clearPlayerSocket(roomCode, playerId, ws)) {
      console.log(`Player ${player.name} (${playerId}) disconnected from room ${roomCode}`);

      const hostSocket = getHostSocket(roomCode);
      if (hostSocket) {
        send(hostSocket, {
          type: MessageTypes.PLAYER_DISCONNECTED,
          payload: { playerId },
          senderId: playerId,
        });
      }
    }
  }
}

// === Upgrade-time resolution ===

export type PlayerConnectionResult =
  | { ok: true; playerId: string; isReconnect: boolean }
  | { ok: false; rejection: ConnectionRejection }
  // Transient: client should retry (e.g. host briefly offline).
  | { ok: false; status: number; error: string };

function normalizeName(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim().slice(0, PLAYER_NAME_MAX_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Decide who a player connection is.
 *
 * - playerId + token of a known player  -> resume as that player (any time).
 * - playerId + token unknown, with name -> idempotent join using the
 *   client-generated identity (so a retry after a dropped ROOM_JOINED resumes
 *   instead of duplicating).
 * - playerId known but wrong token      -> INVALID_IDENTITY (terminal).
 * - name only (legacy clients)          -> join with server-generated identity.
 */
export function resolvePlayerConnection(
  roomCode: string,
  params: { playerId: string | null; token: string | null; name: string | null },
): PlayerConnectionResult {
  const room = getRoom(roomCode);
  if (!room) {
    return {
      ok: false,
      rejection: {
        closeCode: CloseCodes.ROOM_NOT_FOUND,
        errorCode: 'ROOM_NOT_FOUND',
        message: 'Room does not exist',
      },
    };
  }

  const name = normalizeName(params.name);
  const { playerId, token } = params;

  if (playerId || token) {
    if (!playerId || !token) {
      return {
        ok: false,
        rejection: {
          closeCode: CloseCodes.INVALID_IDENTITY,
          errorCode: 'INVALID_IDENTITY',
          message: 'Both playerId and token are required to rejoin',
        },
      };
    }

    if (room.players.has(playerId)) {
      if (!reconnectPlayer(roomCode, playerId, token)) {
        return {
          ok: false,
          rejection: {
            closeCode: CloseCodes.INVALID_IDENTITY,
            errorCode: 'INVALID_IDENTITY',
            message: 'Invalid reconnection token',
          },
        };
      }
      return { ok: true, playerId, isReconnect: true };
    }

    // Unknown id: treat as a (re)tried fresh join with a client identity.
    if (!name || !isValidClientId(playerId) || !isValidClientId(token)) {
      return {
        ok: false,
        rejection: {
          closeCode: CloseCodes.INVALID_IDENTITY,
          errorCode: 'INVALID_IDENTITY',
          message: 'Your session for this room is no longer valid',
        },
      };
    }
    if (!room.hostSocket) {
      return { ok: false, status: 503, error: 'Host not connected' };
    }
    const added = addPlayer(roomCode, name, { playerId, reconnectToken: token });
    if (!added) return { ok: false, status: 500, error: 'Failed to add player' };
    return { ok: true, playerId: added.playerId, isReconnect: false };
  }

  if (!name) {
    return { ok: false, status: 400, error: 'Invalid connection parameters' };
  }
  if (!room.hostSocket) {
    return { ok: false, status: 503, error: 'Host not connected' };
  }
  const added = addPlayer(roomCode, name);
  if (!added) return { ok: false, status: 500, error: 'Failed to add player' };
  return { ok: true, playerId: added.playerId, isReconnect: false };
}
