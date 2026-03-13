'use client';

import { Match } from '@/hooks/useLeaderboard';

interface MatchCardProps {
    match: Match;
    onClick?: () => void;
}

export function MatchCard({ match, onClick }: MatchCardProps) {
    const isRedWin = match.matchWinner === 'red';
    const isBlueWin = match.matchWinner === 'blue';
    const isAS = (match.matchStatus === 'A/S' || match.matchStatus === 'AS');
    const isFinal = match.status === 'completed';
    const isNotStarted = match.status === 'not_started';

    const displayStatus = match.matchStatus.replace('DN', 'UP');

    // ── CENTER BADGE ─────────────────────────────────────────────────────────
    let statusTop: React.ReactNode = '';
    let statusBottom = '';

    // Who is "winning" (leading) right now?
    const redIsWinning = isRedWin ||
        (match.matchStatus.includes('UP') && !isBlueWin);
    const blueIsWinner = isBlueWin;

    let centerGradient = 'bg-gradient-to-b from-[#349be1] to-[#12609b]'; // default blue
    if (isNotStarted) centerGradient = 'bg-[#2a2a5e]';
    else if (isAS) centerGradient = 'bg-gradient-to-b from-[#8f9ca6] to-[#596673]';
    else if (redIsWinning) centerGradient = 'bg-gradient-to-b from-[#e33731] to-[#b81d18]';

    if (isNotStarted) {
        statusTop = (
            <div className="flex flex-col items-center leading-none">
                <span className="text-sm font-bangers italic tracking-tighter">Sin</span>
                <span className="text-sm font-bangers italic tracking-tighter">Iniciar</span>
            </div>
        );
    } else if (isAS) {
        statusTop = 'A/S';
    } else {
        statusTop = displayStatus;
    }

    const totalHoles = 9;
    const holesPlayed = match.currentHole;
    const holesRemaining = totalHoles - holesPlayed;
    let lead = 0;
    if (match.matchStatus.includes('UP') || match.matchStatus.includes('DN')) {
        lead = parseInt(match.matchStatus.split(' ')[0]);
    }

    if (isFinal) {
        statusBottom = 'FINAL';
    } else if (match.currentHole > 0) {
        statusBottom = (lead > 0 && lead === holesRemaining) ? 'DORMIE' : `HOYO ${match.currentHole}`;
    } else if (!isNotStarted) {
        statusBottom = '-';
    }

    // ── PANEL BACKGROUND / BORDERS ───────────────────────────────────────────
    // Blue team = Pitufos (left panel), Red team = Cariñositos (right panel)
    const GOLD  = '#F0C850';
    const PINK  = '#e0548a';
    const MUTED = '#4a4a6a';

    // Winner/loser panel display
    let leftDim  = isFinal && isRedWin;
    let rightDim = isFinal && isBlueWin;

    // Left (blue/Pitufos) border: blue team color, muted when losing
    const leftBorderColor  = isFinal && isRedWin ? MUTED : '#4A90D9';
    // Right (red/Cariñositos) border: pink always, muted when losing
    const rightBorderColor = isFinal && isBlueWin ? MUTED : PINK;

    // Panel backgrounds — medium navy, lighter than filter bar
    const activePanelBg  = '#2a3a5e';
    const winnerBg       = '#1e2a4a';
    const notStartedBg   = '#1a2240';

    const leftBg  = isNotStarted ? notStartedBg : (isFinal && isBlueWin ? winnerBg : activePanelBg);
    const rightBg = isNotStarted ? notStartedBg : (isFinal && isRedWin  ? winnerBg : activePanelBg);


    const normalizeName = (name: string) => {
        return name
            .split(' ')[0]
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '');
    };

    return (
        <div
            onClick={onClick}
            className={`w-full rounded-2xl overflow-hidden transition-transform mb-2 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
            style={{
                background: isNotStarted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.70)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.85)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                borderRadius: 16,
            }}
        >
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch min-h-[140px]">

                {/* ── LEFT PANEL (BLUE / PITUFOS) ─────────────────────────── */}
                <div
                    className="flex flex-col items-center justify-center py-0.5 px-2 relative"
                    style={{
                        background: isNotStarted ? 'transparent' : 'rgba(74,144,217,0.08)',
                        borderLeft: `3px solid ${leftBorderColor}`,
                        opacity: leftDim ? 0.55 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    {/* Avatar(s) */}
                    <div className={`flex gap-1 justify-center flex-shrink-0 ${match.bluePlayers.length > 1 ? 'flex-row' : ''}`}>
                        {match.bluePlayers.map((p, i) => {
                            const avatarName = normalizeName(p.playerName);
                            const size = match.bluePlayers.length > 1 ? 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px]' : 'w-[110px] h-[110px] sm:w-[120px] sm:h-[120px]';
                            return (
                                <div key={i} className={`${size} flex-shrink-0 relative`}>
                                    <img
                                        src={isFinal && isBlueWin ? `/images/${avatarName}-winner.webp` : `/images/${avatarName}.webp`}
                                        alt={p.playerName}
                                        loading="lazy"
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            if (img.src.includes('-winner.webp')) {
                                                img.src = `/images/${avatarName}.webp`;
                                            } else {
                                                img.src = '/images/Gemini_Generated_Image_jonki9jonki9jonk__1_-removebg-preview.webp';
                                            }
                                        }}
                                        className={`w-full h-full object-cover drop-shadow-md ${isNotStarted ? 'grayscale opacity-40' : ''}`}
                                        style={{ borderRadius: '50%' }}
                                    />
                                    {isFinal && isBlueWin && (
                                        <img src="/images/winner-star2.webp" alt="Winner" loading="lazy" className="absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 16px rgba(255,200,0,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Player names */}
                    <div className="flex flex-col items-center w-full">
                        {match.bluePlayers.map((p, i) => (
                            <div
                                key={i}
                                className="font-bangers text-[14px] sm:text-[16px] leading-tight text-center tracking-wider line-clamp-1 break-all w-full uppercase"
                                style={{ color: isNotStarted ? '#aaa' : '#4A90D9', fontWeight: 700 }}
                            >
                                {p.playerName.split(' ')[0]}
                                <span className="text-[11px] ml-0.5" style={{ color: isNotStarted ? '#bbb' : '#666' }}>({p.hcp})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CENTER STATUS BADGE ──────────────────────────────────── */}
                <div className="relative flex items-center justify-center px-2 py-2 min-w-[130px] sm:min-w-[150px]">
                    <div
                        className={`relative w-full py-2.5 rounded-2xl border-[3px] border-[#1e293b] flex flex-col items-center justify-center overflow-hidden ${centerGradient} ${isNotStarted ? 'shadow-none' : 'shadow-[0_5px_0_#1e293b]'}`}
                    >
                        {/* Top gloss */}
                        {!isNotStarted && (
                            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/25 to-white/5 rounded-t-xl pointer-events-none z-0" />
                        )}

                        {/* Live indicator star */}
                        {!isNotStarted && !isFinal && (
                            <div className="absolute -top-[12px] -right-[12px] z-30">
                                <div className="relative flex items-center justify-center w-7 h-7">
                                    <svg viewBox="0 0 100 100" className="w-full h-full text-[#ed5f59]" fill="currentColor" style={{ filter: 'drop-shadow(0 2px 0 #1e293b)' }}>
                                        <polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" stroke="#1e293b" strokeWidth="8" strokeLinejoin="round" />
                                    </svg>
                                    <span className="absolute text-white font-bangers text-[11px]" style={{ textShadow: '1px 1px 0 #1e293b,-1px -1px 0 #1e293b' }}>!</span>
                                </div>
                            </div>
                        )}

                        {/* SIN INICIAR pill */}
                        {isNotStarted ? (
                            <div className="px-3 py-1.5 rounded-full border border-[#505078] text-[#9999bb] font-bangers text-[11px] tracking-wider uppercase text-center">
                                Sin<br />Iniciar
                            </div>
                        ) : (
                            <>
                                {/* Main score text */}
                                <div className="relative z-20 flex justify-center w-full" style={{ filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.5))' }}>
                                    <span className="text-[32px] sm:text-[38px] font-bangers tracking-wide leading-[0.9] absolute left-0 right-0 text-center text-[#1e293b]" style={{ WebkitTextStroke: '5px #1e293b' }}>
                                        {typeof statusTop === 'string' ? statusTop.replace('UP', ' UP') : statusTop}
                                    </span>
                                    <span className="text-[32px] sm:text-[38px] font-bangers tracking-wide leading-[0.9] relative text-white text-center">
                                        {typeof statusTop === 'string' ? statusTop.replace('UP', ' UP') : statusTop}
                                    </span>
                                </div>

                                {statusBottom && (
                                    <div className="relative z-20 mt-0.5 mb-0.5 flex justify-center w-full uppercase" style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.6))' }}>
                                        <span className="text-[13px] sm:text-[15px] font-bangers tracking-widest leading-none absolute left-0 right-0 text-center text-[#1e293b]" style={{ WebkitTextStroke: '3px #1e293b' }}>
                                            {statusBottom}
                                        </span>
                                        <span className="text-[13px] sm:text-[15px] font-bangers tracking-widest leading-none relative text-white text-center">
                                            {statusBottom}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL (RED / CARIÑOSITOS) ─────────────────────── */}
                <div
                    className="flex flex-col items-center justify-center py-0.5 px-2 relative"
                    style={{
                        background: isNotStarted ? 'transparent' : 'rgba(231,84,128,0.08)',
                        borderRight: `3px solid ${rightBorderColor}`,
                        opacity: rightDim ? 0.55 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    {/* Avatar(s) */}
                    <div className={`flex gap-1 justify-center flex-shrink-0 ${match.redPlayers.length > 1 ? 'flex-row' : ''}`}>
                        {match.redPlayers.map((p, i) => {
                            const avatarName = normalizeName(p.playerName);
                            const size = match.redPlayers.length > 1 ? 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px]' : 'w-[110px] h-[110px] sm:w-[120px] sm:h-[120px]';
                            return (
                                <div key={i} className={`${size} flex-shrink-0 relative`}>
                                    <img
                                        src={isFinal && isRedWin ? `/images/${avatarName}-winner.webp` : `/images/${avatarName}.webp`}
                                        alt={p.playerName}
                                        loading="lazy"
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            if (img.src.includes('-winner.webp')) {
                                                img.src = `/images/${avatarName}.webp`;
                                            } else {
                                                img.src = '/images/Gemini_Generated_Image_exn7bfexn7bfexn7-removebg-preview.webp';
                                            }
                                        }}
                                        className={`w-full h-full object-cover drop-shadow-md ${isNotStarted ? 'grayscale opacity-40' : ''}`}
                                        style={{ borderRadius: '50%' }}
                                    />
                                    {isFinal && isRedWin && (
                                        <img src="/images/winner-star2.webp" alt="Winner" loading="lazy" className="absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 z-10" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 16px rgba(255,200,0,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Player names */}
                    <div className="flex flex-col items-center w-full">
                        {match.redPlayers.map((p, i) => (
                            <div
                                key={i}
                                className="font-bangers text-[14px] sm:text-[16px] leading-tight text-center tracking-wider line-clamp-1 break-all w-full uppercase"
                                style={{ color: isNotStarted ? '#aaa' : '#E75480', fontWeight: 700 }}
                            >
                                {p.playerName.split(' ')[0]}
                                <span className="text-[11px] ml-0.5" style={{ color: isNotStarted ? '#bbb' : '#666' }}>({p.hcp})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
