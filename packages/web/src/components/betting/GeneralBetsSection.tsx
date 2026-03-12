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
    mvp: { title: 'MVP', description: '¿Quién será el mejor jugador del torneo?' },
    worst_player: { title: 'Peor Jugador', description: '¿Quién será el peor jugador del torneo?' },
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
    const isRed = outcome === 'red';
    const isBlue = outcome === 'blue';

    let borderClass = 'border-gold-border/30 bg-white hover:border-gold-border/60';
    let textClass = 'text-forest-deep';

    if (isMyPick) {
        borderClass = isRed ? 'border-team-red bg-team-red/10 ring-2 ring-team-red/30'
            : isBlue ? 'border-team-blue bg-team-blue/10 ring-2 ring-team-blue/30'
            : 'border-forest-deep bg-forest-deep/10 ring-2 ring-forest-deep/20';
    } else if (isSelected) {
        borderClass = isRed ? 'border-team-red/50 bg-team-red/5'
            : isBlue ? 'border-team-blue/50 bg-team-blue/5'
            : 'border-forest-deep/30 bg-forest-deep/5';
    }

    if (isRed) textClass = 'text-team-red';
    else if (isBlue) textClass = 'text-team-blue';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 rounded-lg p-3 text-center border-2 transition-all ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className={`text-sm font-fredoka font-bold ${textClass}`}>{label}</div>
            {partes > 0 && (
                <div className="text-[10px] text-forest-deep/40 mt-1 font-fredoka">{partes} partes</div>
            )}
            {isMyPick && (
                <div className="text-[9px] font-bangers text-green-600 mt-1 uppercase">Tu apuesta</div>
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

    const isPlayerBet = pool.betType === 'mvp' || pool.betType === 'worst_player';

    const allPlayers = isPlayerBet
        ? [...(pool.redPlayerNames || []), ...(pool.bluePlayerNames || [])].map(s => {
            const [id, ...nameParts] = s.split(':');
            return { id, name: nameParts.join(':'), team: (pool.redPlayerNames || []).includes(s) ? 'red' as const : 'blue' as const };
        })
        : [];

    const outcomes = isPlayerBet ? allPlayers.map(p => p.id)
        : pool.betType === 'tournament_winner' ? ['red', 'blue']
        : pool.betType === 'early_close' ? ['yes', 'no']
        : pool.betType === 'flight_winner' ? ['red', 'blue', 'tie']
        : pool.betType === 'flight_sweep' ? ['red', 'blue']
        : ['red', 'blue'];

    const getPlayerName = (id: string) => allPlayers.find(p => p.id === id)?.name || id;
    const getPlayerTeam = (id: string) => allPlayers.find(p => p.id === id)?.team;

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
        <div className={`bg-cream gold-border rounded-xl overflow-hidden ${pool.isResolved ? 'opacity-80' : ''}`}>
            <button
                onClick={() => !pool.isResolved && setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bangers text-forest-deep">{meta.title}</h3>
                    </div>
                    <p className="text-[11px] text-forest-deep/40 mt-0.5 font-fredoka">{meta.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                    {pool.pot > 0 && (
                        <span className="text-xs font-bangers text-brass">{formatCurrency(pool.pot)}</span>
                    )}
                    {pool.betsCount > 0
                        ? <span className="text-[10px] text-green-600 font-bangers">Apostado ✓</span>
                        : <span className="text-[10px] text-forest-deep/30 font-fredoka">Pendiente</span>
                    }
                    {pool.isResolved && pool.winningOutcome && pool.winningOutcome !== '__none__' && (() => {
                        const winTeam = isPlayerBet ? getPlayerTeam(pool.winningOutcome) : null;
                        const winLabel = isPlayerBet ? getPlayerName(pool.winningOutcome) : (OUTCOME_LABELS[pool.winningOutcome] || pool.winningOutcome);
                        const winColor = isPlayerBet
                            ? (winTeam === 'red' ? 'bg-team-red/15 text-team-red' : winTeam === 'blue' ? 'bg-team-blue/15 text-team-blue' : 'bg-forest-mid/20 text-forest-deep/60')
                            : (pool.winningOutcome === 'red' ? 'bg-team-red/15 text-team-red' : pool.winningOutcome === 'blue' ? 'bg-team-blue/15 text-team-blue' : 'bg-forest-mid/20 text-forest-deep/60');
                        return (
                            <span className={`text-[9px] font-bangers uppercase px-2 py-0.5 rounded ${winColor}`}>
                                {winLabel}
                            </span>
                        );
                    })()}
                </div>
            </button>

            {hasBet && !expanded && (() => {
                const pickedTeam = isPlayerBet ? getPlayerTeam(myBet.pickedOutcome) : null;
                const displayOutcome = isPlayerBet ? getPlayerName(myBet.pickedOutcome) : (OUTCOME_LABELS[myBet.pickedOutcome] || myBet.pickedOutcome);
                const colorKey = isPlayerBet ? (pickedTeam || 'neutral') : myBet.pickedOutcome;
                const bgClass = colorKey === 'red' ? 'bg-team-red/10 text-team-red' : colorKey === 'blue' ? 'bg-team-blue/10 text-team-blue' : 'bg-forest-mid/10 text-forest-deep/60';
                const dotClass = colorKey === 'red' ? 'bg-team-red' : colorKey === 'blue' ? 'bg-team-blue' : 'bg-forest-mid';
                return (
                    <div className="px-4 pb-3 -mt-1">
                        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bangers uppercase px-2 py-1 rounded ${bgClass}`}>
                            <div className={`w-1.5 h-4 rounded-full ${dotClass}`} />
                            Tu apuesta: {displayOutcome}
                        </div>
                    </div>
                );
            })()}

            {expanded && !hasBet && !pool.isResolved && (
                <div className="px-4 pb-4 border-t border-gold-border/20 pt-3">
                    {isPlayerBet ? (
                        <div className="flex flex-col gap-1.5 mb-3 max-h-60 overflow-y-auto">
                            {allPlayers.map(p => {
                                const isSelected = selectedOutcome === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedOutcome(p.id)}
                                        disabled={isSubmitting}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border-2 transition-all text-left
                                            ${isSelected
                                                ? p.team === 'red' ? 'border-team-red/50 bg-team-red/5' : 'border-team-blue/50 bg-team-blue/5'
                                                : 'border-gold-border/20 bg-white hover:border-gold-border/40'
                                            }
                                        `}
                                    >
                                        <span className={`text-sm font-fredoka font-bold ${p.team === 'red' ? 'text-team-red' : 'text-team-blue'}`}>{p.name}</span>
                                        {(pool.outcomePartes[p.id] || 0) > 0 && (
                                            <span className="text-[10px] text-forest-deep/40 font-fredoka">{pool.outcomePartes[p.id]} partes</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
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
                    )}

                    {selectedOutcome && (
                        <div className="flex flex-col gap-3 mt-2">
                            <div className="bg-gold-light/20 border border-gold-border/40 rounded-xl p-3">
                                <p className="text-xs text-brass font-bangers">Compromiso de Honor</p>
                                <p className="text-[11px] text-forest-deep/60 mt-1 font-fredoka">
                                    Al confirmar, te comprometes a aportar el monto al pozo final. No se permiten cancelaciones.
                                </p>
                            </div>

                            {error && <p className="text-team-red text-xs text-center font-fredoka">{error}</p>}

                            <button
                                onClick={handlePlace}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bevel-button font-bangers text-sm disabled:opacity-50 shadow-lg"
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
        return <p className="text-center text-cream/50 text-sm py-8 font-fredoka">No hay apuestas generales disponibles.</p>;
    }

    const filterPool = (pool: GeneralBetPool) => {
        if (filter === 'all') return true;
        const hasBet = myBets.some(b => b.betType === pool.betType && b.flightId === pool.flightId);
        return filter === 'placed' ? hasBet : !hasBet;
    };

    const tournamentPools = pools.filter(p => ['tournament_winner', 'any_halve', 'biggest_blowout', 'mvp', 'worst_player'].includes(p.betType)).filter(filterPool);

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
            {tournamentPools.length > 0 && (
                <div className="bg-forest-deep/50 gold-border rounded-xl p-3 pt-3">
                    <h3 className="text-xs font-bangers text-gold-light uppercase tracking-widest mb-3 px-1">Torneo General</h3>
                    <div className="flex flex-col gap-2">
                        {tournamentPools.map(renderCard)}
                    </div>
                </div>
            )}

            {Object.entries(flightGroups).map(([flightId, group]) => (
                <div key={flightId} className="bg-forest-deep/50 gold-border rounded-xl p-3 pt-3">
                    <h3 className="text-xs font-bangers text-gold-light uppercase tracking-widest mb-1 px-1">
                        {group.name}
                    </h3>
                    {(group.redPlayers.length > 0 || group.bluePlayers.length > 0) && (
                        <div className="flex items-center gap-2 px-1 mb-3 text-sm">
                            <span className="text-team-red font-fredoka font-bold">{group.redPlayers.join(', ')}</span>
                            <span className="text-cream/40 font-bangers">vs</span>
                            <span className="text-team-blue font-fredoka font-bold">{group.bluePlayers.join(', ')}</span>
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
