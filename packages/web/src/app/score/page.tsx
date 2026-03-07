'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
    const [activeSegment, setActiveSegment] = useState<'bestball' | 'scramble'>('bestball');

    const isLoading = eventsLoading || playersLoading || (flightId ? scoresLoading : false);

    const handleHoleClick = (hole: number) => {
        setOpenHole(hole);
        // Clear previous errors when opening new hole
        // But useSubmitScores doesn't expose clearError? It clears on new submit.
    };

    const handleSaveModal = async (scores: Record<string, number | null>) => {
        if (!flightScore || openHole === null || !flightId) return;

        const isScrambleHole = openHole > 9;

        // Convert record to array
        const batch = Object.entries(scores).map(([id, score]) => {
            if (isScrambleHole) {
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

    // Prepare data for modal — determine by hole number, not segmentType
    const isScrambleModal = openHole !== null && openHole > 9;

    const modalPlayers = openHole && flightScore ? (
        isScrambleModal ? [
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
        <div className="flex flex-col h-[100dvh] bg-gray-50 pb-16 overflow-hidden">
            <header className={`${headerBgClass} text-white flex-shrink-0 z-50 shadow-md transition-colors duration-500`}>
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {flightScore && (
                            <span className={`inline-block border px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${currentLeader === 'red' ? 'bg-rose-100 border-rose-200 text-rose-700' :
                                    currentLeader === 'blue' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                        'bg-slate-100 border-slate-200 text-slate-500'
                                }`}>
                                {flightScore.matchStatus || 'LIVE'}
                            </span>
                        )}
                        {eventId && (
                            <Link href={`/admin/events/${eventId}/players`} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </Link>
                        )}
                    </div>
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


            <main className="flex-1 overflow-hidden">
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
                        {/* Segment Toggle */}
                        <div className="flex gap-2 px-4 pt-3 pb-2">
                            <button
                                onClick={() => setActiveSegment('bestball')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                    activeSegment === 'bestball'
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'bg-slate-200 text-slate-500'
                                }`}
                            >
                                Bestball (1-9)
                                {flightScore.fourballStatus && flightScore.fourballStatus !== 'Not Started' && (
                                    <span className="ml-1.5 text-[9px] opacity-70">{flightScore.fourballStatus}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveSegment('scramble')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                    activeSegment === 'scramble'
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'bg-slate-200 text-slate-500'
                                }`}
                            >
                                Scramble (10-18)
                                {flightScore.scrambleStatus && flightScore.scrambleStatus !== 'Not Started' && (
                                    <span className="ml-1.5 text-[9px] opacity-70">{flightScore.scrambleStatus}</span>
                                )}
                            </button>
                        </div>

                        <ScoreGrid
                            flightScore={{ ...flightScore, segmentType: activeSegment === 'bestball' ? 'fourball' : 'scramble' }}
                            onHoleClick={handleHoleClick}
                            pendingScores={{}}
                            scrollToHole={lastSavedHole}
                        />
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
