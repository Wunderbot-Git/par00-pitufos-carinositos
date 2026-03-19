'use client';

import { useState, useCallback } from 'react';
import { Match } from '@/hooks/useLeaderboard';
import { Bet } from '@/hooks/useBetting';
import { api } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';

const SEGMENT_LABELS: Record<string, string> = {
    singles1: 'Individual 1',
    singles2: 'Individual 2',
    fourball: 'Mejor Bola',
    scramble: 'Scramble',
};

type Outcome = 'A' | 'B' | 'AS';

function getMatchNames(match: Match) {
    const red = (match.segmentType === 'scramble'
        ? match.redPlayers.map(p => p.playerName.split(' ')[0]).join(' / ')
        : match.redPlayers[0]?.playerName?.split(' ')[0] || '?').replace(/\s*-\s*$/, '');
    const blue = (match.segmentType === 'scramble'
        ? match.bluePlayers.map(p => p.playerName.split(' ')[0]).join(' / ')
        : match.bluePlayers[0]?.playerName?.split(' ')[0] || '?').replace(/\s*-\s*$/, '');
    return { red, blue };
}

function isMatchClosed(match: Match) {
    return match.currentHole > 8 || match.status === 'completed' || match.matchStatus.includes('Won') || match.matchStatus.includes('Lost') || match.matchStatus.includes('&');
}

interface Props {
    eventId: string;
    flightName: string;
    matches: Match[];
    userBets: Record<string, Bet | undefined>; // keyed by segmentType
    onBetsPlaced: () => void;
}

