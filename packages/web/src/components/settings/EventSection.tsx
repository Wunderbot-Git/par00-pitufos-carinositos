'use client';

import { useState } from 'react';
import { useJoinEvent } from '@/hooks/useEvents';

interface EventInfo {
    id: string;
    name: string;
    status: 'draft' | 'live' | 'completed' | 'closed';
    eventCode: string;
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    live: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-600',
    closed: 'bg-slate-100 text-slate-500',
};

export function EventSection({ events, activeEvent, onEventJoined }: {
    events: EventInfo[];
    activeEvent: EventInfo | null;
    onEventJoined: () => void;
}) {
    const { joinEvent, isLoading: joinLoading, error: joinError } = useJoinEvent();
    const [joinCode, setJoinCode] = useState('');
    const [joinSuccess, setJoinSuccess] = useState(false);

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        const result = await joinEvent(joinCode.trim());
        if (result) {
            setJoinCode('');
            setJoinSuccess(true);
            onEventJoined();
            setTimeout(() => setJoinSuccess(false), 3000);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Events</h2>

            {/* Active event */}
            {activeEvent && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-800">{activeEvent.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[activeEvent.status] || STATUS_COLORS.draft}`}>
                            {activeEvent.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">
                        Code: <span className="font-mono font-bold text-gray-600">{activeEvent.eventCode}</span>
                    </p>
                </div>
            )}

            {/* Other events */}
            {events.length > 1 && (
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Events</p>
                    <div className="space-y-2">
                        {events.filter(e => e.id !== activeEvent?.id).map(event => (
                            <div key={event.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">{event.name}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[event.status] || STATUS_COLORS.draft}`}>
                                    {event.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Join event */}
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Join Event</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Event code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    <button
                        onClick={handleJoin}
                        disabled={joinLoading || !joinCode.trim()}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                        {joinLoading ? '...' : 'Join'}
                    </button>
                </div>
                {joinError && <p className="text-xs text-red-500 mt-1">{joinError}</p>}
                {joinSuccess && <p className="text-xs text-green-500 mt-1">Joined successfully!</p>}
            </div>
        </div>
    );
}
