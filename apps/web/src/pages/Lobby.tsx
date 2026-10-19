import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createRoom } from "../lib/api";
import { ROOM_CODE_LENGTH } from "@defense/shared";

// Normalize a room code from user input or the `?code=` QR link.
// Server codes are ROOM_CODE_LENGTH chars of A-Z/2-9 (apps/server/src/utils.ts).
function normalizeRoomCode(raw: string | null): string {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ROOM_CODE_LENGTH);
}

export default function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nameInputRef = useRef<HTMLInputElement>(null);
  // inputs — pre-filled from `?code=` (host lobby QR) on first render
  const [roomCode, setRoomCode] = useState(() =>
    normalizeRoomCode(searchParams.get("code")),
  );
  const [playerName, setPlayerName] = useState("");
  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR scan → code is pre-filled; jump straight to the name field.
  useEffect(() => {
    const code = normalizeRoomCode(searchParams.get("code"));
    if (code.length === ROOM_CODE_LENGTH) {
      setRoomCode(code);
      nameInputRef.current?.focus();
    }
  }, [searchParams]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === ROOM_CODE_LENGTH && playerName.trim()) {
      sessionStorage.setItem(`player_name`, playerName);
      navigate(`/play/${roomCode.toUpperCase()}`);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const { roomCode, hostToken } = await createRoom();
      // Store host token for WebSocket auth
      sessionStorage.setItem(`host_token_${roomCode}`, hostToken);
      navigate(`/host/${roomCode}`);
    } catch (err) {
      setError("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="stage public-lobby">
      <div className="stage-vignette" />
      <main className="public-lobby-inner">
        <section className="public-lobby-brand">
          <div className="lobby-tagline">
            A party game of unreasonable debate · case open
          </div>
          <div className="wordmark">
            <span className="the">Now Presenting</span>
            <span className="defense">
              The Defense<span className="amp">.</span>
            </span>
          </div>
          <p className="lobby-subtitle">
            All rise. Or don't. We're not your boss.
          </p>
        </section>

        <section className="public-lobby-panel">
          <div className="brass-rule">Enter Chamber</div>
          <form onSubmit={handleJoin} className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="public-field-label">Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(normalizeRoomCode(e.target.value))
                  }
                  maxLength={ROOM_CODE_LENGTH}
                  placeholder="67ABCD"
                  className="public-input font-mono uppercase tracking-[0.28em]"
                />
              </div>
              <div>
                <label className="public-field-label">Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your Name"
                  className="public-input"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={
                roomCode.length !== ROOM_CODE_LENGTH || !playerName.trim()
              }
              className="btn-ox mt-5"
            >
              Join Game
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-6">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="public-create-btn"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>

          {error && <p className="mt-4 text-center text-against">{error}</p>}
        </section>
      </main>
      <div className="footer-mark">The Defense · {window.location.origin}</div>
    </div>
  );
}
