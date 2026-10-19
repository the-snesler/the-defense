import {
  createRoom,
  getRoom,
  validateHostToken,
  type WebSocketData,
} from "./rooms";
import {
  handleOpen,
  handleMessage,
  handleClose,
  resolvePlayerConnection,
} from "./websocket";
import { CloseCodes } from "@defense/shared";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const STATIC_DIR = process.env.STATIC_DIR; // Path to built frontend (e.g., /app/public)

const server = Bun.serve<WebSocketData>({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/v1/rooms - Create a new room
    if (path === "/api/v1/rooms" && req.method === "POST") {
      const { roomCode, hostToken } = createRoom();
      return Response.json({ roomCode, hostToken }, { headers: corsHeaders });
    }

    // GET /api/v1/rooms/:code/ws - WebSocket upgrade
    // Query params: role=host|player, token, name, playerId
    const wsMatch = path.match(/^\/api\/v1\/rooms\/([A-Z0-9]{6})\/ws$/i);
    if (wsMatch && req.method === "GET") {
      console.log("WebSocket connection attempt", url.pathname);
      const roomCode = wsMatch[1].toUpperCase();

      const token = url.searchParams.get("token");
      const name = url.searchParams.get("name");
      const playerId = url.searchParams.get("playerId");
      // Explicit role; fall back to inference for older clients.
      const roleParam = url.searchParams.get("role");
      const role: "host" | "player" =
        roleParam === "host" || roleParam === "player"
          ? roleParam
          : token && !name && !playerId
            ? "host"
            : "player";

      const upgrade = (data: WebSocketData) => {
        if (server.upgrade(req, { data })) return undefined;
        return Response.json(
          { error: "WebSocket upgrade failed" },
          { status: 500, headers: corsHeaders },
        );
      };

      if (!getRoom(roomCode)) {
        // Upgrade anyway so the client gets a terminal close code instead of
        // retrying a failed handshake forever.
        return upgrade({
          roomCode,
          role,
          rejection: {
            closeCode: CloseCodes.ROOM_NOT_FOUND,
            errorCode: "ROOM_NOT_FOUND",
            message: "Room does not exist",
          },
        });
      }

      if (role === "host") {
        if (!token || !validateHostToken(roomCode, token)) {
          return Response.json(
            { error: "Invalid host token" },
            { status: 401, headers: corsHeaders },
          );
        }
        return upgrade({ roomCode, role: "host" });
      }

      const result = resolvePlayerConnection(roomCode, { playerId, token, name });
      if (result.ok) {
        return upgrade({
          roomCode,
          role: "player",
          playerId: result.playerId,
          isReconnect: result.isReconnect,
        });
      }
      if ("rejection" in result) {
        return upgrade({ roomCode, role: "player", rejection: result.rejection });
      }
      return Response.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders },
      );
    }

    // Health check
    if (path === "/health") {
      return Response.json({ status: "ok" }, { headers: corsHeaders });
    }

    // Serve static files if STATIC_DIR is configured (production mode)
    if (STATIC_DIR) {
      try {
        // Try to serve the requested file
        const filePath = path === "/" ? "/index.html" : path;
        const file = Bun.file(STATIC_DIR + filePath);

        if (await file.exists()) {
          return new Response(file);
        }

        // If file doesn't exist and it's not an API route, serve index.html (SPA fallback)
        if (!path.startsWith("/api/")) {
          const indexFile = Bun.file(STATIC_DIR + "/index.html");
          if (await indexFile.exists()) {
            return new Response(indexFile);
          }
        }
      } catch (error) {
        console.error("Error serving static file:", error);
      }
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders },
    );
  },

  websocket: {
    open(ws) {
      handleOpen(ws);
    },

    message(ws, message) {
      handleMessage(ws, message);
    },

    close(ws) {
      handleClose(ws);
    },
  },
});

console.log(`Server running on http://localhost:${server.port}`);
