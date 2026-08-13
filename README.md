# Kowo

Jeu de mots par équipes, à passer de main en main. Un seul téléphone, quatre
joueurs, deux équipes — **les Fougères Furieuses** et **les Cendres Contrariées**.

Implementation of the `Kowo.dc.html` Claude Design component: a React + TypeScript
PWA built from the design's template and its `DCLogic` state machine.

## Running it

```bash
npm install
npm run dev        # dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve the build
npm test           # engine rule tests
```

## Deploying to GitHub Pages

The build uses a relative `base`, so it runs from any subpath — no config
change needed for a project page at `/<repo>/`.

`.github/workflows/deploy.yml` builds, tests and publishes on every push to the
app's branch (and on manual dispatch). It needs Pages switched on once:

> **Settings → Pages → Build and deployment → Source: _GitHub Actions_**

Until that is set, `configure-pages` fails with "Pages is not enabled". The
workflow's `branches:` trigger points at the current feature branch — repoint it
at your default branch once this is merged.

## The rules

A round moves through five beats.

1. **Le tirage.** A coin toss picks the opening team.
2. **Le choix.** The opening team's clue-giver sees five words — two at 10
   points, two at 20, one at 30 — and picks one.
3. **Le pari.** They bid how few guesses ("coups") their team needs: 1, 2 or 3.
   A 1-coup bid is *involable* — it cannot be undercut.
4. **Le contre.** The other team's clue-giver may **steal** the word by
   committing to a strictly shorter bid, or leave it.
5. **L'arbitrage.** The team not playing judges, in two beats per guess:
   the clue (**Valide** / **Interdit**) then the answer (**Trouvé** / **Raté**).

Scoring:

| Outcome | Points go to |
| --- | --- |
| `trouvé` — word guessed within the bid | the playing team |
| `quota épuisé` — guesses ran out | the arbiters |
| `indice refusé` — a clue was banned | the arbiters |

The word is worth its face value either way, and is then burned from the pool.
Only the playing team rotates its clue-giver. An unstolen round passes the
opening to the other team; a stolen one leaves it with the thief.

**Ending.** Crossing the target score does not end the game — it arms one final
round, opened by the *trailing* team. Whoever leads after that round wins.

Between every hand-off the phone shows a **tampon** screen: the incoming holder
confirms an oath ("je jure de ne rien avoir vu") before anything is revealed.
The whole game rests on that screen being honoured.

## Layout

```
src/
  game/
    types.ts       state, actions and domain types
    data.ts        avatars, word corpus, team names
    theme.ts       palettes
    engine.ts      the rules — a pure reducer
    engine.test.ts 37 tests over the rule set
    view.ts        per-screen colour tinting
    storage.ts     last line-up, persisted
  screens/         one component per screen of the design
  components/      Button, font helper
  useKowo.ts       reducer + the app's only source of randomness
  App.tsx          device frame, tint layers, screen switch
```

### The engine is pure

`reduce(state, action, rules)` is a pure function. The three actions that need
randomness — `start` (coin toss), `beginTurn` and `cont` (the five-word deal) —
take it as payload rather than calling `Math.random` internally. `useKowo`
supplies it at dispatch time and is the only non-deterministic part of the app.

This matters for correctness, not just taste: React double-invokes reducers under
`StrictMode`, so a reducer that rolled its own dice would deal twice per turn. It
also makes the rules exhaustively testable — the tests drive whole games through
a seeded generator.

### Tunable rules

The design exposed two editor props, kept here as `Rules` (`src/game/types.ts`)
and passed to `<App>`:

| Rule | Default | Notes |
| --- | --- | --- |
| `scoreCible` | `100` | Score that arms the final round (design bounds: 40–200, step 10) |
| `volAutorise` | `true` | Whether stealing is allowed at all |

There is no settings screen — the design has none. Override at the mount point
to change them.

## Notes on the implementation

Two places where the design needed a decision rather than a transcription:

- **The device frame.** The design draws a 390×844 phone with a bezel, which is
  a desktop-preview affordance. The frame renders when the viewport can fit it;
  on a real phone or an installed PWA the app goes full-bleed and respects the
  safe-area insets instead.
- **Press states.** Every control sits on a solid colour ledge. Nothing in a
  static design says what a press looks like, so buttons sink into their ledge —
  the interaction that visual language implies.

Smaller things: `theme-color` follows the current screen's tint so an installed
app's status bar matches; the Baloo 2 `font` shorthands carry a fallback stack so
layout survives the webfont failing to load; hold-to-peek uses pointer events
rather than the design's paired mouse/touch handlers, which would double-fire on
touch devices; and `prefers-reduced-motion` disables the floating animations.

One string is reproduced as designed rather than corrected: the resolution screen
reads "Ouverture à les Fougères." where French would want *aux*. It comes from
concatenating a team's short name, which already carries its article. Worth a fix
in the design, but it is a copy change, not an implementation one.
