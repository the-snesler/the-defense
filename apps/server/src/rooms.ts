import type { ServerWebSocket } from 'bun';
import { generateRoomCode, generateToken, generatePlayerId } from './utils';

export interface PlayerConnection {
  id: string;
  name: string;
  socket: ServerWebSocket<WebSocketData> | null;
  reconnectToken: string;
  disconnectedAt: number | null;
}

export interface Room {
  code: string;
  hostToken: string;
  hostSocket: ServerWebSocket<WebSocketData> | null;
  players: Map<string, PlayerConnection>;
  createdAt: number;
  lastActivityAt: number;
}

export interface ConnectionRejection {
  closeCode: number;
  errorCode: string;
  message: string;
}

export interface WebSocketData {
  roomCode: string;
  role: 'host' | 'player';
  playerId?: string;
  // True when this socket resumes a playerId the room already knew.
  isReconnect?: boolean;
  // Set when the connection is upgraded only so we can tell the client *why*
  // it was refused (browsers can't read HTTP status of a failed WS upgrade).
  // handleOpen sends an ERROR and closes with `closeCode`.
  rejection?: ConnectionRejection;
}

// In-memory room storage
const rooms = new Map<string, Room>();

// Room expiry: no host and no players connected for this long.
const ROOM_EXPIRY_MS = 60 * 60 * 1000;

export function createRoom(): { roomCode: string; hostToken: string } {
  let roomCode = generateRoomCode();

  // Ensure unique room code
  while (rooms.has(roomCode)) {
    roomCode = generateRoomCode();
  }

  const hostToken = generateToken();

  const now = Date.now();
  const room: Room = {
    code: roomCode,
    hostToken,
    hostSocket: null,
    players: new Map(),
    createdAt: now,
    lastActivityAt: now,
  };

  rooms.set(roomCode, room);

  return { roomCode, hostToken };
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode.toUpperCase());
}

export function deleteRoom(roomCode: string): void {
  rooms.delete(roomCode.toUpperCase());
}

export function touchRoom(roomCode: string): void {
  const room = getRoom(roomCode);
  if (room) room.lastActivityAt = Date.now();
}

export function validateHostToken(roomCode: string, token: string): boolean {
  const room = getRoom(roomCode);
  return room?.hostToken === token;
}

/**
 * Add a player. `playerId`/`reconnectToken` may be supplied by the client
 * (validated by the caller) so retries of the same join are idempotent.
 */
export function addPlayer(
  roomCode: string,
  name: string,
  identity?: { playerId: string; reconnectToken: string },
): { playerId: string; reconnectToken: string } | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const playerId = identity?.playerId ?? generatePlayerId();
  const reconnectToken = identity?.reconnectToken ?? generateToken();
  if (room.players.has(playerId)) return null;

  const player: PlayerConnection = {
    id: playerId,
    name,
    socket: null,
    reconnectToken,
    disconnectedAt: null,
  };

  room.players.set(playerId, player);

  return { playerId, reconnectToken };
}

/**
 * A returning player proves identity with their reconnect token. There is no
 * time window: phones can sleep for minutes mid-game, and the token (not the
 * clock) is what proves the client may resume as this player. Players are only
 * forgotten when the host kicks them or the room expires.
 */
export function reconnectPlayer(
  roomCode: string,
  playerId: string,
  token: string
): boolean {
  const room = getRoom(roomCode);
  if (!room) return false;

  const player = room.players.get(playerId);
  if (!player) return false;

  return player.reconnectToken === token;
}

export function getPlayer(roomCode: string, playerId: string): PlayerConnection | undefined {
  const room = getRoom(roomCode);
  return room?.players.get(playerId);
}

export function removePlayer(roomCode: string, playerId: string): void {
  const room = getRoom(roomCode);
  if (room) {
    room.players.delete(playerId);
  }
}

/**
 * Make `socket` the room's host socket. Returns the previous socket if it is a
 * different one that's still attached (caller should close it).
 */
export function setHostSocket(
  roomCode: string,
  socket: ServerWebSocket<WebSocketData>
): ServerWebSocket<WebSocketData> | null {
  const room = getRoom(roomCode);
  if (!room) return null;
  const previous = room.hostSocket;
  room.hostSocket = socket;
  return previous && previous !== socket ? previous : null;
}

/** Clear the host socket only if `socket` is still the current one. */
export function clearHostSocket(
  roomCode: string,
  socket: ServerWebSocket<WebSocketData>
): boolean {
  const room = getRoom(roomCode);
  if (!room || room.hostSocket !== socket) return false;
  room.hostSocket = null;
  return true;
}

/**
 * Attach `socket` to a player. Returns the previous socket if it is a
 * different one that's still attached (e.g. the old connection of a phone that
 * woke up before the server noticed the drop). Caller should close it.
 */
export function setPlayerSocket(
  roomCode: string,
  playerId: string,
  socket: ServerWebSocket<WebSocketData>
): ServerWebSocket<WebSocketData> | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.get(playerId);
  if (!player) return null;
  const previous = player.socket;
  player.socket = socket;
  player.disconnectedAt = null;
  return previous && previous !== socket ? previous : null;
}

/**
 * Detach `socket` from the player only if it is still the player's current
 * socket. A stale socket closing after a newer one connected must not mark
 * the player disconnected.
 */
export function clearPlayerSocket(
  roomCode: string,
  playerId: string,
  socket: ServerWebSocket<WebSocketData>
): boolean {
  const player = getPlayer(roomCode, playerId);
  if (!player || player.socket !== socket) return false;
  player.socket = null;
  player.disconnectedAt = Date.now();
  return true;
}

export function getHostSocket(roomCode: string): ServerWebSocket<WebSocketData> | null {
  const room = getRoom(roomCode);
  return room?.hostSocket ?? null;
}

export function getAllPlayerSockets(
  roomCode: string
): ServerWebSocket<WebSocketData>[] {
  const room = getRoom(roomCode);
  if (!room) return [];

  const sockets: ServerWebSocket<WebSocketData>[] = [];
  for (const player of room.players.values()) {
    if (player.socket) {
      sockets.push(player.socket);
    }
  }
  return sockets;
}

export function getPlayerSocket(
  roomCode: string,
  playerId: string
): ServerWebSocket<WebSocketData> | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.get(playerId);
  return player?.socket ?? null;
}

// Cleanup expired rooms periodically
export function cleanupExpiredRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const anyPlayerConnected = Array.from(room.players.values()).some(
      (p) => p.socket !== null,
    );
    if (
      !room.hostSocket &&
      !anyPlayerConnected &&
      now - room.lastActivityAt > ROOM_EXPIRY_MS
    ) {
      rooms.delete(code);
    }
  }
}

// Start cleanup interval
setInterval(cleanupExpiredRooms, 60_000); // Run every minute
