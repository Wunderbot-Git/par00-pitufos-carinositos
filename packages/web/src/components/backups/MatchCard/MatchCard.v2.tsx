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

export function MatchCard({ match, onClick }: MatchCardProps) {
    const isRedWin = match.matchWinner === 'red';
    const isBlueWin = match.matchWinner === 'blue';
    const isAS = (match.matchStatus === 'A/S' || match.matchStatus === 'AS');
    const isFinal = match.status === 'completed';

    // LEFT PANEL (Red Team Area)
    // If Red wins: Red Gradient
    // Else (Blue wins or AS): White/Gray Gradient
    const leftBg = isRedWin
        ? 'bg-gradient-to-b from-[#ef4444] to-[#b91c1c]' // Red-500 to Red-700
        : (isAS ? 'bg-gradient-to-b from-white to-gray-200' : 'bg-gradient-to-b from-white to-gray-300 opacity-90');

    const leftText = isRedWin ? 'text-white drop-shadow-sm' : 'text-gray-900';

    // RIGHT PANEL (Blue Team Area)
    // If Blue wins: Blue Gradient
    // Else (Red wins or AS): White/Gray Gradient
    const rightBg = isBlueWin
        ? 'bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8]' // Blue-500 to Blue-700
        : (isAS ? 'bg-gradient-to-b from-white to-gray-200' : 'bg-gradient-to-b from-white to-gray-300 opacity-90');

    const rightText = isBlueWin ? 'text-white drop-shadow-sm' : 'text-gray-900';

    // STATUS TEXT LOGIC
    // Logic: 
    // - If Red Leading/Winning -> Show "X UP" on Left, Empty Right
    // - If Blue Leading/Winning -> Empty Left, Show "X UP" on Right
    // - If AS -> Show "A/S" on Left AND Right

    let leftStatus = '';
    let rightStatus = '';
    const displayStatus = match.matchStatus.replace('DN', 'UP');

    if (isAS) {
        leftStatus = 'A/S';
        rightStatus = 'A/S';
    } else if (match.matchWinner === 'blue') {
        rightStatus = displayStatus;
    } else if (match.matchWinner === 'red') {
        leftStatus = displayStatus;
    } else {
        // In Progress Logic
        // Status string usually "X UP" or "X DN" from Red perspective?
        if (match.matchStatus.includes('DN')) {
            // Blue leading (DN for Red)
            rightStatus = displayStatus;
        } else {
            // Red leading
            leftStatus = displayStatus;
        }
    }

    // SPINE CONTENT
    const spineContent = isFinal ? 'F' : (match.currentHole > 0 ? `${match.currentHole}` : '-');

    return (
        <div
            onClick={onClick}
            className={`flex items-stretch min-h-[72px] border-b border-gray-100 last:border-0 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* LEFT PANEL */}
            <div className={`flex-1 flex items-center justify-between px-3 py-2 ${leftBg} transition-colors`}>
                {/* Status Slot (Far Left) */}
                <div className={`w-12 text-center text-lg font-bold uppercase tracking-tight leading-none ${leftText}`}>
                    {leftStatus}
                </div>

                {/* Player Info (Aligned Right against spine) */}
                <div className="flex flex-col items-end text-right flex-1 pl-2">
                    {match.redPlayers.map((p, i) => (
                        <div key={i} className={`font-bold text-[15px] leading-tight truncate w-full ${leftText}`}>
                            {p.playerName}
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTRAL SPINE */}
            <div className="w-10 bg-gradient-to-b from-gray-800 to-black flex flex-col items-center justify-center shrink-0 z-10 shadow-2xl relative border-x border-gray-700/50">
                <span className="text-white font-bold text-lg drop-shadow-md">{spineContent}</span>
            </div>

            {/* RIGHT PANEL */}
            <div className={`flex-1 flex items-center justify-between px-3 py-2 ${rightBg} transition-colors`}>
                {/* Player Info (Aligned Left against spine) */}
                <div className="flex flex-col items-start text-left flex-1 pr-2">
                    {match.bluePlayers.map((p, i) => (
                        <div key={i} className={`font-bold text-[15px] leading-tight truncate w-full ${rightText}`}>
                            {p.playerName}
                        </div>
                    ))}
                </div>

                {/* Status Slot (Far Right) */}
                <div className={`w-12 text-center text-lg font-bold uppercase tracking-tight leading-none ${rightText}`}>
                    {rightStatus}
                </div>
            </div>
        </div>
    );
}
