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

    const dots = Array(strokes).fill('●').join('');

    // Filled circle for winners: solid team color bg + white text
    let winnerClasses = '';
    let scoreTextColor = 'text-forest-deep';

    if (isPending) {
        scoreTextColor = 'text-gold-border';
    } else if (isSinglesWinner) {
        winnerClasses = team === 'red' ? 'rounded-full bg-team-red' : 'rounded-full bg-team-blue';
        scoreTextColor = 'text-white';
    } else if (isWinner) {
        winnerClasses = team === 'red' ? 'rounded-full bg-team-red/20 border-2 border-team-red' : 'rounded-full bg-team-blue/20 border-2 border-team-blue';
        scoreTextColor = team === 'red' ? 'text-team-red' : 'text-team-blue';
    }

    return (
        <div
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center min-w-[50px] h-14 cursor-pointer transition-all hover:bg-gold-light/10 relative
                ${isPending ? 'bg-gold-light/10' : ''}
            `}
        >
            <div className={`
                inline-flex flex-col items-center justify-center w-8 h-8 ${winnerClasses}
                ${isPending ? 'opacity-50' : ''}
            `}>
                {score !== null ? (
                    <span className={`text-lg font-fredoka font-bold ${scoreTextColor}`}>
                        {score}
                    </span>
                ) : (
                    <span className="text-gold-border/30">-</span>
                )}
            </div>

            {strokes > 0 && (
                <span className="absolute top-[2px] right-1 text-[8px] text-gold-border/40 tracking-[-0.1em]" style={{ lineHeight: '1' }}>
                    {dots}
                </span>
            )}

            {score !== null && strokes > 0 && (
                <span className="text-[10px] font-fredoka font-bold text-forest-deep/40 absolute -bottom-0.5 right-[3px]">
                    {net}
                </span>
            )}
        </div>
    );
}

export function ScoreGrid({ flightScore, onHoleClick, pendingScores, scrollToHole }: ScoreGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const holes = Array.from({ length: flightScore.parValues.length }, (_, i) => i + 1);

    const isScramble = flightScore.segmentType === 'scramble';
    const visibleHoles = isScramble ? holes.slice(9) : holes.slice(0, 9);

    useEffect(() => {
        if (scrollToHole && scrollRef.current) {
            const holeEl = document.getElementById(`hole-header-${scrollToHole}`);
            if (holeEl) {
                const container = scrollRef.current;
                const stickyWidth = 128;
                const containerWidth = container.clientWidth;
                const holeWidth = holeEl.offsetWidth;
                const holeLeft = holeEl.offsetLeft;

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
            <div key={player.playerId} className="flex border-b border-gold-border/10 last:border-0 items-center">
                <div className="flex-shrink-0 w-32 px-3 py-2 sticky left-0 z-10 bg-cream border-r border-gold-border/20">
                    <p className={`text-sm font-fredoka font-bold truncate ${player.team === 'red' ? 'text-team-red' : 'text-team-blue'}`}>
                        {player.playerName.replace(/ -$/, '')}
                    </p>
                    <p className="text-[10px] font-fredoka font-bold text-forest-deep/40 uppercase tracking-tighter">HCP {player.hcp}</p>

                    {player.singlesStatus && (
                        <div className={`
                            mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bangers uppercase tracking-wider
                            ${player.singlesStatus.startsWith('Won') || player.singlesStatus.includes('UP')
                                ? player.team === 'red'
                                    ? 'bg-team-red/10 text-team-red'
                                    : 'bg-team-blue/10 text-team-blue'
                                : 'text-forest-deep/30'
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

                        const isTeamWinner = flightScore.holeWinners[holeIdx] === player.team;
                        let isWinner = false;

                        if (isTeamWinner) {
                            if (isScramble) {
                                isWinner = true;
                            } else {
                                const teamPlayers = player.team === 'red' ? flightScore.redPlayers : flightScore.bluePlayers;
                                let minNet = 999;

                                teamPlayers.forEach((p: any) => {
                                    const s = p.scores[holeIdx];
                                    if (s !== null) {
                                        const playingHcp = Math.round(p.hcp * 0.8);
                                        const strokes = getStrokes(flightScore.siValues, playingHcp, holeIdx);
                                        const net = s - strokes;
                                        if (net < minNet) minNet = net;
                                    }
                                });

                                const backendScore = player.scores[holeIdx];
                                if (backendScore !== null) {
                                    const myPlayingHcp = Math.round(player.hcp * 0.8);
                                    const myStrokes = getStrokes(flightScore.siValues, myPlayingHcp, holeIdx);
                                    const myNet = backendScore - myStrokes;
                                    if (myNet === minNet) isWinner = true;
                                }
                            }
                        }

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
        <div className="flex bg-forest-deep/10 border-y border-gold-border/20 sticky top-0 z-30">
            <div className="flex-shrink-0 w-32 px-3 py-2 bg-cream sticky left-0 z-30 border-r border-gold-border/20">
                <span className="text-[10px] font-bangers text-forest-deep/60 uppercase tracking-widest">Hoyo / Par</span>
            </div>
            <div className="flex-1 flex overflow-hidden">
                {holeNumbers.map((hole) => (
                    <div
                        key={hole}
                        id={`hole-header-${hole}`}
                        onClick={() => onHoleClick(hole)}
                        className="min-w-[50px] flex flex-col items-center justify-center py-1.5 border-r border-gold-border/10 cursor-pointer hover:bg-gold-light/10 transition-colors"
                    >
                        <span className="text-xs font-bangers text-forest-deep">{hole}</span>
                        <span className="text-[9px] font-fredoka font-bold text-forest-deep/40">P{flightScore.parValues[hole - 1]}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMatchStatusRow = (holeNumbers: number[]) => (
        <div className="flex bg-forest-mid/10 h-10 border-y border-gold-border/20 shadow-inner relative z-20">
            <div className="flex-shrink-0 w-32 px-2 sticky left-0 z-30 bg-forest-mid/10 border-r border-gold-border/20 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <span className="text-[8px] font-bangers text-forest-deep/60 uppercase tracking-wider leading-tight">
                    {flightScore.segmentType === 'scramble' ? 'Resultado Scramble' : flightScore.segmentType.startsWith('singles') ? 'Resultado Partido' : 'Resultado Mejor Bola'}
                </span>
            </div>
            <div className="flex-1 flex overflow-hidden">
                {holeNumbers.map((hole) => {
                    const status = flightScore.matchProgression[hole - 1];
                    if (!status) return <div key={hole} className="min-w-[50px] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-gold-border/20 rounded-full" /></div>;

                    const leader = flightScore.matchLeaders?.[hole - 1];
                    const isRed = leader === 'red';
                    const isBlue = leader === 'blue';
                    const isAS = !leader;

                    return (
                        <div key={hole} className="min-w-[50px] flex items-center justify-center">
                            <div className={`
                                flex items-center justify-center w-7 h-7 rounded-full text-[8px] font-bangers shadow-sm
                                ${isAS ? 'bg-forest-mid/20 text-forest-deep/60' : isRed ? 'bg-team-red/15 text-team-red' : 'bg-team-blue/15 text-team-blue'}
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

        return renderPlayerRow({
            playerId: `${team}_team`,
            playerName: combinedName,
            hcp: avgHcp,
            team: team,
            scores: players[0].scores
        }, holeNumbers);
    };

    return (
        <div className="flex flex-col cartoon-card overflow-hidden">
            <div className="overflow-x-auto pb-4" ref={scrollRef}>
                <div className="min-w-max">
                    {renderHoleHeaders(visibleHoles)}

                    {isScramble ? (
                        renderScrambleRow('red', flightScore.redPlayers, visibleHoles)
                    ) : (
                        flightScore.redPlayers.map(p => renderPlayerRow({ ...p, team: 'red' }, visibleHoles))
                    )}

                    {renderMatchStatusRow(visibleHoles)}

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
