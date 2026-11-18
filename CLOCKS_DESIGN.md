# Chess Clock Design

## Understanding

- Add local two-player chess clocks to the existing responsive Sanctum Chess app.
- Show both players' remaining times in compact status-bar chips and highlight the active clock.
- Provide 3-, 5-, and 10-minute time controls, defaulting to 10 minutes.
- Start timing on the first move; switch the active side after each legal move.
- A timeout ends the match and names the player who flagged.
- Reset restores the selected time; undo does not refund elapsed time.
- Persist clock state with the existing local save and account for time while the app is backgrounded.

## Assumptions and non-goals

- This is an offline, local game; no server, network clock, increment, or pause feature is needed.
- Use a monotonic clock and elapsed timestamps as the source of truth; displayed values may refresh periodically.
- AI search time counts against the AI side's clock. Timeout must be checked after synchronous search returns.
- Existing chess move legality and desktop layout remain unchanged.

## Decision log

1. Use timestamp-derived remaining milliseconds rather than decrementing a one-second interval. This is less vulnerable to browser timer throttling and drift.
2. Put both clock chips in the existing status bar and the time-control selector in the existing control strip to preserve the responsive board area.
3. Do not restore clock time on undo; reset the selected control on a new game.

## Implementation and verification

- Add the clock state, display, time-control selection, active-side switching, flag-fall handling, and save/load integration.
- Verify first move start, legal-move switching, AI time consumption, timeout, reset, undo/redo behavior, and persistence.
- Check compact/mobile and desktop layouts, then sync the Capacitor web assets.
