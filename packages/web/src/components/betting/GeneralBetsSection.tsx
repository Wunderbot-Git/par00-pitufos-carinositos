'use client';

import { useState } from 'react';
import { GeneralBetPool, GeneralBet, usePlaceGeneralBet } from '@/hooks/useBetting';
import { formatCurrency } from '@/lib/currency';

interface Props {
    eventId: string;
    pools: GeneralBetPool[];
    myBets: GeneralBet[];
    onBetPlaced: () => void;
    filter?: 'all' | 'placed' | 'pending';
}

const BET_TYPE_LABELS: Record<string, { title: string; description: string }> = {
    tournament_winner: { title: 'Ganador del Torneo', description: '¿Quién se lleva el torneo?' },
    flight_winner: { title: 'Dominador del Día', description: '¿Qué equipo gana más puntos en este grupo?' },
    flight_sweep: { title: 'Barrida Total', description: '¿Alguien barre limpio?' },
    biggest_blowout: { title: 'Más Aplastante', description: '¿Cuál partida tendrá el mayor margen de victoria?' },
    early_close: { title: 'Cierre Rápido', description: '¿Alguien cierra en el hoyo 6 o antes?' },
};

const OUTCOME_LABELS: Record<string, string> = {
    red: 'Cariñositos',
    blue: 'Pitufos',
    tie: 'Empate',
    yes: 'Sí',
    no: 'No',
};

function OutcomeButton({ outcome, label, isSelected, isMyPick, partes, onClick, disabled }: {
    outcome: string; label: string; isSelected: boolean; isMyPick: boolean;
    partes: number; onClick: () => void; disabled: boolean;
}) {
    const teamColor = outcome === 'red' ? 'rose' : outcome === 'blue' ? 'blue' : 'slate';
    const isTeam = outcome === 'red' || outcome === 'blue';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex-1 rounded-lg p-3 text-center border-2 transition-all
                ${isMyPick
                    ? `border-${teamColor}-500 bg-${teamColor}-50 ring-2 ring-${teamColor}-200`
                    : isSelected
                        ? `border-${teamColor}-300 bg-${teamColor}-50`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <div className={`text-sm font-bold ${isTeam ? `text-${teamColor}-600` : 'text-slate-700'}`}>
                {label}
            </div>
            {partes > 0 && (
                <div className="text-[10px] text-slate-400 mt-1">{partes} partes</div>
            )}
            {isMyPick && (
                <div className="text-[9px] font-bold text-green-600 mt-1 uppercase">Tu apuesta</div>
            )}
        </button>
    );
}

