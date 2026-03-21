'use client';

import { useMemo } from 'react';
import { useMyEvents } from '@/hooks/useEvents';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { PullToRefresh } from '@/components/PullToRefresh';

interface PlayerRanking {
    playerId: string;
    playerName: string;
    team: 'red' | 'blue';
    points: number;
    matchesPlayed: number;
    matchesTotal: number;
}

function normalizeName(name: string) {
    return name
        .split(' ')[0]
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

export default function RankingPage() {
    const { events, isLoading: eventsLoading } = useMyEvents();

    const activeEvent = useMemo(() => {
        if (!events || events.length === 0) return null;
        return events.find(e => e.status === 'live') || events[0];
    }, [events]);

    const eventId = activeEvent?.id || '';
    const { data: leaderboard, isLoading: scoresLoading, refetch } = useLeaderboard(eventId);

    const rankings = useMemo(() => {
        if (!leaderboard) return [];

        const playerMap: Record<string, PlayerRanking> = {};

        for (const match of leaderboard.matches) {
            const matchPoints = match.segmentType === 'scramble' ? 2 : 1;
            const isCompleted = match.status === 'completed';
            const isStarted = match.status !== 'not_started';

            let redPts = 0;
            let bluePts = 0;

            if (isCompleted) {
                if (match.matchWinner === 'red') {
                    redPts = matchPoints;
                } else if (match.matchWinner === 'blue') {
                    bluePts = matchPoints;
                } else {
                    redPts = matchPoints / 2;
                    bluePts = matchPoints / 2;
                }
            } else if (isStarted) {
                if (match.currentLeader === 'red') {
                    redPts = matchPoints;
                } else if (match.currentLeader === 'blue') {
                    bluePts = matchPoints;
                } else {
                    redPts = matchPoints / 2;
                    bluePts = matchPoints / 2;
                }
            } else {
                redPts = matchPoints / 2;
                bluePts = matchPoints / 2;
            }

            for (const p of match.redPlayers) {
                if (!playerMap[p.playerId]) {
                    playerMap[p.playerId] = {
                        playerId: p.playerId,
                        playerName: p.playerName,
                        team: 'red',
                        points: 0,
                        matchesPlayed: 0,
                        matchesTotal: 0,
                    };
                }
                playerMap[p.playerId].points += redPts;
                playerMap[p.playerId].matchesTotal++;
                if (isCompleted) playerMap[p.playerId].matchesPlayed++;
            }

            for (const p of match.bluePlayers) {
                if (!playerMap[p.playerId]) {
                    playerMap[p.playerId] = {
                        playerId: p.playerId,
                        playerName: p.playerName,
                        team: 'blue',
                        points: 0,
                        matchesPlayed: 0,
                        matchesTotal: 0,
                    };
                }
                playerMap[p.playerId].points += bluePts;
                playerMap[p.playerId].matchesTotal++;
                if (isCompleted) playerMap[p.playerId].matchesPlayed++;
            }
        }

        return Object.values(playerMap).sort((a, b) => b.points - a.points);
    }, [leaderboard]);

    const isLoading = eventsLoading || scoresLoading;
    const allCompleted = leaderboard?.matches.every(m => m.status === 'completed') ?? false;

    return (
        <PullToRefresh onRefresh={refetch}>
            <div className="min-h-screen pb-28 pt-4 px-4">
                <h1 className="text-2xl font-bangers text-cream text-center mb-4 tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Ranking Individual
                </h1>

                {isLoading ? (
                    <p className="text-center text-cream/50 font-fredoka">Cargando ranking...</p>
                ) : rankings.length === 0 ? (
                    <p className="text-center text-cream/50 font-fredoka">No hay datos de partidos.</p>
                ) : (
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                        }}
                    >
                        {rankings.map((player, idx) => {
                            const avatarName = normalizeName(player.playerName);
                            const teamColor = player.team === 'red' ? '#E75480' : '#4A90D9';
                            const isFirst = idx === 0;
                            const isLast = idx === rankings.length - 1;

                            return (
                                <div
                                    key={player.playerId}
                                    className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-gray-200/60' : ''} ${isFirst ? 'bg-gold-border/5' : ''}`}
                                >
                                    <span
                                        className="text-lg font-bangers w-6 text-center"
                                        style={{ color: idx < 3 ? '#c8a200' : '#999' }}
                                    >
                                        {idx + 1}
                                    </span>

                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: teamColor }}>
                                        <img
                                            src={`/images/${avatarName}.webp`}
                                            alt={player.playerName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = player.team === 'red'
                                                    ? '/images/Gemini_Generated_Image_exn7bfexn7bfexn7-removebg-preview.webp'
                                                    : '/images/Gemini_Generated_Image_jonki9jonki9jonk__1_-removebg-preview.webp';
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div
                                            className="font-bangers text-base tracking-wider truncate"
                                            style={{ color: teamColor }}
                                        >
                                            {player.playerName.split(' ')[0]}
                                        </div>
                                        <div className="text-[10px] font-fredoka text-gray-400">
                                            {player.matchesPlayed}/{player.matchesTotal} partidos
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bangers text-xl text-forest-deep">
                                            {player.points % 1 === 0 ? player.points : player.points.toFixed(1)}
                                        </div>
                                        <div className="text-[10px] font-fredoka text-gray-400">pts</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isLoading && rankings.length > 0 && !allCompleted && (
                    <p className="text-center text-cream/40 text-xs font-fredoka mt-3">
                        * Incluye puntos proyectados de partidos en curso
                    </p>
                )}
            </div>
        </PullToRefresh>
    );
}
