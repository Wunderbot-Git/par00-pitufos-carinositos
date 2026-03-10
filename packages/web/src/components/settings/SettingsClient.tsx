'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useMyEvents } from '@/hooks/useEvents';
import { usePlayers } from '@/hooks/usePlayers';
import { AccountSection } from './AccountSection';
import { EventSection } from './EventSection';
import { AdminSection } from './AdminSection';
import { AppInfoSection } from './AppInfoSection';

export function SettingsClient() {
    const { user } = useAuth();
    const { events, isLoading: eventsLoading, refetch: refetchEvents } = useMyEvents();

    const activeEvent = useMemo(() => {
        if (!events || events.length === 0) return null;
        return events.find(e => e.status === 'live') || events[0];
    }, [events]);

    const eventId = activeEvent?.id || '';
    const { players } = usePlayers(eventId);

    const myPlayer = useMemo(() => {
        if (!user || !players) return null;
        const p = players.find(p => p.userId === user.id);
        if (!p) return null;
        return {
            playerName: p.playerName || `${p.firstName} ${p.lastName}`,
            team: p.team as 'red' | 'blue',
            handicapIndex: p.handicapIndex,
        };
    }, [user, players]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
            <header className="bg-slate-800 text-white flex-shrink-0 z-50 shadow-md">
                <div className="flex items-center gap-3 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <h1 className="text-[13px] font-black uppercase tracking-widest text-white/90">Ajustes</h1>
                </div>
            </header>

            <main className="flex-1 overflow-auto px-4 py-4 space-y-4">
                <AccountSection player={myPlayer} />

                <EventSection
                    events={events}
                    activeEvent={activeEvent}
                    onEventJoined={refetchEvents}
                />

                {user?.appRole === 'admin' && eventId && (
                    <AdminSection eventId={eventId} />
                )}

                <AppInfoSection />
            </main>
        </div>
    );
}
