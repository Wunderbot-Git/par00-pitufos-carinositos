import { Match } from '@/hooks/useLeaderboard';


interface ScoreBreakdownProps {
    segmentScores: {
        singles: { red: number; blue: number };
        fourball: { red: number; blue: number };
        scramble: { red: number; blue: number };
    };
    matches: Match[];
    onMatchClick?: (match: Match) => void;
}

export function ScoreBreakdown({ segmentScores, matches, onMatchClick }: ScoreBreakdownProps) {
    const Segment = ({ label, type }: { label: string, type: 'singles' | 'fourball' | 'scramble' }) => {
        // Filter out completed matches (only show ongoing/not started in the bar)
        const segmentMatches = (matches || [])
            .filter(m => (type === 'singles' ? m.segmentType.startsWith('singles') : m.segmentType === type) && m.status !== 'completed')
            .sort((a, b) => {
                // Sort by flight/id (default)
                if (a.status === 'not_started' && b.status !== 'not_started') return 1;
                if (a.status !== 'not_started' && b.status === 'not_started') return -1;
                return 0;
            });

        // Calculate projected delta for these matches
        let redDelta = 0;
        let blueDelta = 0;

        segmentMatches.forEach(m => {
            if (m.status === 'not_started') {
                redDelta += 0.5;
                blueDelta += 0.5;
            } else if (m.matchWinner === 'red') {
                redDelta += 1;
            } else if (m.matchWinner === 'blue') {
                blueDelta += 1;
            } else {
                // A/S or undefined winner in progress
                redDelta += 0.5;
                blueDelta += 0.5;
            }
        });

        const formatDelta = (n: number) => n === 0 ? '0' : `+${n}`;

        return (
            <div className="py-4 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-700 text-sm">{label}</span>
                        {segmentMatches.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-medium lowercase">
                                ({segmentMatches.length} {segmentMatches.length === 1 ? 'match' : 'matches'} live)
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <span className={`text-lg font-bold w-12 text-left ${segmentMatches.length > 0 ? 'text-team-red' : 'text-gray-200'}`}>
                        {formatDelta(redDelta)}
                    </span>

                    {/* Match Indicators Bar */}
                    <div className="flex-1 flex gap-1 h-3 items-center">
                        {segmentMatches.length > 0 ? segmentMatches.map((m, i) => {
                            let colorClass = 'bg-gray-200'; // Default for Not Started

                            if (m.status === 'not_started') {
                                colorClass = 'bg-gray-200';
                            } else if (m.matchWinner === 'red') {
                                colorClass = 'bg-team-red';
                            } else if (m.matchWinner === 'blue') {
                                colorClass = 'bg-team-blue';
                            } else {
                                colorClass = 'bg-gray-700'; // A/S in progress
                            }

                            return (
                                <div
                                    key={m.id || i}
                                    onClick={() => onMatchClick?.(m)}
                                    className={`flex-1 rounded-sm ${colorClass} transition-colors h-full cursor-pointer ring-offset-2 hover:ring-2 hover:ring-gray-300`}
                                    title={`Click to filter: ${m.matchStatus}`}
                                />
                            );
                        }) : (
                            // Empty state placeholder
                            <div className="w-full text-center text-[10px] text-gray-300 italic font-medium">
                                All matches finished
                            </div>
                        )}
                    </div>

                    <span className={`text-lg font-bold w-12 text-right ${segmentMatches.length > 0 ? 'text-team-blue' : 'text-gray-200'}`}>
                        {formatDelta(blueDelta)}
                    </span>
                </div>
            </div>
        )
    };

    return (
        <div className="p-4 bg-gray-50/50">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">
                LIVE & UPCOMING MATCHES
            </h3>

            <Segment label="Singles" type="singles" />
            <Segment label="Fourball" type="fourball" />
            <Segment label="Scramble" type="scramble" />
        </div>
    );
}
