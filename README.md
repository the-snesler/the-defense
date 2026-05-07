# The Defense 
A game of absurd courtroom drama, heavily inspired by Jackbox party games.

## The Game Loop

The Defense requires 4 to 10 players. One device acts as the **Host** (the "main screen" displayed on a TV or projector), while players use their phones or personal browsers as controllers.

1. **Writing Phase**: Players have 60 seconds to write absurd subjects (e.g., "Shrek", "the state of Wisconsin") and predicates (e.g., "invented jazz").
2. **Setup & Pairing**: Players are randomly paired up. 
3. **Claim Generation**: Without seeing what the other chose, one player picks a subject and the other picks a predicate from the pool to form a ridiculous claim (e.g., *"The state of Wisconsin invented jazz"*).
4. **Debate Rounds** (sequential per pair):
   - **Reveal**: The claim is revealed to the room. The system assigns one player **FOR** and the other **AGAINST**.
   - **Prep**: 15 seconds of silent prep time. Debaters can make private notes on their phones.
   - **Opening Statements**: FOR gets 30 seconds, followed by AGAINST for 30 seconds. Meanwhile, the audience (non-debating players) can submit questions via their phones.
   - **Cross-examination**: Debaters get 45 seconds to respond to randomly selected audience questions.
   - **Verdict**: The audience votes on who won the debate (who made the better argument). The pair splits a point pot based on vote percentages.
5. **Round 2 & Finale**: A second round repeats the process with double the points. The game concludes with a final leaderboard and an optional "Best Claim" superlative.

## Technical Architecture

The game utilizes a **host-authoritative architecture** within a monorepo setup:

- **Host-Authoritative State**: The "Host" web client contains all the game logic, state, and rules. 
- **The "Dumb Pipe" Backend**: The backend is completely unaware of game rules or phases. It acts merely as a transparent message router between the Host and the Players.
- **Monorepo Structure**:
  - `apps/server`: A minimalist Bun-based WebSocket relay server.
  - `apps/web`: The React client serving both the Host and Player interfaces depending on the route.
  - `packages/shared`: Shared TypeScript types and Zod schemas used to validate network messages.
- **Network Protocol**: All WebSocket messages use an envelope containing a `target` (`"HOST"`, `"ALL"`, or a specific `"PLAYER_ID"`). The server injects a `senderId` and simply routes the message to its destination across the WebSocket.

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the backend server (port 3001)
pnpm --filter @defense/server dev

# Build shared types package
pnpm --filter @defense/shared build

# Type check specific packages
pnpm --filter @defense/server typecheck
pnpm --filter @defense/shared typecheck
``` 
