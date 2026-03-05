'use client';

interface MatchHeaderProps {
    title?: string;
    status: string;
    onMenuClick?: () => void;
}

export function MatchHeader({ title = 'MATCH PLAY', status, onMenuClick }: MatchHeaderProps) {
    // Determine badge color based on status
    const getBadgeColor = () => {
        if (status.includes('UP')) {
            // Check if red or blue is up
            if (status.includes('RED') || status.startsWith('-')) {
                return 'bg-team-red';
            }
            return 'bg-team-blue';
        }
        return 'bg-gray-700'; // ALL SQUARE
    };

    return (
        <div className="bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Menu button */}
                {onMenuClick && (
                    <button onClick={onMenuClick} className="text-gray-600 p-2">
                        ☰
                    </button>
                )}

                {/* Title and Status */}
                <div className="flex-1 text-center">
                    <h2 className="text-sm font-bold text-gray-800">{title}</h2>
                    <span className={`inline-block mt-1 px-3 py-1 rounded text-white text-xs font-bold ${getBadgeColor()}`}>
                        {status}
                    </span>
                </div>

                {/* Placeholder for balance */}
                {onMenuClick && <div className="w-10"></div>}
            </div>
        </div>
    );
}
