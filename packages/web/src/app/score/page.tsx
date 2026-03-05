'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useMyEvents } from '@/hooks/useEvents';
import { usePlayers } from '@/hooks/usePlayers';
import { useFlightScores, useSubmitScores } from '@/hooks/useScores';
import { ScoreGrid } from '@/components/ScoreGrid';
import { ScoreEntryModal } from '@/components/ScoreEntryModal';

export default function ScoresPage() {
    const { user } = useAuth();
    const { events, isLoading: eventsLoading } = useMyEvents();

    // Pick the "active" event. If we have a 'live' event, use that.
    const activeEvent = useMemo(() => {
        if (!events || events.length === 0) return null;
        return events.find(e => e.status === 'live') || events[0];
    }, [events]);

    const eventId = activeEvent?.id || '';
    const { players, isLoading: playersLoading } = usePlayers(eventId);

    // Find current user's player record in this event
    const me = useMemo(() => {
        if (!user || !players) return null;
        return players.find(p => p.userId === user.id);
    }, [user, players]);

    const flightId = me?.flightId;

    const { data: flightScore, isLoading: scoresLoading, refetch } = useFlightScores(eventId, flightId);
    const { submitBatchScores, isSubmitting: isSaving, error: submitError } = useSubmitScores();
    const [openHole, setOpenHole] = useState<number | null>(null);
    const [lastSavedHole, setLastSavedHole] = useState<number | null>(null);

    const isLoading = eventsLoading || playersLoading || (flightId ? scoresLoading : false);

    const handleHoleClick = (hole: number) => {
        setOpenHole(hole);
        // Clear previous errors when opening new hole
        // But useSubmitScores doesn't expose clearError? It clears on new submit.
    };

    const handleSaveModal = async (scores: Record<string, number | null>) => {
        if (!flightScore || openHole === null || !flightId) return;

        const isScramble = flightScore.segmentType === 'scramble';

        // Convert record to array
        const batch = Object.entries(scores).map(([id, score]) => {
            if (isScramble) {
                return {
                    team: id === 'red_team' ? 'red' as const : 'blue' as const,
                    hole: openHole,
                    score
                };
            }
            return {
                playerId: id,
                hole: openHole,
                score
            };
        });

        const success = await submitBatchScores({
            eventId,
            flightId,
            scores: batch
        });

        if (success) {
            setLastSavedHole(openHole);
            setOpenHole(null);
            refetch(); // Refresh grid
        }
        // If failed, modal stays open. Error should be visible.
    };

    // Prepare data for modal
    const isScramble = flightScore?.segmentType === 'scramble';

    const modalPlayers = openHole && flightScore ? (
        isScramble ? [
            {
                playerId: 'red_team',
                playerName: flightScore.redPlayers.map(p => p.playerName.split(' ')[0]).join(' / '),
                hcp: Math.round(flightScore.redPlayers.reduce((a, b) => a + b.hcp, 0) / (flightScore.redPlayers.length || 1)),
                team: 'red' as const,
                scores: flightScore.redPlayers[0]?.scores || []
            },
            {
                playerId: 'blue_team',
                playerName: flightScore.bluePlayers.map(p => p.playerName.split(' ')[0]).join(' / '),
                hcp: Math.round(flightScore.bluePlayers.reduce((a, b) => a + b.hcp, 0) / (flightScore.bluePlayers.length || 1)),
                team: 'blue' as const,
                scores: flightScore.bluePlayers[0]?.scores || []
            }
        ] : [
            ...flightScore.redPlayers.map(p => ({ ...p, team: 'red' as const })),
            ...flightScore.bluePlayers.map(p => ({ ...p, team: 'blue' as const }))
        ]
    ) : [];

    const initialScores = openHole && flightScore ? modalPlayers.reduce((acc, p) => {
        acc[p.playerId] = p.scores[openHole - 1] ?? null;
        return acc;
    }, {} as Record<string, number | null>) : {};

    const currentPar = openHole && flightScore ? flightScore.parValues[openHole - 1] : 0;

    // Find current leader for dynamic header color
    let currentLeader: 'red' | 'blue' | null = null;
    if (flightScore && flightScore.matchLeaders) {
        let lastPlayedIdx = -1;
        for (let i = 17; i >= 0; i--) {
            if (flightScore.matchProgression[i]) {
                lastPlayedIdx = i;
                break;
            }
        }
        if (lastPlayedIdx >= 0) {
            currentLeader = flightScore.matchLeaders[lastPlayedIdx];
        }
    }

    let headerBgClass = "bg-slate-700"; // Default or A/S
    if (currentLeader === 'red') headerBgClass = "bg-rose-700";
    else if (currentLeader === 'blue') headerBgClass = "bg-blue-700";

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
            <header className={`${headerBgClass} text-white sticky top-0 z-50 shadow-md transition-colors duration-500`}>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-white rounded-full p-0.5 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/20">
                            <Image
                                src="/assets/event-logo.png"
                                alt="Event Logo"
                                fill
                                className="object-contain p-0.5"
                                priority
                            />
                        </div>
                        <div className="flex flex-col text-left">
                            <h1 className="text-[13px] font-black uppercase tracking-widest text-white/90 leading-tight">
                                {activeEvent?.name || 'MATCH PLAY'}
                            </h1>
                            <span className="text-[9px] font-bold text-blue-200/80 uppercase tracking-widest mt-0.5">
                                Hole-by-Hole Scoring
                            </span>
                        </div>
                    </div>
                    {flightScore && (
                        <div className="flex-shrink-0 text-right">
                            <span className={`inline-block border px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${currentLeader === 'red' ? 'bg-rose-100 border-rose-200 text-rose-700' :
                                    currentLeader === 'blue' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                        'bg-slate-100 border-slate-200 text-slate-500'
                                }`}>
                                {flightScore.matchStatus || 'LIVE'}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* ERROR indicator */}
            {submitError && (
                <div className="px-4 py-2 bg-red-100 text-red-800 text-xs text-center border-b border-red-200">
                    <span className="font-bold">Error:</span> {submitError}
                </div>
            )}

            {/* Saving indicator */}
            {isSaving && (
                <div className="px-4 py-1 bg-yellow-100 text-yellow-800 text-xs text-center">
                    Saving...
                </div>
            )}


            <main className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-team-blue mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading your match...</p>
                    </div>
                ) : !activeEvent ? (
                    <div className="p-8 text-center">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <p className="text-gray-500 mb-4">You are not part of any active events.</p>
                        </div>
                    </div>
                ) : !flightId ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <p className="mb-2 font-semibold text-gray-700 uppercase text-xs tracking-widest">No Match Assigned</p>
                            <p className="text-sm">Score entry will be available once you are assigned to a flight in <span className="font-bold text-gray-900">{activeEvent.name}</span>.</p>
                        </div>
                    </div>
                ) : !flightScore ? (
                    <div className="p-8 text-center text-red-500">
                        Failed to load score data.
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <ScoreGrid
                            flightScore={flightScore}
                            onHoleClick={handleHoleClick}
                            pendingScores={{}}
                            scrollToHole={lastSavedHole}
                        />

                        <div className="p-4 mt-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h4 className="text-blue-800 text-xs font-bold uppercase mb-1">Scoring Info</h4>
                                <p className="text-blue-600 text-[11px] leading-relaxed">
                                    Tap on any hole column header or score cell to enter scores.
                                    The card will update automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {openHole !== null && flightScore && (
                <ScoreEntryModal
                    isOpen={true}
                    holeNumber={openHole}
                    par={currentPar}
                    players={modalPlayers}
                    initialScores={initialScores}
                    onSave={handleSaveModal}
                    onClose={() => setOpenHole(null)}
                    isSaving={isSaving}
                    error={submitError}
                />
            )}
        </div>
    );
}
