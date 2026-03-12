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
    isWinner
}: {
    score: number | null;
    par: number;
    strokes: number;
    team: 'red' | 'blue';
    isWinner?: boolean;
}) {
    const textColor = team === 'red' ? 'text-team-red' : 'text-team-blue';
    const dots = Array(strokes).fill('●').join('');
    const winnerBg = isWinner ? (team === 'red' ? 'bg-red-50 ring-1 ring-gold-border' : 'bg-blue-50 ring-1 ring-gold-border') : '';
    const winnerBorder = isWinner ? 'rounded-full' : '';

    return (
        <td className="p-0 text-center relative">
            {score !== null ? (
                <div className={`inline-flex items-center justify-center w-5 h-5 text-sm ${winnerBorder} ${winnerBg} ${textColor}`}>
                    <span className="font-bold leading-none font-fredoka">{score}</span>
                </div>
            ) : (
                <span className="text-gold-border/30">-</span>
            )}
            {strokes > 0 && (
                <span className="absolute top-0 right-0 text-[6px] text-gold-border/60 tracking-tighter" style={{ lineHeight: '0.8', right: '2px', top: '1px' }}>{dots}</span>
            )}
        </td>
    );
}

function MatchStatusCell({ status }: { status: string }) {
    const isRedUp = status.includes('UP') && !status.includes('DN');
    const isBlueUp = status.includes('DN');
    const isAllSquare = status === 'AS' || status === 'A/S';

    let bgColor = 'bg-forest-mid/30';
    let textColor = 'text-cream';

    if (isRedUp) {
        bgColor = 'bg-team-red/20';
        textColor = 'text-team-red';
    } else if (isBlueUp) {
        bgColor = 'bg-team-blue/20';
        textColor = 'text-team-blue';
    }

    const displayStatus = status.replace('DN', 'UP');

    return (
        <td className={`px-2 py-1 text-center text-xs font-bangers ${bgColor} ${textColor}`}>
            {isAllSquare ? 'AS' : displayStatus}
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

        let headerColor = 'bg-forest-deep';
        if (match.matchWinner === 'red') {
            headerColor = 'bg-team-red';
        } else if (match.matchWinner === 'blue') {
            headerColor = 'bg-team-blue';
        } else {
            if (match.matchStatus.includes('DN')) {
                headerColor = 'bg-team-blue';
            } else if (match.matchStatus.includes('UP')) {
                headerColor = 'bg-team-red';
            }
        }

        return (
            <div className="mb-0">
                <div className="overflow-x-auto rounded-lg gold-border">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className={`${headerColor} text-white`}>
                                <th className="p-1.5 text-left font-bangers w-16 pl-2 text-xs">Hoyo</th>
                                {holes.map(h => (
                                    <th key={h} className="p-1 text-center font-bangers text-xs w-[8%] min-w-[20px]">{h}</th>
                                ))}
                                <th className="p-1.5 text-center font-bangers w-10 text-[10px] sm:text-xs">{isOut ? 'Out' : 'In'}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-cream">
                            {/* Par row */}
                            <tr className="border-b last:border-0 border-gold-border/20">
                                <td className="p-1.5 font-bangers text-forest-deep pl-2 text-[10px] uppercase tracking-wider">Par</td>
                                {pars.map((p, i) => (
                                    <td key={i} className="p-0.5 text-center text-forest-deep font-fredoka font-medium text-[10px]">{p}</td>
                                ))}
                                <td className="p-1.5 text-center font-bangers text-forest-deep text-xs">
                                    {pars.reduce((a, b) => a + b, 0)}
                                </td>
                            </tr>

                            {/* HCP row */}
                            <tr className="border-b last:border-0 border-gold-border/20 bg-gold-light/10">
                                <td className="p-1.5 font-fredoka font-medium text-gold-border pl-2 text-[10px] uppercase tracking-wider italic">Hcp</td>
                                {hcps.map((h, i) => (
                                    <td key={i} className="p-0.5 text-center text-gold-border/70 text-[10px] italic font-fredoka">{h}</td>
                                ))}
                                <td className="p-1.5 text-center text-gold-border/70"></td>
                            </tr>

                            {/* Player Rows */}
                            {match.segmentType === 'scramble' ? (
                                <>
                                    <tr className="border-b last:border-0 border-gold-border/20">
                                        <td className="p-1.5 text-team-red font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs">
                                            {match.redPlayers.map(p => p.playerName.split(' ')[0]).join(' / ')}
                                        </td>
                                        {match.redPlayers[0]?.scores.slice(start, end).map((score, i) => {
                                            const isWinner = holeWinnersChunk[i] === 'red';
                                            const strokes = match.redTeamStrokes ? match.redTeamStrokes[start + i] : 0;
                                            return (
                                                <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="red" isWinner={isWinner} />
                                            );
                                        })}
                                        <td className="p-1.5 text-center font-bold text-team-red text-xs font-fredoka">
                                            {match.redPlayers[0]?.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                        </td>
                                    </tr>

                                    <tr className="border-b last:border-0 border-gold-border/20">
                                        <td className="p-1.5 text-team-blue font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs">
                                            {match.bluePlayers.map(p => p.playerName.split(' ')[0]).join(' / ')}
                                        </td>
                                        {match.bluePlayers[0]?.scores.slice(start, end).map((score, i) => {
                                            const isWinner = holeWinnersChunk[i] === 'blue';
                                            const strokes = match.blueTeamStrokes ? match.blueTeamStrokes[start + i] : 0;
                                            return (
                                                <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="blue" isWinner={isWinner} />
                                            );
                                        })}
                                        <td className="p-1.5 text-center font-bold text-team-blue text-xs font-fredoka">
                                            {match.bluePlayers[0]?.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                    {match.redPlayers.map((player, pIdx) => (
                                        <tr key={`red-${pIdx}`} className="border-b last:border-0 border-gold-border/20">
                                            <td className="p-1.5 text-team-red font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs">
                                                {player.playerName.split(' ')[0]}
                                            </td>
                                            {player.scores.slice(start, end).map((score, i) => {
                                                const globalHoleIdx = start + i;
                                                const playingHandicap = Math.round(player.hcp * 0.8);
                                                const strokes = getStrokes(match.hcpValues, playingHandicap, globalHoleIdx);
                                                const net = score !== null ? score - strokes : 999;
                                                const isHoleWinner = holeWinnersChunk[i] === 'red';

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
                                                    <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="red" isWinner={isWinningScore} />
                                                );
                                            })}
                                            <td className="p-1.5 text-center font-bold text-team-red text-xs font-fredoka">
                                                {player.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                            </td>
                                        </tr>
                                    ))}

                                    {match.bluePlayers.map((player, pIdx) => (
                                        <tr key={`blue-${pIdx}`} className="border-b last:border-0 border-gold-border/20">
                                            <td className="p-1.5 text-team-blue font-fredoka font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs">
                                                {player.playerName.split(' ')[0]}
                                            </td>
                                            {player.scores.slice(start, end).map((score, i) => {
                                                const globalHoleIdx = start + i;
                                                const playingHandicap = Math.round(player.hcp * 0.8);
                                                const strokes = getStrokes(match.hcpValues, playingHandicap, globalHoleIdx);
                                                const net = score !== null ? score - strokes : 999;
                                                const isHoleWinner = holeWinnersChunk[i] === 'blue';

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
                                                    <ScoreCell key={i} score={score} par={pars[i]} strokes={strokes} team="blue" isWinner={isWinningScore} />
                                                );
                                            })}
                                            <td className="p-1.5 text-center font-bold text-team-blue text-xs font-fredoka">
                                                {player.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* Match progression row */}
                            <tr className="bg-forest-mid/20 border-t border-gold-border/30">
                                <td className="p-1.5 font-fredoka font-medium text-forest-deep pl-2 text-[10px]">Partido</td>
                                {progression.map((status, i) => {
                                    const globalHoles = match.holeWinners.slice(0, start + i + 1);
                                    let scoreDiff = 0;
                                    globalHoles.forEach(winner => {
                                        if (winner === 'red') scoreDiff++;
                                        else if (winner === 'blue') scoreDiff--;
                                    });

                                    const isRedUp = scoreDiff > 0;
                                    const isBlueUp = scoreDiff < 0;

                                    let textColor = 'text-forest-deep/50';
                                    if (isRedUp) textColor = 'text-team-red';
                                    else if (isBlueUp) textColor = 'text-team-blue';

                                    return (
                                        <td key={i} className="p-0.5 text-center font-bangers text-[9px] tracking-tight">
                                            <span className={textColor}>
                                                {status === 'AS' || status === 'A/S' ? 'AS' : status.replace('DN', 'UP')}
                                            </span>
                                        </td>
                                    );
                                })}
                                <td className="p-1.5 text-center font-bold text-forest-deep"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-cream">
            {showFront && renderHalfTable(0, 9, 'FRONT 9')}
            {showBack && match.parValues.length > 9 && renderHalfTable(9, 18, 'BACK 9')}

            {user?.appRole === 'admin' && (
                <div className="mt-4 flex justify-between items-center border-t border-gold-border/20 pt-3">
                    <span className="text-xs text-gold-border/60 font-fredoka">Controles Admin</span>
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
