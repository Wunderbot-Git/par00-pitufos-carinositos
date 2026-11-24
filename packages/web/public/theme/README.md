# Theme assets (DC vs Marvel)

Replace these files to change the look. Keep the file names; sizes are the recommended dimensions.
Team names live in `packages/web/src/lib/theme.ts`, colors in `packages/web/src/app/globals.css` (`:root`).

| File | Size | Used for |
|---|---|---|
| `background.webp` | 1200×2150 | Full-screen app background |
| `hero-header.webp` | 800×800 | Header image on home / signup |
| `battle-header.webp` | 800×264, transparent | Title graphic ("DC VS MARVEL") |
| `avatar-red.webp` / `avatar-blue.webp` | 200×200 | Fallback avatar when a player has none (red = Marvel, blue = DC) |
| `avatars/{name}.webp` | 512×512 | Player avatar. `{name}` = first name, lowercase, no accents, a–z0–9 only (e.g. `josé` → `jose`) |
| `avatars/{name}-winner.webp` | 512×512 | Optional, shown when the player won the match |
| `avatars/{name}-loser.webp` | 512×512 | Optional, shown when the player lost the match |
| `videos/red_win_hole.mp4`, `videos/blue_win_hole.mp4` | — | Optional celebration when a team wins a hole |
| `videos/red_win_tournament.mp4`, `videos/blue_win_tournament.mp4` | — | Optional celebration when a team wins the tournament |

The current images are simple generated placeholders. Missing avatars fall back to the team avatar,
missing videos are skipped.

The previous edition's assets (Pitufos vs Cariñositos) are kept in `archive/theme-pitufos-carinositos/`.