export function FlightBettingPanel({ eventId, flightName, matches, userBets, onBetsPlaced }: Props) {
    const [selections, setSelections] = useState<Record<string, Outcome>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const clearToast = useCallback(() => setToast(null), []);

    const toggleSelection = (segmentType: string, outcome: Outcome) => {
        setSelections(prev => {
            const current = prev[segmentType];
            if (current === outcome) {
                const next = { ...prev };
                delete next[segmentType];
                return next;
            }
            return { ...prev, [segmentType]: outcome };
        });
    };

    // Count new selections (excluding matches that already have the same bet)
    const newSelections = Object.entries(selections).filter(([seg, outcome]) => {
        const existing = userBets[seg];
        return !existing || existing.pickedOutcome !== outcome;
    });

    const handleConfirmAll = async () => {
        if (newSelections.length === 0) return;
        setIsSubmitting(true);
        setProgress({ current: 0, total: newSelections.length });

        let successCount = 0;
        let lastError = '';

        for (const [segmentType, outcome] of newSelections) {
            const match = matches.find(m => m.segmentType === segmentType);
            if (!match) continue;

            const existingBet = userBets[segmentType];
            const isAdditional = !!existingBet;

            try {
                await api.post(`/events/${eventId}/flights/${match.flightId}/segments/${segmentType}/bets`, {
                    pickedOutcome: outcome,
                    ...(isAdditional ? { amount: 5000 } : {}),
                });
                successCount++;
            } catch (err) {
                lastError = err instanceof Error ? err.message : 'Error';
            }
            setProgress(p => ({ ...p, current: p.current + 1 }));
        }

        setIsSubmitting(false);
        setSelections({});

        if (successCount > 0) {
            setToast({
                message: `${successCount} apuesta${successCount > 1 ? 's' : ''} registrada${successCount > 1 ? 's' : ''}`,
                type: successCount === newSelections.length ? 'success' : 'error',
            });
            onBetsPlaced();
        } else if (lastError) {
            setToast({ message: lastError, type: 'error' });
        }
    };

    return (
        <div className="bg-[#0a4030] thick-border rounded-2xl p-3">
            <h3 className="text-xs font-bangers text-gold-light uppercase tracking-widest mb-3 px-1">
                {flightName}
            </h3>

            <div className="flex flex-col gap-2">
                {matches.map(match => {
                    const { red, blue } = getMatchNames(match);
                    const closed = isMatchClosed(match);
                    const isLive = match.currentHole > 0 && !closed;
                    const existingBet = userBets[match.segmentType];
                    const selected = selections[match.segmentType] || null;

                    const currentLeader = match.matchLeaders && match.matchLeaders.length > 0
                        ? match.matchLeaders[match.currentHole > 0 ? match.currentHole - 1 : 0]
                        : (match.matchStatus.includes('UP') ? 'red' : match.matchStatus.includes('DN') ? 'blue' : null);

                    const canBetA = !closed && !(isLive && currentLeader === 'red');
                    const canBetB = !closed && !(isLive && currentLeader === 'blue');
                    const canBetAS = !closed;

                    return (
                        <div key={match.segmentType} className="bg-cream gold-border rounded-xl px-3 py-3">
                            {/* Row 1: segment label + status */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bangers text-forest-deep/50 uppercase tracking-wider">
                                    {SEGMENT_LABELS[match.segmentType] || match.segmentType}
                                </span>
                                {isLive && (
                                    <span className="text-[10px] font-fredoka font-medium text-green-700 bg-green-50 flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-green-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        H{match.currentHole}
                                    </span>
                                )}
                                {closed && (
                                    <span className="text-[10px] font-fredoka text-forest-deep/30 bg-forest-deep/5 px-1.5 py-0.5 rounded-full">
                                        {match.matchStatus || 'Fin'}
                                    </span>
                                )}
                            </div>

                            {/* Row 2: outcome buttons */}
                            <div className="flex gap-1.5">
                                <OutcomeBtn
                                    label={red}
                                    outcome="A"
                                    team="red"
                                    selected={selected === 'A'}
                                    existingPick={existingBet?.pickedOutcome === 'A'}
                                    disabled={!canBetA}
                                    onClick={() => toggleSelection(match.segmentType, 'A')}
                                />
                                <OutcomeBtn
                                    label="AS"
                                    outcome="AS"
                                    team="neutral"
                                    selected={selected === 'AS'}
                                    existingPick={existingBet?.pickedOutcome === 'AS'}
                                    disabled={!canBetAS}
                                    onClick={() => toggleSelection(match.segmentType, 'AS')}
                                />
                                <OutcomeBtn
                                    label={blue}
                                    outcome="B"
                                    team="blue"
                                    selected={selected === 'B'}
                                    existingPick={existingBet?.pickedOutcome === 'B'}
                                    disabled={!canBetB}
                                    onClick={() => toggleSelection(match.segmentType, 'B')}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirm button */}
            {newSelections.length > 0 && (
                <button
                    onClick={handleConfirmAll}
                    disabled={isSubmitting}
                    className={`w-full mt-3 py-4 rounded-xl font-bangers text-lg shadow-lg transition-all ${isSubmitting ? 'bg-forest-mid text-cream/50 cursor-wait' : 'bevel-button'}`}
                >
                    {isSubmitting
                        ? `Guardando ${progress.current} de ${progress.total}...`
                        : `Confirmar ${newSelections.length} apuesta${newSelections.length > 1 ? 's' : ''}`}
                </button>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onDone={clearToast} />}
        </div>
    );
}

function OutcomeBtn({ label, outcome, team, selected, existingPick, disabled, onClick }: {
    label: string;
    outcome: Outcome;
    team: 'red' | 'blue' | 'neutral';
    selected: boolean;
    existingPick: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    const isAS = outcome === 'AS';

    let bg = 'bg-white border-gold-border/20';
    let text = 'text-forest-deep/60';

    if (selected) {
        bg = team === 'red' ? 'bg-team-red/15 border-team-red ring-1 ring-team-red/30'
            : team === 'blue' ? 'bg-team-blue/15 border-team-blue ring-1 ring-team-blue/30'
            : 'bg-forest-deep/10 border-forest-deep ring-1 ring-forest-deep/20';
        text = team === 'red' ? 'text-team-red' : team === 'blue' ? 'text-team-blue' : 'text-forest-deep';
    } else if (existingPick) {
        bg = team === 'red' ? 'bg-team-red/5 border-team-red/30'
            : team === 'blue' ? 'bg-team-blue/5 border-team-blue/30'
            : 'bg-forest-deep/5 border-forest-deep/20';
        text = team === 'red' ? 'text-team-red/70' : team === 'blue' ? 'text-team-blue/70' : 'text-forest-deep/50';
    }

    if (disabled) {
        bg = 'bg-forest-deep/5 border-gold-border/10';
        text = 'text-forest-deep/20';
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 py-2.5 rounded-lg border-2 text-center transition-all active:scale-95 ${bg} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className={`text-xs font-fredoka font-bold truncate px-1 ${text}`}>
                {isAS ? 'A/S' : label}
            </div>
            {existingPick && !selected && (
                <div className="text-[8px] font-bangers text-green-600 mt-0.5">✓</div>
            )}
        </button>
    );
}
