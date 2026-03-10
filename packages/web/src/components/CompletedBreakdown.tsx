'use client';

interface CompletedBreakdownProps {
    segmentScores: {
        singles: { red: number; blue: number };
        fourball: { red: number; blue: number };
        scramble: { red: number; blue: number };
    };
}

export function CompletedBreakdown({ segmentScores }: CompletedBreakdownProps) {
    const Row = ({ label, red, blue }: { label: string, red: number, blue: number }) => (
        <div className="flex items-center py-3 border-b border-gray-100 last:border-0 relative">
            {/* Red Score - Aligned with Header Red */}
            <div className="flex-1 flex justify-center">
                <span className="text-xl font-black text-team-red">{red}</span>
            </div>

            {/* Label - Centered in VS space */}
            <div className="w-[40px] shrink-0 flex justify-center items-center relative h-full">
                <span className="absolute whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-gray-800">{label}</span>
            </div>

            {/* Blue Score - Aligned with Header Blue */}
            <div className="flex-1 flex justify-center">
                <span className="text-xl font-black text-team-blue">{blue}</span>
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <Row label="INDIVIDUAL" red={segmentScores.singles.red} blue={segmentScores.singles.blue} />
            <Row label="MEJOR BOLA" red={segmentScores.fourball.red} blue={segmentScores.fourball.blue} />
            <Row label="SCRAMBLE" red={segmentScores.scramble.red} blue={segmentScores.scramble.blue} />
        </div>
    );
}
