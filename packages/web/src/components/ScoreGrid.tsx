'use client';

import { useRef, useState, useEffect } from 'react';
import { FlightScore } from '@/hooks/useScores';

interface ScoreGridProps {
    flightScore: FlightScore;
    onHoleClick: (hole: number) => void;
    pendingScores: Record<string, Record<number, number>>;
    scrollToHole?: number | null;
}

function getStrokes(siValues: number[], hcp: number, holeIdx: number): number {
    const holeSI = siValues[holeIdx];
    if (!holeSI) return 0;
    const baseStrokes = Math.floor(hcp / 18);
    const remainder = hcp % 18;
    const extraStroke = remainder >= holeSI ? 1 : 0;
    return baseStrokes + extraStroke;
}

function ScoreCell({
    score,
    isPending,
    hcp,
    siValues,
    holeIdx,
    onClick,
    isWinner,
    isSinglesWinner,
    team,
}: {
    score: number | null;
    isPending: boolean;
    hcp: number;
    siValues: number[];
    holeIdx: number;
    onClick: () => void;
    isWinner?: boolean;
    isSinglesWinner?: boolean;
    team: 'red' | 'blue';
}) {
    const playingHcp = Math.round(hcp * 0.8);
    const strokes = getStrokes(siValues, playingHcp, holeIdx);
    const net = score !== null ? score - strokes : null;

    const textColor = team === 'red' ? 'text-rose-600' : 'text-blue-600';
    const winnerBg = isWinner ? (team === 'red' ? 'bg-rose-50' : 'bg-blue-50') : '';

    // Borders
    // Default Team Win Border (Subtle)
    const teamBorder = team === 'red' ? 'border-rose-200' : 'border-blue-200';
    // Singles Win Border (Strong Ring)
    const singlesBorder = team === 'red' ? 'border-rose-500' : 'border-blue-500';

    let winnerBorder = '';

    if (isSinglesWinner) {
        // Strong Ring takes precedence or adds on
        winnerBorder = `rounded-full border-2 ${singlesBorder}`;
    } else if (isWinner) {
        // Just Team Win -> Subtle Border
        winnerBorder = `rounded-full border ${teamBorder}`;
    }

    const dots = Array(strokes).fill('●').join('');

    // Determine text color based on winner state
    let scoreTextColor = 'text-slate-800';
    if (isPending) scoreTextColor = 'text-orange-600';
    else if (isWinner || isSinglesWinner) scoreTextColor = team === 'red' ? 'text-rose-600' : 'text-blue-600';

    return (
        <div
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center min-w-[50px] h-14 cursor-pointer transition-all hover:bg-slate-50 relative
                ${isPending ? 'bg-orange-50/30' : ''}
            `}
        >
            <div className={`
                inline-flex flex-col items-center justify-center w-8 h-8 ${winnerBorder} ${winnerBg}
                ${isPending ? 'opacity-50' : ''}
            `}>
                {score !== null ? (
                    <span className={`text-lg font-bold ${scoreTextColor}`}>
                        {score}
                    </span>
                ) : (
                    <span className="text-slate-200">-</span>
                )}
            </div>

            {strokes > 0 && (
                <span className="absolute top-[2px] right-1 text-[8px] text-slate-300 tracking-[-0.1em]" style={{ lineHeight: '1' }}>
                    {dots}
                </span>
            )}

            {score !== null && strokes > 0 && (
                <span className="text-[10px] font-bold text-slate-400 absolute -bottom-0.5 right-[3px]">
                    {net}
                </span>
            )}
        </div>
    );
}

export function ScoreGrid({ flightScore, onHoleClick, pendingScores, scrollToHole }: ScoreGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const holes = Array.from({ length: flightScore.parValues.length }, (_, i) => i + 1);

    // Filter holes based on segment type: Front 9 for Singles/Fourball, Back 9 for Scramble
    const isScramble = flightScore.segmentType === 'scramble';
    const visibleHoles = isScramble ? holes.slice(9) : holes.slice(0, 9);

    useEffect(() => {
        if (scrollToHole && scrollRef.current) {
            // Find the element for this hole
            const holeEl = document.getElementById(`hole-header-${scrollToHole}`);
            if (holeEl) {
                // Manual scroll calculation to account for sticky header
                const container = scrollRef.current;
                const stickyWidth = 128; // w-32 = 8rem = 128px
                const containerWidth = container.clientWidth;
                const holeWidth = holeEl.offsetWidth;
                const holeLeft = holeEl.offsetLeft;

                // Calculate the target scrollLeft to center the hole in the *visible* area
                // Visible area starts at scrollLeft + stickyWidth
                // Visible width = containerWidth - stickyWidth
                // Target Center = scrollLeft + stickyWidth + (containerWidth - stickyWidth) / 2
                // We want holeCenter (holeLeft + holeWidth/2) to equal Target Center

                // holeLeft + holeWidth/2 = scrollLeft + stickyWidth + (containerWidth - stickyWidth) / 2
                // scrollLeft = holeLeft + holeWidth/2 - stickyWidth - (containerWidth - stickyWidth) / 2

                const targetScrollLeft = holeLeft + (holeWidth / 2) - stickyWidth - ((containerWidth - stickyWidth) / 2);

                container.scrollTo({
                    left: targetScrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [scrollToHole]);

    const renderPlayerRow = (player: any, holeNumbers: number[]) => {
        return (
            <div key={player.playerId} className="flex border-b border-slate-100 last:border-0 items-center">
                <div className="flex-shrink-0 w-32 px-3 py-2 sticky left-0 z-10 bg-white border-r border-slate-100">
                    <p className={`text-sm font-bold truncate ${player.team === 'red' ? 'text-rose-600' : 'text-blue-600'}`}>
                        {player.playerName.replace(/ -$/, '')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">HCP {player.hcp}</p>

                    {/* Singles Match Status Badge — only winner gets colored label */}
                    {player.singlesStatus && (
                        <div className={`
                            mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                            ${player.singlesStatus.startsWith('Won')
                                ? player.team === 'red'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-blue-100 text-blue-700'
                                : 'text-slate-400'
                            }
                        `}>
                            {player.singlesStatus}
                        </div>
                    )}
                </div>
                <div className="flex-1 flex overflow-hidden">
                    {holeNumbers.map((hole) => {
                        const holeIdx = hole - 1;
                        const score = (pendingScores[player.playerId]?.[hole]) ?? player.scores[holeIdx];
                        const isPending = pendingScores[player.playerId]?.[hole] !== undefined;

                        // Winner detection: Only highlight the player(s) who contributed the best net score for the winning team
                        const isTeamWinner = flightScore.holeWinners[holeIdx] === player.team;
                        let isWinner = false;

                        if (isTeamWinner) {
                            if (isScramble) {
                                isWinner = true; // Synced team score always wins
                            } else {
                                // Calculate best net for the team based on backend data
                                const teamPlayers = player.team === 'red' ? flightScore.redPlayers : flightScore.bluePlayers;
                                let minNet = 999;

                                teamPlayers.forEach(p => {
                                    const s = p.scores[holeIdx];
                                    if (s !== null) {
                                        const playingHcp = Math.round(p.hcp * 0.8);
                                        const strokes = getStrokes(flightScore.siValues, playingHcp, holeIdx);
                                        const net = s - strokes;
                                        if (net < minNet) minNet = net;
                                    }
                                });

                                // Check if THIS player matches the minNet (using backend score)
                                const backendScore = player.scores[holeIdx];
                                if (backendScore !== null) {
                                    const myPlayingHcp = Math.round(player.hcp * 0.8);
                                    const myStrokes = getStrokes(flightScore.siValues, myPlayingHcp, holeIdx);
                                    const myNet = backendScore - myStrokes;
                                    if (myNet === minNet) isWinner = true;
                                }
                            }
                        }

                        // Singles Winner Detection
                        let isSinglesWinner = false;
                        if (!isScramble && player.singlesHoles?.[holeIdx] === player.team) {
                            isSinglesWinner = true;
                        }

                        return (
                            <ScoreCell
                                key={hole}
                                score={score}
                                isPending={isPending}
                                hcp={player.hcp}
                                siValues={flightScore.siValues}
                                holeIdx={holeIdx}
                                onClick={() => onHoleClick(hole)}
                                isWinner={isWinner}
                                isSinglesWinner={isSinglesWinner}
                                team={player.team}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderHoleHeaders = (holeNumbers: number[]) => (
        <div className="flex bg-slate-50 border-y border-slate-200 sticky top-0 z-30">
            <div className="flex-shrink-0 w-32 px-3 py-2 bg-slate-50 sticky left-0 z-30 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hole / Par</span>
            </div>
            <div className="flex-1 flex overflow-hidden">
                {holeNumbers.map((hole) => (
                    <div
                        key={hole}
                        id={`hole-header-${hole}`}
                        onClick={() => onHoleClick(hole)}
                        className="min-w-[50px] flex flex-col items-center justify-center py-1.5 border-r border-slate-100/50 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-xs font-black text-slate-800">{hole}</span>
                        <span className="text-[9px] font-bold text-slate-400">P{flightScore.parValues[hole - 1]}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMatchStatusRow = (holeNumbers: number[]) => (
        <div className="flex bg-slate-100 h-10 border-y border-slate-200 shadow-inner relative z-20">
            <div className="flex-shrink-0 w-32 px-3 sticky left-0 z-30 bg-slate-100 border-r border-slate-200 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {flightScore.segmentType === 'scramble' ? 'Scramble Result' : flightScore.segmentType.startsWith('singles') ? 'Match Result' : 'Bestball Result'}
                </span>
            </div>
            <div className="flex-1 flex overflow-hidden">
                {holeNumbers.map((hole) => {
                    const status = flightScore.matchProgression[hole - 1];
                    if (!status) return <div key={hole} className="min-w-[50px] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-100 rounded-full" /></div>;

                    const leader = flightScore.matchLeaders?.[hole - 1];
                    const isRed = leader === 'red';
                    const isBlue = leader === 'blue';
                    const isAS = !leader;

                    return (
                        <div key={hole} className="min-w-[50px] flex items-center justify-center">
                            <div className={`
                                flex items-center justify-center w-7 h-7 rounded-full text-[8px] font-black shadow-sm
                                ${isAS ? 'bg-slate-100 text-slate-500' : isRed ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}
                            `}>
                                {status.replace(' ', '')}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderScrambleRow = (team: 'red' | 'blue', players: any[], holeNumbers: number[]) => {
        if (!players.length) return null;
        const combinedName = players.map(p => p.playerName.split(' ')[0]).join(' / ');
        const avgHcp = Math.round(players.reduce((a: any, b: any) => a + b.hcp, 0) / 2);

        // Use scores from the first player (synced)
        return renderPlayerRow({
            playerId: `${team}_team`,
            playerName: combinedName,
            hcp: avgHcp,
            team: team,
            scores: players[0].scores
        }, holeNumbers);
    };

    return (
        <div className="flex flex-col bg-white">
            <div className="overflow-x-auto overflow-y-hidden pb-4" ref={scrollRef}>
                <div className="min-w-max">
                    {/* Header Row */}
                    {renderHoleHeaders(visibleHoles)}

                    {/* RED TEAM Players */}
                    {isScramble ? (
                        renderScrambleRow('red', flightScore.redPlayers, visibleHoles)
                    ) : (
                        flightScore.redPlayers.map(p => renderPlayerRow({ ...p, team: 'red' }, visibleHoles))
                    )}

                    {/* Match Progression Row */}
                    {renderMatchStatusRow(visibleHoles)}

                    {/* BLUE TEAM Players */}
                    {isScramble ? (
                        renderScrambleRow('blue', flightScore.bluePlayers, visibleHoles)
                    ) : (
                        flightScore.bluePlayers.map(p => renderPlayerRow({ ...p, team: 'blue' }, visibleHoles))
                    )}
                </div>
            </div>
        </div>
    );
}
