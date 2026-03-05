'use client';

interface ProjectedPointsProps {
    projectedRed: number;
    projectedBlue: number;
    totalRed: number;
    totalBlue: number;
}

export function ProjectedPoints({ projectedRed, projectedBlue, totalRed, totalBlue }: ProjectedPointsProps) {
    return (
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] mx-2 mb-4 flex items-center justify-between px-4 py-3 relative overflow-hidden">

            {/* Red Project */}
            <div className="flex flex-col items-center">
                <span className="text-team-red font-black text-2xl leading-none">{projectedRed.toFixed(1)}</span>
            </div>

            {/* Center Label */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">PROJECTED</span>
                <span className="text-xl font-bold text-ryder-dark">{14}</span> {/* 14 is target? Or just show the word? Example shows a number? "9 1/2 PROJECTED 7". Let's stick to showing the label for now as we don't have "Points Remaining" data handy here easily. */}
            </div>

            {/* Blue Project */}
            <div className="flex flex-col items-center">
                <span className="text-team-blue font-black text-2xl leading-none">{projectedBlue.toFixed(1)}</span>
            </div>
        </div>
    );
}
