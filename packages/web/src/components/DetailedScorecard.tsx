'use client';

import { Match, PlayerScore } from '@/hooks/useLeaderboard';
import { useAuth } from '@/lib/auth';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface DetailedScorecardProps {
    match: Match;
    onClose?: () => void;
}

function getStrokes(hcpValues: number[], hcp: number, holeIndex: number): number {
    const holeHcp = hcpValues[holeIndex];
    if (!holeHcp) return 0;

    const baseStrokes = Math.floor(hcp / 18);
    const remainder = hcp % 18;
    const extraStroke = remainder >= holeHcp ? 1 : 0;
    return baseStrokes + extraStroke;
}

function ScoreCell({
    score,
    par,
    strokes,
    team,
    isWinner,
    isLoser,
}: {
    score: number | null;
    par: number;
    strokes: number;
    team: 'red' | 'blue';
    isWinner?: boolean;
    isLoser?: boolean;
}) {
    const dots = Array(strokes).fill('\u25CF').join('');

    if (score === null) {
        return (
            <td className="p-0 text-center relative">
                <span className="text-gray-300 text-[10px] font-fredoka">-</span>
                {strokes > 0 && (
                    <span className="absolute top-0 right-0 text-[6px] text-gray-300 tracking-tighter" style={{ lineHeight: '0.8', right: '2px', top: '1px' }}>{dots}</span>
                )}
            </td>
        );
    }

    const netScore = score - strokes;
    const isBirdie = netScore < par;
    const isBogey = netScore > par;

    // Background for won holes
    let cellBg = '';
    if (isWinner) {
        cellBg = team === 'red'
            ? 'rgba(231,84,128,0.15)'
            : 'rgba(74,144,217,0.15)';
    }

    // Text color and weight
    let textColor = team === 'red' ? '#E75480' : '#4A90D9';
    let fontWeight = 'normal';
    if (isWinner) {
        fontWeight = 'bold';
    } else if (isLoser) {
        textColor = team === 'red' ? 'rgba(231,84,128,0.4)' : 'rgba(74,144,217,0.4)';
    }

    return (
        <td className="p-0 text-center relative" style={{ backgroundColor: cellBg }}>
            <div className="inline-flex items-center justify-center w-6 h-6 relative">
                {/* Birdie circle indicator */}
                {isBirdie && (
                    <div
                        className="absolute w-5 h-5 rounded-full"
                        style={{
                            backgroundColor: team === 'red' ? 'rgba(231,84,128,0.2)' : 'rgba(74,144,217,0.2)',
                            border: `1px solid ${team === 'red' ? '#E75480' : '#4A90D9'}`,
                        }}
                    />
                )}
                {/* Bogey square indicator */}
                {isBogey && (
                    <div
                        className="absolute w-5 h-5 rounded-[2px]"
                        style={{
                            backgroundColor: team === 'red' ? 'rgba(231,84,128,0.1)' : 'rgba(74,144,217,0.1)',
                            border: `1px solid ${team === 'red' ? 'rgba(231,84,128,0.35)' : 'rgba(74,144,217,0.35)'}`,
                        }}
                    />
                )}
                <span className="relative z-10 text-sm leading-none font-fredoka" style={{ color: textColor, fontWeight }}>{score}</span>
            </div>
            {strokes > 0 && (
                <span className="absolute top-0 right-0 text-[6px] text-gray-400 tracking-tighter" style={{ lineHeight: '0.8', right: '2px', top: '1px' }}>{dots}</span>
            )}
        </td>
    );
}

