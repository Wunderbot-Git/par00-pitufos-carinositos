/**
 * Central theme configuration.
 *
 * Everything that makes up the "look" of a tournament edition lives here:
 * team names, image/video asset paths and the avatar lookup. Team colors are
 * defined as CSS variables in `src/app/globals.css` (`:root` block) and exposed
 * to Tailwind as `team-red` / `team-blue` (+ `-light`, `-dark`, `-deep`).
 *
 * Internally the teams are always `red` and `blue` (database, API, scoring).
 * Only the display names and visuals change per theme.
 *
 * To re-skin the app for a new edition:
 *   1. Change the names below.
 *   2. Change the color variables in `globals.css`.
 *   3. Replace the files in `public/theme/` (keep the same file names).
 *   4. Update `packages/api/src/config/theme.ts` (team labels used by the API).
 */

export type TeamId = 'red' | 'blue';

export const THEME = {
    appName: 'Ryder Cup Par00',
    edition: 'DC vs Marvel',

    teams: {
        red: { name: 'Marvel' },
        blue: { name: 'DC' },
    } as Record<TeamId, { name: string }>,

    assets: {
        /** Square hero image on the home/signup page (800×800). */
        heroHeader: '/theme/hero-header.webp',
        /** Wide title graphic, transparent background (800×264). */
        battleHeader: '/theme/battle-header.webp',
        /** Player avatars: `/theme/avatars/{name}.webp`, optional `{name}-winner.webp` / `{name}-loser.webp`. */
        avatarDir: '/theme/avatars',
        /** Shown when a player has no avatar of their own (200×200). */
        fallbackAvatar: {
            red: '/theme/avatar-red.webp',
            blue: '/theme/avatar-blue.webp',
        } as Record<TeamId, string>,
        /** Celebration videos. Missing files are skipped silently. */
        videos: {
            red: '/theme/videos/red_win_hole.mp4',
            blue: '/theme/videos/blue_win_hole.mp4',
            red_tournament: '/theme/videos/red_win_tournament.mp4',
            blue_tournament: '/theme/videos/blue_win_tournament.mp4',
        } as Record<string, string>,
        // Background image: see `.bg-app-gradient::before` in globals.css (/theme/background.webp)
    },
};

export const TEAM_NAMES: Record<TeamId, string> = {
    red: THEME.teams.red.name,
    blue: THEME.teams.blue.name,
};

/** Betting uses A/B for teams: A = red, B = blue. */
export const TEAM_NAMES_AB: Record<'A' | 'B', string> = {
    A: TEAM_NAMES.red,
    B: TEAM_NAMES.blue,
};

export function teamName(team: string | null | undefined): string {
    return team === 'red' || team === 'blue' ? TEAM_NAMES[team] : '';
}

/** First name → lowercase → strip accents → alphanumeric only. */
export function normalizeName(name: string): string {
    return name
        .split(' ')[0]
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

export function avatarUrl(playerName: string, variant?: 'winner' | 'loser'): string {
    const base = `${THEME.assets.avatarDir}/${normalizeName(playerName)}`;
    return variant ? `${base}-${variant}.webp` : `${base}.webp`;
}
