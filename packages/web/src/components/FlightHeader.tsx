'use client';

interface Player {
    playerId: string;
    playerName: string;
    hcp: number;
}

interface FlightHeaderProps {
    flightName?: string;
    redPlayers: Player[];
    bluePlayers: Player[];
}

export function FlightHeader({ flightName, redPlayers, bluePlayers }: FlightHeaderProps) {
    return (
        <div className="bg-white border-b p-4">
            {flightName && (
                <h2 className="text-center text-sm font-semibold text-gray-500 mb-3">{flightName}</h2>
            )}

            <div className="flex justify-between items-start gap-4">
                {/* Red Team */}
                <div className="flex-1">
                    <div className="text-team-red font-bold text-xs mb-2 text-center">TEAM RED</div>
                    <div className="space-y-1">
                        {redPlayers.map((player) => (
                            <div key={player.playerId} className="bg-red-50 rounded px-3 py-2 text-center">
                                <div className="font-medium text-team-red text-sm">{player.playerName}</div>
                                <div className="text-xs text-gray-500">HCP {player.hcp}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VS divider */}
                <div className="flex items-center justify-center self-center">
                    <span className="text-gray-400 font-bold text-sm">VS</span>
                </div>

                {/* Blue Team */}
                <div className="flex-1">
                    <div className="text-team-blue font-bold text-xs mb-2 text-center">TEAM BLUE</div>
                    <div className="space-y-1">
                        {bluePlayers.map((player) => (
                            <div key={player.playerId} className="bg-blue-50 rounded px-3 py-2 text-center">
                                <div className="font-medium text-team-blue text-sm">{player.playerName}</div>
                                <div className="text-xs text-gray-500">HCP {player.hcp}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
