'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useMyEvents } from '@/hooks/useEvents';
import { useLeaderboard, Match } from '@/hooks/useLeaderboard';
import { TeamScoreHeader } from '@/components/TeamScoreHeader';
import { ProjectedStickyHeader } from '@/components/ProjectedStickyHeader';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { CompletedBreakdown } from '@/components/CompletedBreakdown';
import { MatchCard } from '@/components/MatchCard';
import { DetailedScorecard } from '@/components/DetailedScorecard';
import { EventVisualHeader } from '@/components/EventVisualHeader';
import { PullToRefresh } from '@/components/PullToRefresh';
import Image from 'next/image';

export default function LeaderboardPage() {
    const { events, isLoading: eventsLoading } = useMyEvents();
    const router = useRouter();
    const { user } = useAuth();

    const activeEvent = useMemo(() => {
        if (!events || events.length === 0) return null;
        return events.find(e => e.status === 'live') || events[0];
    }, [events]);

    const eventId = activeEvent?.id || '';
    const { data: leaderboardData, isLoading: scoresLoading, error, refetch } = useLeaderboard(eventId);

    const [showCurrentDetails, setShowCurrentDetails] = useState(false);
    const [showProjectedDetails, setShowProjectedDetails] = useState(false);
    const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'singles' | 'fourball' | 'scramble'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'finished'>('all');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isLoading = eventsLoading || (eventId && scoresLoading);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-team-blue mb-4"></div>
                <p className="text-gray-500 text-sm">Cargando marcador...</p>
            </div>
        );
    }

    if (!activeEvent) {
        return (
            <div className="p-8 text-center min-h-screen bg-gray-50 pt-20">
                <p className="text-gray-500 mb-4">No se encontró un evento activo.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500 min-h-screen bg-gray-50">
                {error}
            </div>
        );
    }

    // Fallback logic
    const fallbackData = {
        totalScore: { red: 0, blue: 0 },
        projectedScore: { red: 0, blue: 0 },
        segmentScores: {
            singles: { red: 0, blue: 0 },
            fourball: { red: 0, blue: 0 },
            scramble: { red: 0, blue: 0 },
        },
        momentum: 'neutral' as const,
        matches: [] as Match[],
        updatedAt: new Date().toISOString(),
    };

    const leaderboard = leaderboardData || fallbackData;

    // Filter Logic
    const filteredMatches = leaderboard.matches.filter(match => {
        const matchesType = filterType === 'all' ||
            (filterType === 'singles' && match.segmentType.startsWith('singles')) ||
            match.segmentType === filterType;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'live' && match.status !== 'completed' && match.status !== 'not_started') ||
            (statusFilter === 'finished' && match.status === 'completed');

        const searchLower = searchQuery.toLowerCase();
        const matchesName = !searchQuery ||
            match.redPlayers.some(p => p.playerName.toLowerCase().includes(searchLower)) ||
            match.bluePlayers.some(p => p.playerName.toLowerCase().includes(searchLower));
        return matchesType && matchesStatus && matchesName;
    });

    // Extract all player names for autocomplete
    const allPlayerNames = Array.from(new Set(
        leaderboard.matches.flatMap(m => [...m.redPlayers, ...m.bluePlayers].map(p => p.playerName.replace(/-$/, '').trim()))
    )).sort();

    const suggestedNames = searchQuery
        ? allPlayerNames.filter(n => n.toLowerCase().includes(searchQuery.toLowerCase()))
        : allPlayerNames;

    return (
        <PullToRefresh onRefresh={async () => { await refetch(); }}>
            <div className="flex flex-col min-h-full bg-gray-50 pb-20">
                {/* Custom Visual Header */}
                <EventVisualHeader />

                {user?.appRole === 'admin' && (
                    <div className="absolute top-4 right-4 z-50">
                        <Link href={`/admin/events/${eventId}/players`} className="bg-white/90 text-team-blue text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition">
                            Gestionar Jugadores
                        </Link>
                    </div>
                )}

                {/* Content Spacer for Logo Overlap */}
                <div className="h-20 bg-gray-50"></div>

                {/* Static Score Header - Scrolls Away */}
                <TeamScoreHeader
                    redScore={leaderboard.totalScore.red}
                    blueScore={leaderboard.totalScore.blue}
                    projectedRed={leaderboard.projectedScore.red}
                    projectedBlue={leaderboard.projectedScore.blue}
                    isCurrentExpanded={showCurrentDetails}
                    onToggleCurrent={() => {
                        setShowCurrentDetails(!showCurrentDetails);
                        if (showProjectedDetails) setShowProjectedDetails(false);
                    }}
                    currentDetailContent={
                        <CompletedBreakdown segmentScores={leaderboard.segmentScores} />
                    }
                    isProjectedExpanded={showProjectedDetails}
                    onToggleProjected={() => {
                        setShowProjectedDetails(!showProjectedDetails);
                        if (showCurrentDetails) setShowCurrentDetails(false);
                    }}
                    projectedDetailContent={
                        <ScoreBreakdown
                            segmentScores={leaderboard.segmentScores}
                            matches={leaderboard.matches}
                            onMatchClick={(match) => {
                                setSearchQuery(match.redPlayers[0].playerName.replace(/-$/, '').trim());
                                setFilterType(match.segmentType as any);
                                setShowProjectedDetails(false);
                            }}
                        />
                    }
                    // We hide the internal projected section to use the sticky one below
                    showProjected={false}
                    detachedBottom={true} // Removes bottom radius/padding to merge with sticky header
                />

                {/* Sticky Container */}
                <div className="sticky top-0 z-50 bg-gray-50 pb-2 shadow-sm transition-all duration-300">
                    <ProjectedStickyHeader
                        projectedRed={leaderboard.projectedScore.red}
                        projectedBlue={leaderboard.projectedScore.blue}
                        detachedTop={true} // Removes top radius/padding to merge with static header
                        isExpanded={showProjectedDetails}
                        onToggle={() => {
                            setShowProjectedDetails(!showProjectedDetails);
                            if (showCurrentDetails) setShowCurrentDetails(false);
                        }}
                        detailContent={
                            <ScoreBreakdown
                                segmentScores={leaderboard.segmentScores}
                                matches={leaderboard.matches}
                                onMatchClick={(match) => {
                                    setSearchQuery(match.redPlayers[0].playerName.replace(/-$/, '').trim());
                                    setFilterType(match.segmentType as any);
                                    setShowProjectedDetails(false);
                                }}
                            />
                        }
                    />
                    {leaderboard.matches.length > 0 && (
                        <div className="px-4 mt-2 mb-2 space-y-3">
                            {/* Searchable Dropdown */}
                            <div className="relative z-40">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar jugador..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click
                                        className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-team-blue/20 focus:border-team-blue transition-all"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                    </span>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown List */}
                                {isSearchFocused && suggestedNames.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                                        {suggestedNames.map((name, i) => (
                                            <div
                                                key={i}
                                                onClick={() => { setSearchQuery(name); setIsSearchFocused(false); }}
                                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                            >
                                                {name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Optimized Filter Row */}
                            <div className="flex items-center justify-between gap-3">
                                {/* Status Pills */}
                                <div className="flex gap-1.5">
                                    {['all', 'live', 'finished'].map(status => {
                                        const statusLabels: Record<string, string> = { all: 'Todo', live: 'Vivo', finished: 'Final' };
                                        return (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status as any)}
                                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${statusFilter === status
                                                ? 'bg-gray-800 text-white shadow-sm'
                                                : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            {statusLabels[status]}
                                        </button>
                                    );
                                    })}
                                </div>

                                {/* Match Type Dropdown */}
                                <div className="relative">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-team-blue/20 focus:border-team-blue transition-all cursor-pointer"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="singles">Indiv.</option>
                                        <option value="fourball">M. Bola</option>
                                        <option value="scramble">Scramble</option>
                                    </select>
                                    {/* Dropdown Arrow */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Match List */}
                <div className="px-4 pb-4">
                    {leaderboard.matches.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>Aún no hay partidos.</p>
                            <p className="text-sm mt-2">Los partidos aparecerán aquí una vez se creen los grupos.</p>
                        </div>
                    ) : (
                        <div>

                            {/* Filtered List */}
                            {filteredMatches.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100 border-dashed">
                                    No se encontraron partidos con esos filtros.
                                </div>
                            ) : (
                                <div className="space-y-8 pb-32 mt-4">
                                    {['singles', 'fourball', 'scramble'].map((type) => {
                                        const typeLabels: Record<string, string> = { singles: 'Individual', fourball: 'Mejor Bola', scramble: 'Scramble' };
                                        const typeMatches = filteredMatches
                                            .filter(m => type === 'singles' ? m.segmentType.startsWith('singles') : m.segmentType.toLowerCase() === type)
                                            .sort((a, b) => {
                                                // Sort 'not_started' to the bottom
                                                const aNotStarted = a.status === 'not_started';
                                                const bNotStarted = b.status === 'not_started';

                                                if (aNotStarted && !bNotStarted) return 1;
                                                if (!aNotStarted && bNotStarted) return -1;

                                                // Default to original order (Flight ID)
                                                return 0;
                                            });

                                        if (typeMatches.length === 0) return null;

                                        return (
                                            <div key={type}>
                                                <h3 className="px-1 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2 border-l-4 border-gray-200">
                                                    {typeLabels[type]} <span className="text-gray-300 font-normal ml-1">({typeMatches.length})</span>
                                                </h3>
                                                <div className="space-y-3">
                                                    {typeMatches.map((match) => (
                                                        <div key={match.id}>
                                                            <MatchCard
                                                                match={match}
                                                                onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                                                            />
                                                            {expandedMatch === match.id && (
                                                                <div className="bg-white rounded-xl shadow-sm p-4 mt-2 overflow-x-auto">
                                                                    <DetailedScorecard
                                                                        match={match}
                                                                        onClose={() => setExpandedMatch(null)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Last Updated */}
                <div className="px-4 pb-4 text-center text-xs text-gray-400 mb-16">
                    Última actualización: {new Date(leaderboard.updatedAt).toLocaleTimeString('es-CO')}
                </div>
            </div>
        </PullToRefresh>
    );
}
