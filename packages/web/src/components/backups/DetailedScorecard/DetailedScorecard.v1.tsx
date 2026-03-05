'use client';

import { Match, PlayerScore } from '@/hooks/useLeaderboard';

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
    if (score === null) return <td className="p-0 text-center text-gray-300">-</td>;

    // Removed background color logic as per specific request
    const bgColor = '';

    const textColor = team === 'red' ? 'text-team-red' : 'text-team-blue';
    const dots = Array(strokes).fill('●').join('');
    const winnerBg = isWinner ? (team === 'red' ? 'bg-red-50 border-team-red' : 'bg-blue-50 border-team-blue') : '';
    const winnerBorder = isWinner ? 'border rounded-full' : '';

    return (
        <td className={`p-0 text-center relative ${bgColor}`}>
            <div className={`inline-flex items-center justify-center w-5 h-5 text-sm ${winnerBorder} ${winnerBg} ${textColor}`}>
                <span className="font-bold leading-none">{score}</span>
            </div>
            {strokes > 0 && (
                <span className="absolute top-0 right-0 text-[6px] text-gray-400 tracking-tighter" style={{ lineHeight: '0.8', right: '2px', top: '1px' }}>{dots}</span>
            )}
        </td>
    );
}

function MatchStatusCell({ status }: { status: string }) {
    const isRedUp = status.includes('UP') && !status.includes('DN');
    // detailed check: if it has DN it is blue. If it has UP but starts with '-' (rare) it might be blue too, but standard is DN.
    const isBlueUp = status.includes('DN');
    const isAllSquare = status === 'AS' || status === 'A/S';

    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-600';

    if (isRedUp) {
        bgColor = 'bg-red-100';
        textColor = 'text-team-red';
    } else if (isBlueUp) {
        bgColor = 'bg-blue-100';
        textColor = 'text-team-blue';
    }

    // Display "UP" even if it is technically "DN" (user preference)
    const displayStatus = status.replace('DN', 'UP');

    return (
        <td className={`px-2 py-1 text-center text-xs font-bold ${bgColor} ${textColor}`}>
            {isAllSquare ? 'AS' : displayStatus}
        </td>
    );
}