function GeneralBetCard({ pool, myBet, eventId, onBetPlaced }: {
    pool: GeneralBetPool; myBet: GeneralBet | undefined; eventId: string; onBetPlaced: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
    const { placeGeneralBet, isSubmitting, error } = usePlaceGeneralBet();

    const meta = BET_TYPE_LABELS[pool.betType] || { title: pool.betType, description: '' };
    const hasBet = !!myBet;

    const outcomes = pool.betType === 'tournament_winner' ? ['red', 'blue']
        : pool.betType === 'early_close' ? ['yes', 'no']
        : pool.betType === 'flight_winner' ? ['red', 'blue', 'tie']
        : pool.betType === 'flight_sweep' ? ['red', 'blue']
        : ['red', 'blue']; // biggest_blowout fallback

    const handlePlace = async () => {
        if (!selectedOutcome) return;
        const success = await placeGeneralBet({
            eventId,
            betType: pool.betType,
            pickedOutcome: selectedOutcome,
            flightId: pool.flightId || undefined,
            segmentType: pool.segmentType || undefined,
        });
        if (success) {
            setSelectedOutcome(null);
            setExpanded(false);
            onBetPlaced();
        }
    };

    return (
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${pool.isResolved ? 'border-slate-200 opacity-80' : 'border-slate-200'}`}>
            <button
                onClick={() => !pool.isResolved && setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800">{meta.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{meta.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                    {pool.pot > 0 && (
                        <span className="text-xs font-bold text-amber-600">{formatCurrency(pool.pot)}</span>
                    )}
                    {pool.betsCount > 0
                        ? <span className="text-[10px] text-green-500 font-bold">Apostado ✓</span>
                        : <span className="text-[10px] text-slate-400">Pendiente</span>
                    }
                    {pool.isResolved && pool.winningOutcome && pool.winningOutcome !== '__none__' && (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            pool.winningOutcome === 'red' ? 'bg-rose-100 text-rose-600' :
                            pool.winningOutcome === 'blue' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {OUTCOME_LABELS[pool.winningOutcome] || pool.winningOutcome}
                        </span>
                    )}
                </div>
            </button>

            {hasBet && !expanded && (
                <div className="px-4 pb-3 -mt-1">
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded ${
                        myBet.pickedOutcome === 'red' ? 'bg-rose-50 text-rose-600' :
                        myBet.pickedOutcome === 'blue' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-600'
                    }`}>
                        <div className={`w-1.5 h-4 rounded-full ${
                            myBet.pickedOutcome === 'red' ? 'bg-rose-500' :
                            myBet.pickedOutcome === 'blue' ? 'bg-blue-500' :
                            'bg-slate-400'
                        }`} />
                        Tu apuesta: {OUTCOME_LABELS[myBet.pickedOutcome] || myBet.pickedOutcome}
                    </div>
                </div>
            )}

            {expanded && !hasBet && !pool.isResolved && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <div className="flex gap-2 mb-3">
                        {outcomes.map(o => (
                            <OutcomeButton
                                key={o}
                                outcome={o}
                                label={OUTCOME_LABELS[o] || o}
                                isSelected={selectedOutcome === o}
                                isMyPick={false}
                                partes={pool.outcomePartes[o] || 0}
                                onClick={() => setSelectedOutcome(o)}
                                disabled={isSubmitting}
                            />
                        ))}
                    </div>

                    {selectedOutcome && (
                        <div className="flex flex-col gap-3 mt-2">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-xs text-amber-800 font-medium">⚠️ Compromiso de Honor</p>
                                <p className="text-[11px] text-amber-700 mt-1">
                                    Al confirmar, te comprometes a aportar el monto al pozo final. No se permiten cancelaciones.
                                </p>
                            </div>

                            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                            <button
                                onClick={handlePlace}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-slate-800 text-white text-sm font-bold disabled:opacity-50 shadow-lg"
                            >
                                {isSubmitting ? 'Guardando...' : 'Confirmar Apuesta'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function GeneralBetsSection({ eventId, pools, myBets, onBetPlaced, filter = 'all' }: Props) {
    if (!pools || pools.length === 0) {
        return <p className="text-center text-slate-400 text-sm py-8">No hay apuestas generales disponibles.</p>;
    }

    const filterPool = (pool: GeneralBetPool) => {
        if (filter === 'all') return true;
        const hasBet = myBets.some(b => b.betType === pool.betType && b.flightId === pool.flightId);
        return filter === 'placed' ? hasBet : !hasBet;
    };

    // Tournament-level pools
    const tournamentPools = pools.filter(p => ['tournament_winner', 'any_halve', 'biggest_blowout'].includes(p.betType)).filter(filterPool);

    // Flight pools grouped by flightId
    const flightPools = pools.filter(p => ['flight_winner', 'flight_sweep', 'early_close'].includes(p.betType)).filter(filterPool);
    const flightGroups: Record<string, { name: string; redPlayers: string[]; bluePlayers: string[]; pools: GeneralBetPool[] }> = {};
    flightPools.forEach(p => {
        if (!p.flightId) return;
        if (!flightGroups[p.flightId]) {
            flightGroups[p.flightId] = {
                name: p.flightName || p.flightId,
                redPlayers: p.redPlayerNames || [],
                bluePlayers: p.bluePlayerNames || [],
                pools: []
            };
        }
        flightGroups[p.flightId].pools.push(p);
    });

    const renderCard = (pool: GeneralBetPool) => (
        <GeneralBetCard
            key={`${pool.betType}-${pool.flightId || ''}`}
            pool={pool}
            myBet={myBets.find(b => b.betType === pool.betType && b.flightId === pool.flightId)}
            eventId={eventId}
            onBetPlaced={onBetPlaced}
        />
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Tournament-level bets */}
            {tournamentPools.length > 0 && (
                <div className="bg-slate-100/80 rounded-xl p-3 pt-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Torneo General</h3>
                    <div className="flex flex-col gap-2">
                        {tournamentPools.map(renderCard)}
                    </div>
                </div>
            )}

            {/* Per-flight bets, grouped by flight */}
            {Object.entries(flightGroups).map(([flightId, group]) => (
                <div key={flightId} className="bg-slate-100/80 rounded-xl p-3 pt-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 px-1">
                        {group.name}
                    </h3>
                    {(group.redPlayers.length > 0 || group.bluePlayers.length > 0) && (
                        <div className="flex items-center gap-2 px-1 mb-3 text-sm">
                            <span className="text-rose-500 font-bold">{group.redPlayers.join(', ')}</span>
                            <span className="text-slate-500 font-semibold">vs</span>
                            <span className="text-blue-500 font-bold">{group.bluePlayers.join(', ')}</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        {group.pools.map(renderCard)}
                    </div>
                </div>
            ))}
        </div>
    );
}
