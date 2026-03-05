'use client';

import { Match } from '@/hooks/useLeaderboard';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}


function getOrdinal(n: number): string {
    if (n === 0) return '';
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function StatusBadge({ status, winner, currentHole, isCompleted, inverted }: { status: string; winner: 'red' | 'blue' | null; currentHole: number; isCompleted: boolean; inverted?: boolean }) {
    let bgColor = 'bg-[#1e293b]'; // Slate-800 for Neutral/AS
    let textColor = 'text-white';
    let clipPath = 'none';
    const isAS = status === 'A/S' || status === 'AS';

    if (isAS) {
        bgColor = 'bg-[#1e293b]';
    } else if (winner === 'red') {
        bgColor = inverted ? 'bg-white' : 'bg-team-red';
        textColor = inverted ? 'text-team-red' : 'text-white';
        // Arrow pointing Left
        clipPath = 'polygon(0 50%, 15% 0, 100% 0, 100% 100%, 15% 100%)';
    } else if (winner === 'blue') {
        bgColor = inverted ? 'bg-white' : 'bg-team-blue';
        textColor = inverted ? 'text-team-blue' : 'text-white';
        // Arrow pointing Right
        clipPath = 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)';
    }

    const displayStatus = status.replace('DN', 'UP'); // Ensure we always show UP

    const ordinalHole = (!isCompleted && currentHole > 0) ? getOrdinal(currentHole).toUpperCase() : '';

    return (
        <div
            className={`${bgColor} ${textColor} flex flex-col items-center justify-center w-[85px] self-stretch flex-shrink-0 relative z-10 transition-all duration-200`}
            style={{ clipPath }}
        >
            <div className="text-xl font-bold leading-none tracking-tight shadow-sm">
                {isAS ? 'A/S' : displayStatus}
            </div>
            {isCompleted ? (
                <div className={`mt-1 px-1.5 py-[2px] rounded-[3px] text-[9px] font-black tracking-widest uppercase leading-none shadow-sm ${inverted ? 'bg-gray-900 text-white' : 'bg-black/20 text-white'}`}>
                    FINAL
                </div>
            ) : (
                ordinalHole && (
                    <div className="text-[10px] font-semibold opacity-90 mt-0.5 tracking-wider">
                        {ordinalHole}
                    </div>
                )
            )}
        </div>
    );
}

function PlayerGroup({ players, team, inverted }: { players: { playerName: string; hcp: number }[]; team: 'red' | 'blue'; inverted?: boolean }) {
    const align = team === 'red' ? 'text-left items-start' : 'text-right items-end';

    let textColor = team === 'red' ? 'text-team-red' : 'text-team-blue';
    let hcpTextColor = 'text-gray-400';
    let hcpLabelColor = 'text-gray-500';

    if (inverted) {
        textColor = 'text-white';
        hcpTextColor = 'text-white/80';
        hcpLabelColor = 'text-white/60';
    }

    const hcps = players.map(p => p.hcp).join('  /  ');

    return (
        <div className={`flex flex-col justify-center ${align} flex-1 py-1 px-4 min-w-0`}>
            {players.map((p, i) => (
                <div key={i} className={`font-bold text-[15px] leading-snug truncate w-full ${textColor}`}>
                    {p.playerName}
                </div>
            ))}
            <div className={`text-[11px] ${hcpTextColor} mt-1 font-medium tracking-wide`}>
                <span className={`${hcpLabelColor} mr-1`}>HCP</span>{hcps}
            </div>
        </div>
    );
}

export function MatchCard({ match, onClick }: MatchCardProps) {
    const isFinal = match.status === 'completed';
    const isRedWin = isFinal && match.matchWinner === 'red';
    const isBlueWin = isFinal && match.matchWinner === 'blue';
    const inverted = isRedWin || isBlueWin;

    let containerClass = "bg-white border-b border-gray-100 last:border-0";
    if (isRedWin) {
        containerClass = "bg-team-red border-b border-white/10";
    } else if (isBlueWin) {
        containerClass = "bg-team-blue border-b border-white/10";
    }

    if (onClick) {
        if (!inverted) containerClass += " hover:bg-gray-50 transition-colors";
        else containerClass += " opacity-100 hover:opacity-95 transition-opacity";
    }

    return (
        <div
            onClick={onClick}
            className={`${containerClass} min-h-[80px] flex items-stretch overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
        >
            <PlayerGroup players={match.redPlayers} team="red" inverted={inverted} />

            <StatusBadge
                status={match.matchStatus}
                winner={match.matchWinner}
                currentHole={match.currentHole}
                isCompleted={isFinal}
                inverted={inverted}
            />

            <PlayerGroup players={match.bluePlayers} team="blue" inverted={inverted} />
        </div>
    );
}