export function DetailedScorecard({ match, onClose }: DetailedScorecardProps) {
    const frontNine = match.parValues.slice(0, 9);
    const backNine = match.parValues.slice(9, 18);
    const holeNumbers = Array.from({ length: 18 }, (_, i) => i + 1);

    // Visibility logic: Singles/Fourball show Front 9, Scramble shows Back 9
    const showFront = match.segmentType !== 'scramble';
    const showBack = match.segmentType === 'scramble';

    const renderHalfTable = (start: number, end: number, label: string) => {
        const holes = holeNumbers.slice(start, end);
        const pars = match.parValues.slice(start, end);
        const hcps = match.hcpValues.slice(start, end);
        const progression = match.matchProgression.slice(start, end);
        const holeWinnersChunk = match.holeWinners ? match.holeWinners.slice(start, end) : [];
        const isOut = label.includes('FRONT');

        // Header color logic
        let headerColor = 'bg-header-navy'; // Default/AS
        if (match.matchWinner === 'red') {
            headerColor = 'bg-team-red';
        } else if (match.matchWinner === 'blue') {
            headerColor = 'bg-team-blue';
        } else {
            // In progress or no winner set yet
            if (match.matchStatus.includes('DN')) {
                headerColor = 'bg-team-blue';
            } else if (match.matchStatus.includes('UP')) {
                headerColor = 'bg-team-red';
            }
        }

        return (
            <div className="mb-0">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className={`${headerColor} text-white`}>
                                <th className="p-1.5 text-left font-bold w-16 pl-2 text-xs">Hole</th>
                                {holes.map(h => (
                                    <th key={h} className="p-1 text-center font-bold text-xs w-[8%] min-w-[20px]">{h}</th>
                                ))}
                                <th className="p-1.5 text-center font-bold w-10 text-[10px] sm:text-xs">{isOut ? 'Out' : 'In'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Par row */}
                            <tr className="border-b last:border-0 border-gray-100">
                                <td className="p-1.5 font-bold text-gray-900 pl-2 text-[10px] uppercase tracking-wider">Par</td>
                                {pars.map((p, i) => (
                                    <td key={i} className="p-0.5 text-center text-gray-900 font-medium text-[10px]">{p}</td>
                                ))}
                                <td className="p-1.5 text-center font-bold text-gray-900 text-xs">
                                    {pars.reduce((a, b) => a + b, 0)}
                                </td>
                            </tr>

                            {/* HCP row */}
                            <tr className="border-b last:border-0 border-gray-100 bg-gray-50/50">
                                <td className="p-1.5 font-medium text-gray-400 pl-2 text-[10px] uppercase tracking-wider italic">Hcp</td>
                                {hcps.map((h, i) => (
                                    <td key={i} className="p-0.5 text-center text-gray-400 text-[10px] italic">{h}</td>
                                ))}
                                <td className="p-1.5 text-center text-gray-400"></td>
                            </tr>

                            {/* Red players */}
                            {match.redPlayers.map((player, pIdx) => (
                                <tr key={`red-${pIdx}`} className="border-b last:border-0 border-gray-100">
                                    <td className="p-1.5 text-team-red font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs">
                                        {player.playerName.split(' ')[0]}
                                    </td>
                                    {player.scores.slice(start, end).map((score, i) => {
                                        const globalHoleIdx = start + i;
                                        const strokes = getStrokes(match.hcpValues, player.hcp, globalHoleIdx);
                                        const net = score !== null ? score - strokes : 999;
                                        const isHoleWinner = holeWinnersChunk[i] === 'red';

                                        let isWinningScore = false;
                                        if (isHoleWinner && score !== null) {
                                            let bestRedNet = 999;
                                            match.redPlayers.forEach(p => {
                                                const s = p.scores[globalHoleIdx];
                                                if (s !== null) {
                                                    const st = getStrokes(match.hcpValues, p.hcp, globalHoleIdx);
                                                    const n = s - st;
                                                    if (n < bestRedNet) bestRedNet = n;
                                                }
                                            });
                                            if (net === bestRedNet) isWinningScore = true;
                                        }

                                        return (
                                            <ScoreCell
                                                key={i}
                                                score={score}
                                                par={pars[i]}
                                                strokes={strokes}
                                                team="red"
                                                isWinner={isWinningScore}
                                            />
                                        );
                                    })}
                                    <td className="p-1.5 text-center font-bold text-team-red text-xs">
                                        {player.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                    </td>
                                </tr>
                            ))}

                            {/* Blue players */}
                            {match.bluePlayers.map((player, pIdx) => (
                                <tr key={`blue-${pIdx}`} className="border-b last:border-0 border-gray-100">
                                    <td className="p-1.5 text-team-blue font-bold truncate max-w-[80px] sm:max-w-[100px] pl-2 text-xs">
                                        {player.playerName.split(' ')[0]}
                                    </td>
                                    {player.scores.slice(start, end).map((score, i) => {
                                        const globalHoleIdx = start + i;
                                        const strokes = getStrokes(match.hcpValues, player.hcp, globalHoleIdx);
                                        const net = score !== null ? score - strokes : 999;
                                        const isHoleWinner = holeWinnersChunk[i] === 'blue';

                                        let isWinningScore = false;
                                        if (isHoleWinner && score !== null) {
                                            let bestBlueNet = 999;
                                            match.bluePlayers.forEach(p => {
                                                const s = p.scores[globalHoleIdx];
                                                if (s !== null) {
                                                    const st = getStrokes(match.hcpValues, p.hcp, globalHoleIdx);
                                                    const n = s - st;
                                                    if (n < bestBlueNet) bestBlueNet = n;
                                                }
                                            });
                                            if (net === bestBlueNet) isWinningScore = true;
                                        }

                                        return (
                                            <ScoreCell
                                                key={i}
                                                score={score}
                                                par={pars[i]}
                                                strokes={strokes}
                                                team="blue"
                                                isWinner={isWinningScore}
                                            />
                                        );
                                    })}
                                    <td className="p-1.5 text-center font-bold text-team-blue text-xs">
                                        {player.scores.slice(start, end).filter(s => s !== null).reduce((a, b) => a! + b!, 0)}
                                    </td>
                                </tr>
                            ))}

                            {/* Match progression row */}
                            <tr className="bg-gray-50 border-t border-gray-200">
                                <td className="p-1.5 font-medium text-gray-500 pl-2 text-[10px]">Match</td>
                                {progression.map((status, i) => (
                                    <td key={i} className="p-0.5 text-center font-bold text-[9px] tracking-tight">
                                        <span className={status.includes('DN') ? 'text-team-blue' : (status.includes('UP') ? 'text-team-red' : 'text-gray-400')}>
                                            {status === 'AS' || status === 'A/S' ? 'AS' : status.replace('DN', 'UP')}
                                        </span>
                                    </td>
                                ))}
                                <td className="p-1.5 text-center font-bold text-gray-700"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white">
            {/* Note: Title bar removed as it's implied by context or handled by parent, keeping clean as per image */}
            {showFront && renderHalfTable(0, 9, 'FRONT 9')}
            {showBack && match.parValues.length > 9 && renderHalfTable(9, 18, 'BACK 9')}
        </div>
    );
}
