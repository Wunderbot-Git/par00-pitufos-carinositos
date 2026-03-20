'use client';

import { useUserStats, PersonalStats } from '@/hooks/useBetting';
import { formatCurrency } from '@/lib/currency';

const SEGMENT_LABELS: Record<string, string> = {
    singles1: 'Individual 1',
    singles2: 'Individual 2',
    fourball: 'Mejor Bola',
    scramble: 'Scramble',
};

const OUTCOME_LABELS: Record<string, string> = {
    A: 'Cariñositos',
    B: 'Pitufos',
    AS: 'Empate',
};

interface Props {
    eventId: string;
    userId: string;
    userName: string;
    onClose: () => void;
}

export function UserBetsModal({ eventId, userId, userName, onClose }: Props) {
    const { data: stats, isLoading } = useUserStats(eventId, userId);

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-cream rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-5 pb-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bangers text-forest-deep">Apuestas de {userName}</h2>
                    <button onClick={onClose} className="text-forest-deep/40 text-xl font-bold px-2">x</button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-forest-deep/40 font-fredoka">Cargando...</div>
                ) : !stats || (!stats.bets?.length && !stats.generalBetsCount) ? (
                    <div className="text-center py-8 text-forest-deep/40 font-fredoka">No tiene apuestas registradas.</div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-forest-deep/5 rounded-lg p-2">
                                <div className="text-[10px] font-bangers text-forest-deep/40 uppercase">Apostado</div>
                                <div className="text-sm font-fredoka font-bold text-forest-deep">{formatCurrency(stats.wagered)}</div>
                            </div>
                            <div className="bg-forest-deep/5 rounded-lg p-2">
                                <div className="text-[10px] font-bangers text-forest-deep/40 uppercase">Potencial</div>
                                <div className="text-sm font-fredoka font-bold text-gold-border">{formatCurrency(stats.potential)}</div>
                            </div>
                        </div>

                        {/* Match bets grouped by flight */}
                        {stats.bets && stats.bets.length > 0 && (() => {
                            const groups: Record<string, { name: string; bets: any[] }> = {};
                            stats.bets.forEach((bet: any) => {
                                const key = bet.flightId || 'unknown';
                                if (!groups[key]) groups[key] = { name: bet.flightName || 'Partido', bets: [] };
                                groups[key].bets.push(bet);
                            });
                            return Object.entries(groups).map(([flightId, group]) => (
                                <div key={flightId}>
                                    <h3 className="text-xs font-bangers text-forest-deep/50 uppercase tracking-wider mb-2">{group.name}</h3>
                                    <div className="flex flex-col gap-1.5">
                                        {group.bets.map((bet: any, i: number) => {
                                            const outcomeLabel = OUTCOME_LABELS[bet.pickedOutcome] || bet.pickedOutcome;
                                            const outcomeColor = bet.pickedOutcome === 'A' ? 'text-team-red'
                                                : bet.pickedOutcome === 'B' ? 'text-team-blue' : 'text-forest-deep/70';
                                            const statusColor = bet.status === 'closed'
                                                ? (bet.realizedPayout > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                                                : 'bg-white border-gold-border/20';
                                            return (
                                                <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-lg border ${statusColor}`}>
                                                    <div>
                                                        <div className="text-[10px] font-bangers text-forest-deep/40 uppercase">
                                                            {SEGMENT_LABELS[bet.segmentType] || bet.segmentType}
                                                        </div>
                                                        <div className={`text-sm font-fredoka font-bold ${outcomeColor}`}>
                                                            {outcomeLabel}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-fredoka text-forest-deep/40">{formatCurrency(bet.amount)}</div>
                                                        {bet.status === 'closed' && (
                                                            <div className={`text-xs font-fredoka font-bold ${bet.realizedPayout > 0 ? 'text-green-600' : 'text-team-red'}`}>
                                                                {bet.realizedPayout > 0 ? '+' : ''}{formatCurrency(bet.realizedPayout - bet.amount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
