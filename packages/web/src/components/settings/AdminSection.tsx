'use client';

import Link from 'next/link';

export function AdminSection({ eventId }: { eventId: string }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Admin</h2>
            <Link
                href={`/admin/events/${eventId}/players`}
                className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Manage Players</p>
                    <p className="text-[10px] text-gray-400">Edit players, generate invites, manage teams</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </Link>
        </div>
    );
}
