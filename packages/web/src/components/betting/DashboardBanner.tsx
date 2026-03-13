import { PersonalStats } from '@/hooks/useBetting';
import { formatCurrency } from '@/lib/currency';

interface Props {
    stats?: PersonalStats;
    isLoading: boolean;
}

export function DashboardBanner({ stats, isLoading }: Props) {
    if (isLoading || !stats) {
        return (
            <div className="bg-[#1a1a3e] text-white p-4 mx-4 mt-4 rounded-xl shadow-lg gold-border animate-pulse h-32">
                ...
            </div>
        );
    }

    const hasBets = stats.wagered > 0;

    return (
        <div className="bg-[#1a1a3e] text-white p-5 mx-4 mt-4 rounded-xl shadow-lg gold-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-border opacity-10 rounded-full blur-2xl -mt-10 -mr-10"></div>

            <h2 className="text-xl font-bangers mb-4 flex items-center gap-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-border">
                    <circle cx="12" cy="12" r="8" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="9" y1="10" x2="15" y2="10" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
                Mi Cuenta
            </h2>

            {!hasBets ? (
                <div className="text-center text-white/60 text-sm py-4 italic font-fredoka">
                    Aún no has apostado en ninguna partida.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-2 text-center mb-3">
                        <div className="bg-white/10 rounded-lg p-2 border border-gold-border/20">
                            <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1 font-bangers">Total Apostado</div>
                            <div className="text-sm font-fredoka font-semibold text-white">{formatCurrency(stats.wagered)}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2 border border-gold-border/20">
                            <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1 font-bangers">
                                {stats.realizedNet !== 0 ? 'Ganancia / Pérdida' : 'Apuestas'}
                            </div>
                            <div className={`text-sm font-fredoka font-semibold ${stats.realizedNet > 0 ? 'text-green-400' : stats.realizedNet < 0 ? 'text-team-red' : 'text-white'}`}>
                                {stats.realizedNet !== 0
                                    ? `${stats.realizedNet > 0 ? '+' : ''}${formatCurrency(stats.realizedNet)}`
                                    : (() => {
                                        const matchCount = stats.bets?.length || 0;
                                        const generalCount = stats.generalBetsCount || 0;
                                        const parts = [];
                                        if (matchCount > 0) parts.push(`${matchCount} partida${matchCount !== 1 ? 's' : ''}`);
                                        if (generalCount > 0) parts.push(`${generalCount} general${generalCount !== 1 ? 'es' : ''}`);
                                        return parts.join(' · ') || '0 apuestas';
                                    })()
                                }
                            </div>
                        </div>
                    </div>

                    <div className="bg-gold-border/15 border border-gold-border/40 rounded-lg p-3 flex items-center justify-between">
                        <div className="text-[10px] text-gold-light/80 uppercase tracking-wider font-bangers">Lo que te puedes ganar</div>
                        <div className="text-lg font-bangers metallic-text">{formatCurrency(stats.potential)}</div>
                    </div>

                    {stats.closedWagered > 0 && (
                        <div className="mt-3 text-xs">
                            <div className="flex justify-between text-white/50 mb-1 font-fredoka">
                                <span>Recuperado</span>
                                <span>{Math.round((stats.closedRecovered / Math.max(1, stats.closedWagered)) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${stats.closedRecovered >= stats.closedWagered ? 'bg-green-500' : 'bg-gold-border'}`}
                                    style={{ width: `${Math.min(100, (stats.closedRecovered / Math.max(1, stats.closedWagered)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
