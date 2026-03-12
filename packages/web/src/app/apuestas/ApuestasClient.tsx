'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useMyEvents } from '@/hooks/useEvents';
import { usePersonalStats, useTournamentSettlement, useGeneralBetPools, useMyGeneralBets } from '@/hooks/useBetting';
import { useLeaderboard, Match } from '@/hooks/useLeaderboard';
import { DashboardBanner } from '@/components/betting/DashboardBanner';
import { MatchBettingCard } from '@/components/betting/MatchBettingCard';
import { BettingDetailSheet } from '@/components/betting/BettingDetailSheet';
import { GeneralBetsSection } from '@/components/betting/GeneralBetsSection';
import { formatCurrency } from '@/lib/currency';

export default function ApuestasClient() {
    const { user } = useAuth();
    const { events, isLoading: eventsLoading } = useMyEvents();

    const activeEvent = useMemo(() => {
        if (!events || events.length === 0) return null;
        return events.find(e => e.status === 'live') || events[0];
    }, [events]);

    const eventId = activeEvent?.id || '';

    const { data: stats, isLoading: statsLoading } = usePersonalStats(eventId);
    const { data: leaderboard, isLoading: matchesLoading } = useLeaderboard(eventId);
    const { data: settlement, isLoading: settlementLoading } = useTournamentSettlement(eventId);
    const { data: generalPools, isLoading: generalPoolsLoading, refetch: refetchPools } = useGeneralBetPools(eventId);
    const { data: myGeneralBets, isLoading: myGeneralBetsLoading, refetch: refetchMyBets } = useMyGeneralBets(eventId);

    const [activeTab, setActiveTab] = useState<'general' | 'overview' | 'leaderboard' | 'settlement'>('general');
    const [betFilter, setBetFilter] = useState<'all' | 'placed' | 'pending'>('all');
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    const isLoading = eventsLoading || (!!eventId && statsLoading) || (!!eventId && matchesLoading) || (!!eventId && settlementLoading);

    if (!user) {
        return <div className="p-4 text-center text-cream/60 font-fredoka">Por favor, inicia sesión para acceder a las apuestas.</div>;
    }

    if (!activeEvent && !isLoading) {
        return <div className="p-4 text-center text-cream/60 font-fredoka">No hay eventos activos para apostar.</div>;
    }

    return (
        <div className="flex flex-col min-h-screen pb-20">
            {/* Header */}
            <header className="bg-forest-deep text-white flex-shrink-0 z-50 shadow-md border-b-2 border-gold-border/50">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-white rounded-full p-0.5 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden thick-border">
                            <Image
                                src="/assets/pitufos-vs-carinositos-logo.png"
                                alt="Event Logo"
                                fill
                                className="object-contain p-0.5"
                                priority
                            />
                        </div>
                        <div className="flex flex-col text-left">
                            <h1 className="text-[13px] font-bangers uppercase tracking-widest metallic-text leading-tight">
                                {activeEvent?.name || 'RYDER CUP'}
                            </h1>
                            <span className="text-[9px] font-bangers text-gold-light/70 uppercase tracking-widest mt-0.5">
                                Apuestas
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Banner */}
            <DashboardBanner stats={stats || undefined} isLoading={isLoading} />

            {/* Tab Navigation */}
            <div className="flex border-b-2 border-gold-border/30 mt-4 px-2 bg-forest-deep/50">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-3 text-sm font-bangers border-b-2 transition-colors ${activeTab === 'general'
                        ? 'border-gold-border text-gold-light'
                        : 'border-transparent text-cream/40 hover:text-cream/60 hover:border-gold-border/30'
                        }`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 text-sm font-bangers border-b-2 transition-colors ${activeTab === 'overview'
                        ? 'border-gold-border text-gold-light'
                        : 'border-transparent text-cream/40 hover:text-cream/60 hover:border-gold-border/30'
                        }`}
                >
                    Partidos
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-3 text-sm font-bangers border-b-2 transition-colors ${activeTab === 'leaderboard'
                        ? 'border-gold-border text-gold-light'
                        : 'border-transparent text-cream/40 hover:text-cream/60 hover:border-gold-border/30'
                        }`}
                >
                    Clasificación
                </button>
                <button
                    onClick={() => setActiveTab('settlement')}
                    className={`flex-1 py-3 text-sm font-bangers border-b-2 transition-colors ${activeTab === 'settlement'
                        ? 'border-gold-border text-gold-light'
                        : 'border-transparent text-cream/40 hover:text-cream/60 hover:border-gold-border/30'
                        }`}
                >
                    Liquidación
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 pb-24 overflow-y-auto">
                {/* Bet filter */}
                {(activeTab === 'general' || activeTab === 'overview') && (
                    <div className="flex gap-2 mb-3">
                        {([['all', 'Todas'], ['pending', 'Pendientes'], ['placed', 'Apostadas']] as const).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setBetFilter(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bangers transition-colors ${betFilter === key
                                        ? 'gold-button text-[#1e293b] translate-y-1'
                                        : 'cartoon-card py-1.5 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'general' && (
                    <GeneralBetsSection
                        eventId={eventId}
                        pools={generalPools || []}
                        myBets={myGeneralBets || []}
                        onBetPlaced={() => { refetchPools(); refetchMyBets(); }}
                        filter={betFilter}
                    />
                )}

                {activeTab === 'overview' && (
                    <div className="flex flex-col gap-5">
                        {!leaderboard ? (
                            <p className="text-center text-cream/50 font-fredoka">Cargando partidas disponibles...</p>
                        ) : leaderboard.matches.length === 0 ? (
                            <p className="text-center text-cream/50 font-fredoka">No hay partidas configuradas.</p>
                        ) : (() => {
                            const flightGroups: Record<string, { name: string; matches: Match[] }> = {};
                            leaderboard.matches
                                .filter(match => {
                                    if (betFilter === 'all') return true;
                                    const hasBet = !!stats?.bets?.find(b => b.flightId === match.flightId && b.segmentType === match.segmentType);
                                    return betFilter === 'placed' ? hasBet : !hasBet;
                                })
                                .forEach(match => {
                                    if (!flightGroups[match.flightId]) {
                                        flightGroups[match.flightId] = { name: match.flightName, matches: [] };
                                    }
                                    flightGroups[match.flightId].matches.push(match);
                                });

                            return Object.entries(flightGroups).map(([flightId, group]) => (
                                <div key={flightId} className="bg-[#0a4030] thick-border rounded-2xl p-3 pt-3">
                                    <h3 className="text-xs font-bangers text-gold-light uppercase tracking-widest mb-3 px-1">
                                        {group.name}
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {group.matches.map(match => {
                                            const userBet = stats?.bets?.find(b => b.flightId === match.flightId && b.segmentType === match.segmentType);
                                            return (
                                                <MatchBettingCard
                                                    key={`${match.flightId}-${match.segmentType}`}
                                                    match={match}
                                                    userBet={userBet}
                                                    onClick={() => setSelectedMatch(match)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="flex flex-col gap-2">
                        {!settlement ? (
                            <p className="text-center text-cream/50 font-fredoka">Cargando clasificación...</p>
                        ) : settlement.balances.length === 0 ? (
                            <p className="text-center text-cream/50 py-8 font-fredoka">Aún no hay apuestas registradas para este evento.</p>
                        ) : (
                            <div className="bg-white thick-border rounded-2xl shadow-none overflow-hidden">
                                {settlement.balances.map((player, idx) => (
                                    <div key={player.id} className={`flex justify-between items-center p-4 ${idx !== settlement.balances.length - 1 ? 'border-b border-gold-border/20' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 text-center text-sm font-bangers text-gold-border">
                                                {idx + 1}
                                            </div>
                                            <div className="font-fredoka font-medium text-forest-deep">
                                                {player.name} {player.id === user?.id ? '(Tú)' : ''}
                                            </div>
                                        </div>
                                        <div className={`font-bangers text-lg ${player.balance > 0 ? 'text-green-600' : player.balance < 0 ? 'text-team-red' : 'text-forest-deep/40'}`}>
                                            {player.balance > 0 ? '+' : ''}{formatCurrency(player.balance)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {settlement && settlement.isPartial && (
                            <p className="text-xs text-center text-cream/40 mt-2 font-fredoka">
                                * Resultados parciales. Basado solo en partidas finalizadas.
                            </p>
                        )}
                    </div>
                )}

                {activeTab === 'settlement' && (
                    <div className="flex flex-col gap-3">
                        {!settlement ? (
                            <p className="text-center text-cream/50 font-fredoka">Cargando liquidación...</p>
                        ) : settlement.transfers.length === 0 ? (
                            <div className="bg-white thick-border rounded-2xl p-8 text-center shadow-none">
                                <div className="text-4xl mb-2">🤝</div>
                                <h3 className="font-bangers text-forest-deep">Nada que liquidar</h3>
                                <p className="text-sm text-forest-deep/60 mt-1 font-fredoka">Todos están a mano o no hay apuestas cerradas.</p>
                            </div>
                        ) : (
                            <>
                                <div className="thick-border bg-[#ffd700] text-[#1e293b] p-3 rounded-2xl text-sm mb-2 shadow-none font-fredoka">
                                    <span className="font-bangers">Sistema de Honor:</span> El aplicativo calcula la forma más eficiente de saldar las deudas entre todos.
                                </div>

                                {settlement.transfers.map((t, idx) => {
                                    const fromName = settlement.balances.find(b => b.id === t.from)?.name || 'Desconocido';
                                    const toName = settlement.balances.find(b => b.id === t.to)?.name || 'Desconocido';
                                    const isMeFrom = t.from === user?.id;
                                    const isMeTo = t.to === user?.id;

                                    return (
                                        <div
                                            key={idx}
                                            className={`bg-white thick-border rounded-2xl shadow-none p-4 ${isMeFrom ? 'border-team-red bg-red-50' : isMeTo ? 'border-green-500 bg-green-50' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-fredoka font-medium text-forest-deep">
                                                    <span className={isMeFrom ? 'font-bold text-team-red' : ''}>{fromName}</span>
                                                    <span className="mx-2">debe pagar a</span>
                                                    <span className={isMeTo ? 'font-bold text-green-600' : ''}>{toName}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-gold-border/20 pt-2 mt-2">
                                                <div className="text-xs text-forest-deep/40 font-fredoka">Transferencia sugerida</div>
                                                <div className="font-bangers text-lg text-forest-deep">
                                                    {formatCurrency(t.amount)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Slide-up Detail Sheet */}
            {selectedMatch && (
                <BettingDetailSheet
                    eventId={eventId}
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
}