export function DetailedScorecard({ match, onClose }: DetailedScorecardProps) {
    const { user } = useAuth();
    const params = useParams();
    const eventId = params.eventId as string;

    const frontNine = match.parValues.slice(0, 9);
    const backNine = match.parValues.slice(9, 18);
    const holeNumbers = Array.from({ length: 18 }, (_, i) => i + 1);

    const showFront = match.segmentType !== 'scramble';
    const showBack = match.segmentType === 'scramble';

    const renderHalfTable = (start: number, end: number, label: string) => {
        const holes = holeNumbers.slice(start, end);
        const pars = match.parValues.slice(start, end);
        const hcps = match.hcpValues.slice(start, end);
        const progression = match.matchProgression.slice(start, end);
        const holeWinnersChunk = match.holeWinners ? match.holeWinners.slice(start, end) : [];
        const isOut = label.includes('FRONT');

        // Track row index for alternating backgrounds
        let rowIdx = 0;

        return (
            <div className="mb-0">
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1a1a3e' }}>
                                <th className="p-1.5 text-left font-bangers w-16 pl-2 text-xs text-white font-bold rounded-tl-lg">Hoyo</th>
                                {holes.map(h => (
                                    <th key={h} className="p-1 text-center font-bangers text-xs w-[8%] min-w-[20px] text-white font-bold">{h}</th>
                                ))}
                                <th className="p-1.5 text-center font-bangers w-10 text-[10px] sm:text-xs text-white font-bold rounded-tr-lg">{isOut ? 'Out' : 'In'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Par row */}
                            <tr className={`border-b border-gray-100 ${rowIdx++ % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                                <td className="p-1.5 font-fredoka text-gray-400 pl-2 text-[9px] uppercase tracking-wider font-normal">Par</td>
                                {pars.map((p, i) => (
                                    <td key={i} className="p-0.5 text-center text-gray-400 font-fredoka font-normal text-[9px]">{p}</td>
                                ))}
                                <td className="p-1.5 text-center font-fredoka text-gray-400 text-[10px]">
                                    {pars.reduce((a, b) => a + b, 0)}
                                </td>
                            </tr>

                            {/* HCP row */}
                            <tr className={`border-b border-gray-100 ${rowIdx++ % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                                <td className="p-1.5 font-fredoka font-normal text-gray-300 pl-2 text-[9px] uppercase tracking-wider italic">Hcp</td>
                                {hcps.map((h, i) => (
                                    <td key={i} className="p-0.5 text-center text-gray-300 text-[9px] italic font-fredoka">{h}</td>
                                ))}
                                <td className="p-1.5 text-center text-gray-300"></td>
                            </tr>

                            {/* Player Rows */}
                            {match.segmentType === 'scramble' ? (
                                <>
                                    <tr className={`border-b border-gray-100 ${rowIdx++ % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                                        <td className="p-1.5 font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs" style={{ color: '#E75480' }}>
                                            {match.redPlayers.map(p => p.playerName.split(' ')[0]).join(' / ')}
                                        </td>
                                        {match.redPlayers[0]?.scores.slice(start, end).map((score, i) => {
                                            const isWinner = holeWinnersChunk[i] === 'red';
                                            const isLoser = holeWinnersChunk[i] === 'blue';
                                            const strokes = match.redTeamStrokes ? match.redTeamStrokes[start + i] : 0;
                                            return (
                                                <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="red" isWinner={isWinner} isLoser={isLoser} />
                                            );
                                        })}
                                        <td className="p-1.5 text-center font-bold text-xs font-fredoka" style={{ color: '#E75480' }}>
                                            {match.redPlayers[0]?.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                        </td>
                                    </tr>

                                    <tr className={`border-b border-gray-100 ${rowIdx++ % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                                        <td className="p-1.5 font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs" style={{ color: '#4A90D9' }}>
                                            {match.bluePlayers.map(p => p.playerName.split(' ')[0]).join(' / ')}
                                        </td>
                                        {match.bluePlayers[0]?.scores.slice(start, end).map((score, i) => {
                                            const isWinner = holeWinnersChunk[i] === 'blue';
                                            const isLoser = holeWinnersChunk[i] === 'red';
                                            const strokes = match.blueTeamStrokes ? match.blueTeamStrokes[start + i] : 0;
                                            return (
                                                <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="blue" isWinner={isWinner} isLoser={isLoser} />
                                            );
                                        })}
                                        <td className="p-1.5 text-center font-bold text-xs font-fredoka" style={{ color: '#4A90D9' }}>
                                            {match.bluePlayers[0]?.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                    {match.redPlayers.map((player, pIdx) => (
                                        <tr key={`red-${pIdx}`} className={`border-b border-gray-100 ${(rowIdx + pIdx) % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                                            <td className="p-1.5 font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs" style={{ color: '#E75480' }}>
                                                {player.playerName.split(' ')[0]}
                                            </td>
                                            {player.scores.slice(start, end).map((score, i) => {
                                                const globalHoleIdx = start + i;
                                                const playingHandicap = Math.round(player.hcp * 0.8);
                                                const strokes = getStrokes(match.hcpValues, playingHandicap, globalHoleIdx);
                                                const net = score !== null ? score - strokes : 999;
                                                const isHoleWinner = holeWinnersChunk[i] === 'red';
                                                const isHoleLoser = holeWinnersChunk[i] === 'blue';

                                                let isWinningScore = false;
                                                if (isHoleWinner && score !== null) {
                                                    let bestRedNet = 999;
                                                    match.redPlayers.forEach(p => {
                                                        const s = p.scores[globalHoleIdx];
                                                        if (s !== null) {
                                                            const pH = Math.round(p.hcp * 0.8);
                                                            const st = getStrokes(match.hcpValues, pH, globalHoleIdx);
                                                            const n = s - st;
                                                            if (n < bestRedNet) bestRedNet = n;
                                                        }
                                                    });
                                                    if (net === bestRedNet) isWinningScore = true;
                                                }

                                                return (
                                                    <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="red" isWinner={isWinningScore} isLoser={isHoleLoser && score !== null} />
                                                );
                                            })}
                                            <td className="p-1.5 text-center font-bold text-xs font-fredoka" style={{ color: '#E75480' }}>
                                                {player.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Update rowIdx after red players */}
                                    {(() => { rowIdx += match.redPlayers.length; return null; })()}

                                    {match.bluePlayers.map((player, pIdx) => (
                                        <tr key={`blue-${pIdx}`} className={`border-b border-gray-100 ${(rowIdx + pIdx) % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}>
                                            <td className="p-1.5 font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs" style={{ color: '#4A90D9' }}>
                                                {player.playerName.split(' ')[0]}
                                            </td>
                                            {player.scores.slice(start, end).map((score, i) => {
                                                const globalHoleIdx = start + i;
                                                const playingHandicap = Math.round(player.hcp * 0.8);
                                                const strokes = getStrokes(match.hcpValues, playingHandicap, globalHoleIdx);
                                                const net = score !== null ? score - strokes : 999;
                                                const isHoleWinner = holeWinnersChunk[i] === 'blue';
                                                const isHoleLoser = holeWinnersChunk[i] === 'red';

                                                let isWinningScore = false;
                                                if (isHoleWinner && score !== null) {
                                                    let bestBlueNet = 999;
                                                    match.bluePlayers.forEach(p => {
                                                        const s = p.scores[globalHoleIdx];
                                                        if (s !== null) {
                                                            const pH = Math.round(p.hcp * 0.8);
                                                            const st = getStrokes(match.hcpValues, pH, globalHoleIdx);
                                                            const n = s - st;
                                                            if (n < bestBlueNet) bestBlueNet = n;
                                                        }
                                                    });
                                                    if (net === bestBlueNet) isWinningScore = true;
                                                }

                                                return (
                                                    <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="blue" isWinner={isWinningScore} isLoser={isHoleLoser && score !== null} />
                                                );
                                            })}
                                            <td className="p-1.5 text-center font-bold text-xs font-fredoka" style={{ color: '#4A90D9' }}>
                                                {player.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* Match progression row */}
                            <tr style={{ background: 'rgba(26,26,62,0.93)', backdropFilter: 'blur(4px)' }}>
                                <td className="p-1.5 font-fredoka font-medium pl-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>Partido</td>
                                {progression.map((status, i) => {
                                    const globalHoles = match.holeWinners.slice(0, start + i + 1);
                                    let scoreDiff = 0;
                                    globalHoles.forEach(winner => {
                                        if (winner === 'red') scoreDiff++;
                                        else if (winner === 'blue') scoreDiff--;
                                    });

                                    const isRedUp = scoreDiff > 0;
                                    const isBlueUp = scoreDiff < 0;

                                    let textColor = 'rgba(255,255,255,0.5)';
                                    if (isRedUp) textColor = '#E75480';
                                    else if (isBlueUp) textColor = '#4A90D9';

                                    // Dot indicator
                                    const holeWinner = match.holeWinners[start + i];
                                    const hasBeenPlayed = (start + i) < match.holeWinners.length;
                                    let dotColor = '#666';
                                    if (holeWinner === 'red') dotColor = '#E75480';
                                    else if (holeWinner === 'blue') dotColor = '#4A90D9';

                                    return (
                                        <td key={i} className="p-0.5 text-center">
                                            <span className="font-bangers text-[8px] tracking-tight block" style={{ color: textColor }}>
                                                {status === 'AS' || status === 'A/S' ? 'AS' : status.replace('DN', 'UP')}
                                            </span>
                                            {hasBeenPlayed && (
                                                <span
                                                    className="inline-block w-[5px] h-[5px] rounded-full mt-0.5"
                                                    style={{ backgroundColor: dotColor }}
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="p-1.5 text-center"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div>
            {showFront && renderHalfTable(0, 9, 'FRONT 9')}
            {showBack && match.parValues.length > 9 && renderHalfTable(9, 18, 'BACK 9')}

            {user?.appRole === 'admin' && (
                <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-400 font-fredoka">Controles Admin</span>
                    <Link
                        href={`/events/${eventId}/scores?flightId=${match.id}`}
                        className="text-xs font-bangers bevel-button px-4 py-2 rounded-lg hover:brightness-110 transition-colors shadow-sm"
                    >
                        Editar Scores
                    </Link>
                </div>
            )}
        </div>
    );
}
