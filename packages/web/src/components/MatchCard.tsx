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

    // CHEVRON LOGIC
    // Red Leading/Win: Arrow points Right (->) indicating push towards blue? 
    // Actually, usually arrow points to the leading team or indicates "To Go"? 
    // Let's stick to the visual: 
    // - Red Lead: Arrow shape pointing RIGHT (Standard Pentagon pointing right)
    // - Blue Lead: Arrow shape pointing LEFT (Standard Pentagon pointing left)
    // - AS: Rectangle or slight Hexagon? Let's use Rectangle for stability.

    // Center Box Logic
    let centerBg = 'bg-gray-800';
    let statusTextColor = 'text-white';

    // Status Text
    let statusTop: React.ReactNode = '';
    let statusBottom = '';

    const displayStatus = match.matchStatus.replace('DN', 'UP');
    const isNotStarted = match.status === 'not_started';

    if (isNotStarted) {
        centerBg = 'bg-gray-200';
        statusTextColor = 'text-gray-500';
        statusTop = (
            <div className="flex flex-col items-center leading-none">
                <span className="text-sm font-black italic tracking-tighter">Sin</span>
                <span className="text-sm font-black italic tracking-tighter">Iniciar</span>
            </div>
        );
    } else if (isAS) {
        centerBg = 'bg-gray-700';
        statusTop = 'A/S';
    } else if (match.matchWinner === 'red') {
        // RED WIN
        centerBg = 'bg-[#ef4444]'; // Red-400
        statusTop = displayStatus;
    } else if (match.matchWinner === 'blue') {
        // BLUE WIN
        centerBg = 'bg-[#3b82f6]'; // Blue-400
        statusTop = displayStatus;
    } else {
        // IN PROGRESS
        if (match.matchStatus.includes('DN')) {
            // Red DN -> Blue Leading
            centerBg = 'bg-[#3b82f6]';
            statusTop = displayStatus;
        } else {
            // Red UP (or others) -> Red Leading
            centerBg = 'bg-[#ef4444]';
            statusTop = displayStatus;
        }
    }

    // Bottom Text
    const totalHoles = 9;
    const holesPlayed = match.currentHole;
    const holesRemaining = totalHoles - holesPlayed;

    let lead = 0;
    if (match.matchStatus.includes('UP') || match.matchStatus.includes('DN')) {
        const parts = match.matchStatus.split(' ');
        lead = parseInt(parts[0]);
    }

    if (isFinal) {
        statusBottom = 'FINAL';
    } else if (match.currentHole > 0) {
        if (lead > 0 && lead === holesRemaining) {
            statusBottom = 'DORMIE';
        } else {
            statusBottom = `HOYO ${match.currentHole}`;
        }
    } else if (!isNotStarted) {
        statusBottom = '-';
    }

    // Player Text Colors (Always colored on white bg, unless Final)
    const redText = 'text-team-red';
    const blueText = 'text-team-blue';

    let leftPanelClass = 'bg-white';
    let leftTextClass = redText;
    let leftLabelClass = 'text-gray-400';

    let rightPanelClass = 'bg-white';
    let rightTextClass = blueText;
    let rightLabelClass = 'text-gray-400';

    if (isFinal) {
        if (match.matchWinner === 'red') {
            leftPanelClass = 'bg-team-red';
            leftTextClass = 'text-white';
            leftLabelClass = 'text-white/75';
        } else if (match.matchWinner === 'blue') {
            rightPanelClass = 'bg-team-blue';
            rightTextClass = 'text-white';
            rightLabelClass = 'text-white/75';
        }
    }

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl mb-3 grid grid-cols-[1fr_100px_1fr] h-[80px] relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] mx-1 ${onClick ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow' : ''}`}
        >
            {/* MATCH FORMAT BADGE */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isNotStarted ? 'text-gray-500' : 'text-gray-300'}`}>{
                    match.segmentType === 'singles1' ? 'Individual 1' :
                    match.segmentType === 'singles2' ? 'Individual 2' :
                    match.segmentType === 'fourball' ? 'Mejor Bola' :
                    match.segmentType
                }</span>
            </div>

            {/* LEFT PANEL (RED) */}
            <div className={`flex flex-col justify-center items-start px-4 z-0 ${leftPanelClass} transition-colors duration-300 min-w-0`}>
                {match.redPlayers.map((p, i) => (
                    <div key={i} className={`font-bold text-[13px] leading-tight w-full ${leftTextClass} py-0.5`}>
                        {p.playerName.replace(/-$/, '').trim()} <span className="opacity-60 text-[10px] font-normal">({p.hcp})</span>
                    </div>
                ))}
            </div>

            {/* CENTER STATUS */}
            <div className="relative flex items-center justify-center">
                <div
                    className={`${centerBg} w-full h-full flex flex-col items-center justify-center ${statusTextColor} z-1 transition-colors duration-300 pt-2`}
                >
                    <div className="text-xl font-black italic tracking-tighter leading-none mb-0.5" style={{ textShadow: isNotStarted ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {statusTop}
                    </div>
                    {statusBottom && (
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-90 leading-none">
                            {statusBottom}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL (BLUE) */}
            <div className={`flex flex-col justify-center items-end px-4 z-0 ${rightPanelClass} transition-colors duration-300 min-w-0`}>
                {match.bluePlayers.map((p, i) => (
                    <div key={i} className={`font-bold text-[13px] leading-tight w-full text-right ${rightTextClass} py-0.5`}>
                        <span className="opacity-60 text-[10px] font-normal">({p.hcp})</span> {p.playerName.replace(/-$/, '').trim()}
                    </div>
                ))}
            </div>
        </div>
    );
}
