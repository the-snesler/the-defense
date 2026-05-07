# AGENTS.md

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the backend server (port 3001)
pnpm --filter @defense/server dev

# Build shared types package
pnpm --filter @defense/shared build

# Type check specific package
pnpm --filter @defense/server typecheck
pnpm --filter @defense/shared typecheck
```

## Architecture Overview

This is a Jackbox-style party game using a **host-authoritative architecture**.

### Monorepo Structure

- **apps/server** - Bun-based WebSocket relay server
- **apps/web** - React client (Host + Player views) - not yet implemented
- **packages/shared** - Zod schemas, TypeScript types, game constants

### Key Architectural Decisions

**Host-Authoritative State**: The Host client (desktop browser) manages all game state and rules. The backend is a "dumb pipe" that only routes messages between Host and Players. This allows game rules to change without backend modifications.

**Message Routing**: All WebSocket messages follow the `NetworkMessage` envelope with a `target` field:
- `target: "HOST"` - Route to host socket
- `target: "ALL"` - Broadcast to all players
- `target: "player_123"` - Route to specific player

The server injects `senderId` before forwarding messages.

### Server Endpoints

- `POST /api/v1/rooms` - Create room, returns `{ roomCode, hostToken }`
- `GET /api/v1/rooms/:code/ws` - WebSocket upgrade (query params: `role`, `token`, `name`, `playerId`)

### Type Sharing

Import shared types from `@defense/shared`:
```typescript
import { GameState, Player, MessageTypes, NetworkMessage } from '@defense/shared';
```

All types have corresponding Zod schemas for runtime validation (e.g., `PlayerSchema`, `GameStateSchema`).

# Network Protocol Specification

The backend acts as a **transparent relay** (dumb pipe). It does not validate game rules; it only routes messages between the **Host** (Game Authority) and **Players**.

## Message Envelope

All WebSocket messages follow this JSON structure:

```typescript
interface NetworkMessage {
  type: string;      // Event name (e.g., "SUBMIT_LIE", "SYNC_STATE")
  payload: any;      // The actual data
  target?: string;   // "HOST", "ALL", or specific "PLAYER_ID" (Routing instruction)
  senderId?: string; // Injected by the server so the recipient knows who sent it
}
```

## Communication Flows

note that these example communications use payload types (SUBMIT_LIE) that won't exist in this game

### 1. Player -> Host

The Player client sends a message intended for the Host. The Server sees `target: "HOST"` and forwards it to the Host's socket.

1.  **Player Client** sends:
    ```json
    {
      "type": "SUBMIT_LIE",
      "payload": { "text": "I am a banana" },
      "target": "HOST"
    }
    ```
2.  **Server** receives, looks up the Host socket for this room, and forwards:
    ```json
    {
      "type": "SUBMIT_LIE",
      "payload": { "text": "I am a banana" },
      "senderId": "player_123" // Server injects this!
    }
    ```
3.  **Host Client** receives, updates its local `GameState`, and re-renders.

### 2. Host -> All Players (e.g., State Sync)

The Host updates the game state (e.g., moving from "Writing" to "Voting" phase) and needs to tell everyone what to show.

1.  **Host Client** sends:
    ```json
    {
      "type": "SYNC_STATE",
      "payload": { "phase": "VOTING", "timer": 30 },
      "target": "ALL"
    }
    ```
2.  **Server** broadcasts to all connected Player sockets in the room:
    ```json
    {
      "type": "SYNC_STATE",
      "payload": { "phase": "VOTING", "timer": 30 },
      "senderId": "HOST"
    }
    ```

### 3. Host -> Single Player (e.g., "You are the VIP")

1.  **Host Client** sends:
    ```json
    {
      "type": "SET_VIP",
      "payload": { "isVip": true },
      "target": "player_123"
    }
    ```
2.  **Server** forwards only to `player_123`:
    ```json
    {
      "type": "SET_VIP",
      "payload": { "isVip": true },
      "senderId": "HOST"
    }
    ```

## Server Responsibilities

The Server is minimal. It only handles:
1.  **Room Management**: Creating rooms, mapping `roomCode` to a set of sockets.
2.  **Connection Lifecycle**: Handling `ws.on('close')` to notify the Host that a player disconnected.
3.  **Routing**: Reading the `target` field and forwarding the message.

It does **NOT** know what a "Lie" is, or what the "Voting" phase is. This allows us to change game rules in the React Host without touching the backend.


# Prior Art

## How Jackbox does it

this is mostly an example to guide architectural decisions, not a direct blueprint to copy.

1. **Room Creation**:
- Client POSTs to `/api/v2/rooms` with app_id, max_players, audience_enabled
- Server generates room code, creates Room with empty entities
- Returns room config with host token and room code

2. **Player Connection**:
- Each player connects to `/api/v2/rooms/:code/play`
- Query params include user_id, role (host/player/audience), name
- Reconnection handled via secret token

3. **Game State Management**:
- Host creates entities via `text/create`, `number/create`, `doodle/create`
- Each entity gets ACL (who can read/write)
- Players update entities based on permissions
- Server broadcasts ALL changes to ALL connected clients
- Clients maintain local cache of entities

Client connection lifecycle:
```
1. Client connects to /api/v2/rooms/:code/play (ecast) or /socket.io/1/websocket/:id
2. WebSocket established
3. Server sends client/welcome with current entities, room config, and player list
4. Client sends operations (text/create, number/set, doodle/stroke, etc.)
5. Server applies operation, updates entities
6. Server broadcasts changes to other clients via WebSocket
7. Client sends ping, server responds pong (keep-alive)
8. Client closes connection or room exits
```

# Components

- Backend server maintains WS connections to all clients, handles connecting all the clients in a “room” together
    - Also handles reconnection logic should a client become disconnected- prove that the client is allowed to join a closed room as a given role
- “Host” client = desktop web browser: shows game state, player responses, timer countdowns
    - Ideally this single client should be responsible for all game state and rules, so that additional games can be built on the same backend later
- “Player” client = mobile/desktop browser: represents a single player, receive game state, submit responses to the “host”

# The Defense — Game Lifecycle

The "host" is a desktop browser displayed on a TV/projector. It shows the current claim, debate timer, live audience question feed, and scores. The "players" are mobile or desktop browsers connecting via room code. Players are both debaters (when it's their turn) and audience/judges (when watching other pairs). Player phones serve different UIs depending on phase: claim builder, debate prep notes, question submission box, or voting screen.

- Host client requests a room, receives room code
- Player clients enter room code to join (min 4, max 10)
- First player to join has a "start" button
- Game starts

## Tutorial phase
- Host displays rules and a quick example claim + mock debate (pre-written, ~30 seconds)
- Player phones show a condensed version of the rules

## Pairing phase
- System assigns pairs for Round 1 (random). Pairings for Round 2 are also pre-determined at this point using a round-robin rotation so no matchups repeat.
- All pairs are shown on host screen briefly before moving into claim generation

## Claim generation phase (parallel across all pairs)
- For each pair, Player A is shown 3 random **subjects** drawn from a curated pool (e.g., "Shrek", "my landlord", "the state of Wisconsin", "a surprisingly ambitious raccoon"). Player A picks one.
- Simultaneously, Player B is shown 3 random **predicates** from a separate pool (e.g., "invented jazz", "is legally considered a vegetable", "was the original lead singer of Nickelback"). Player B picks one.
- Neither player sees what the other picked. Both see a "waiting for your opponent..." screen after choosing.
- This happens for all pairs at once, so this phase takes ~20 seconds regardless of pair count.

## Debate rounds (sequential per pair, happens twice — Round 1 and Round 2)

For each pair in the current round:

### Reveal
- Host screen does a dramatic reveal: Player A's subject + Player B's predicate are combined into the claim (e.g., **"The state of Wisconsin was the original lead singer of Nickelback"**)
- System randomly assigns FOR and AGAINST, displayed under each player's name
- ~5 second beat for the room to react

### Prep
- 15 seconds of silent prep. Both players' phones show the full claim and their assigned side. They can jot private bullet-point notes on their phone (not shared).
- Audience phones show a "debate starting soon" screen

### Opening statements
- FOR goes first: 30 seconds to make their case, timed on host screen
- AGAINST follows: 30 seconds
- During both statements, all non-debating players' phones show a **question submission box** — they can type and submit questions at any time. Questions are timestamped and queued server-side but not yet shown. (also has a emotion reaction button that sends 😂 or 🔥 reaction bursts to the host in real time)

### Cross-examination
- Host displays the 2 top audience questions (selected at random) one at a time. one for each debater.
- Each debater gets 30 seconds to respond to each question

### Verdict
- All non-debating players vote on their phones: **FOR** or **AGAINST** (i.e., who won the debate, not whether the claim is true)
- Host shows a dramatic vote tally animation
- The pot is **1000 points** (round 1) or **2000 points** (round 2). The debaters split this pot based on the percentage of votes they received (e.g., if FOR gets 70% of the votes, they earn 700 points and AGAINST earns 300 points). Points are added to their total score.

### Transition
- Brief scoreboard flash on host, then next pair starts at the Reveal step

## Round 2
- New pairings displayed (from the pre-determined rotation)
- New claim generation phase (same parallel subject/predicate flow)
- Same debate structure, but all point values are doubled
- Host screen shows "DOUBLE POINTS" theming to raise stakes

## Finale
- Final leaderboard displayed on host with rankings
- Optional: "Best Claim" superlative — audience votes on the funniest claim generated across the whole game (shown on phones as a quick poll)

## Wrinkles and solutions

**Odd player count.** If there's an odd number of players, one pair per round becomes a **tribunal**: 2v1, where two players argue AGAINST and one argues FOR (or vice versa). The solo side gets slightly more speaking time (40s vs 25s each). Alternatively, the odd player out becomes a "special prosecutor" — they don't debate but get to submit a guaranteed question that always gets displayed. They rotate each round.

**Audience is tiny.** With 4-6 players total, only 2-4 people are voting on any given debate and question submissions might be sparse. System has a fallback pool of pre-written "prosecution questions" (e.g., "Can you provide a witness?", "How do you explain [random contradictory fact]?") that auto-populate if fewer than 2 audience questions are submitted by the end of opening statements.

**FOR/AGAINST asymmetry.** FOR is inherently funnier and harder — you're defending the indefensible, which is where the improv commitment lives. AGAINST can just be reasonable, which is boring. Two options: (a) Lean into it and treat FOR as the "star role" — AGAINST's job is to be the straight man who sets up FOR's ridiculous justifications (this is actually a natural improv dynamic: the grounded character makes the absurd character funnier). (b) Force AGAINST to commit to a specific counter-theory rather than just denying ("Shrek DIDN'T invent jazz — jazz was invented by a sentient trumpet in 1843"). I'd go with (a) for simplicity and note it in the tutorial: "AGAINST: your job is to poke holes. FOR: your job is to fill them with something worse."

**Claims that don't make grammatical sense.** Combining random subjects + predicates will occasionally produce duds ("a surprisingly ambitious raccoon is legally considered a vegetable" works fine, but some combos might be grammatically broken or boring). Solutions: tag subjects as person/place/thing and predicates as requiring person/place/thing, so they're at least grammatically compatible. Keep both pools hand-curated rather than procedurally generated — a pool of ~30 subjects and ~30 predicates gives 900 unique claims, which is way more than enough.

**Dead time during other pairs' debates.** Non-debating players need something to do. They're submitting questions and voting, which helps, but between those moments they're passive. Consider: a live "reaction area" on the host screen — audience phones have a simple tap-to-react button (😂 or 🔥) that creates a particle effect of the corresponding emoji on the host, like livestreams on phones.
