'use client';

import { useState } from 'react';
import { MatchHistory } from '@/hooks/useFlightHistory';

interface MatchAccordionProps {
    match: MatchHistory;
}

function MatchStatusBadge({ status, winner }: { status: string; winner: 'red' | 'blue' | 'halved' | null }) {
    let bgColor = 'bg-gray-500';
    if (winner === 'red') bgColor = 'bg-team-red';
    else if (winner === 'blue') bgColor = 'bg-team-blue';
    else if (winner === 'halved') bgColor = 'bg-gray-600';

    return (
        <span className={`${bgColor} text-white text-xs font-bold px-2 py-1 rounded`}>
            {status}
        </span>
    );
}

function PointsBadge({ points }: { points: { red: number; blue: number } }) {
    return (
        <div className="flex gap-1 text-xs font-bold">
            <span className="text-team-red">{points.red}</span>
            <span className="text-gray-400">:</span>
            <span className="text-team-blue">{points.blue}</span>
        </div>
    );
}

function HoleByHoleTable({ match }: { match: MatchHistory }) {
    const frontNine = match.holes.slice(0, 9);
    const backNine = match.holes.slice(9, 18);

    const renderHalfTable = (holes: typeof match.holes, label: string) => (
        <div className="mb-3">
            <h5 className="text-xs font-semibold text-gray-500 mb-1">{label}</h5>
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-2 py-1 text-left">Hole</th>
                            {holes.map(h => (
                                <th key={h.holeNumber} className="px-2 py-1 text-center">{h.holeNumber}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Red team scores */}
                        <tr className="border-b">
                            <td className="px-2 py-1 text-team-red font-medium">Red</td>
                            {holes.map(h => {
                                const score = h.redNet !== null ? h.redNet : '-';
                                const isWinner = h.holeWinner === 'red';
                                return (
                                    <td key={h.holeNumber} className={`px-2 py-1 text-center ${isWinner ? 'bg-red-100 font-bold text-team-red' : ''}`}>
                                        {score}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Blue team scores */}
                        <tr className="border-b">
                            <td className="px-2 py-1 text-team-blue font-medium">Blue</td>
                            {holes.map(h => {
                                const score = h.blueNet !== null ? h.blueNet : '-';
                                const isWinner = h.holeWinner === 'blue';
                                return (
                                    <td key={h.holeNumber} className={`px-2 py-1 text-center ${isWinner ? 'bg-blue-100 font-bold text-team-blue' : ''}`}>
                                        {score}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Match status progression */}
                        <tr className="bg-gray-50">
                            <td className="px-2 py-1 font-medium">Match</td>
                            {holes.map(h => {
                                const isEarlyFinish = match.earlyFinish === h.holeNumber;
                                return (
                                    <td
                                        key={h.holeNumber}
                                        className={`px-2 py-1 text-center text-xs ${isEarlyFinish ? 'bg-yellow-200 font-bold' : ''}`}
                                    >
                                        {h.matchStatusAfter}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-3 bg-gray-50">
            {frontNine.length > 0 && renderHalfTable(frontNine, 'FRONT 9')}
            {backNine.length > 0 && renderHalfTable(backNine, 'BACK 9')}

            {match.earlyFinish && (
                <div className="text-center text-xs text-gray-500 mt-2">
                    Match decided on hole {match.earlyFinish}
                </div>
            )}
        </div>
    );
}

export function MatchAccordion({ match }: MatchAccordionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const matchTypeLabel = {
        singles: 'Singles',
        fourball: 'Fourball',
        scramble: 'Scramble',
    }[match.matchType];

    return (
        <div className="bg-white border rounded-lg overflow-hidden mb-3">
            {/* Header - clickable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
                <div className="flex items-center gap-3">
                    <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    <span className="font-medium">{matchTypeLabel}</span>
                </div>

                <div className="flex items-center gap-4">
                    <PointsBadge points={match.points} />
                    <MatchStatusBadge status={match.matchStatus} winner={match.winner} />
                </div>
            </button>

            {/* Expanded content */}
            {isExpanded && <HoleByHoleTable match={match} />}
        </div>
    );
}
