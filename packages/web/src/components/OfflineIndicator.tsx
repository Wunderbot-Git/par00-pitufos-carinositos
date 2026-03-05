'use client';

import { useSync } from '@/lib/syncContext';

export function OfflineIndicator() {
    const { status, pendingCount, sync } = useSync();

    // Don't show if online and synced
    if (status === 'online' && pendingCount === 0) {
        return null;
    }

    const statusConfig = {
        online: {
            bg: 'bg-green-500',
            text: 'All synced',
            icon: '✓',
        },
        offline: {
            bg: 'bg-yellow-500',
            text: pendingCount > 0 ? `Offline - ${pendingCount} pending` : 'Offline',
            icon: '⚡',
        },
        syncing: {
            bg: 'bg-blue-500',
            text: 'Syncing...',
            icon: '↻',
        },
        error: {
            bg: 'bg-red-500',
            text: `Sync error - ${pendingCount} pending`,
            icon: '!',
        },
    };

    const config = statusConfig[status];

    const handleClick = async () => {
        if (status !== 'syncing') {
            await sync();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={status === 'syncing'}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 ${config.bg} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium z-40`}
        >
            <span className={status === 'syncing' ? 'animate-spin' : ''}>{config.icon}</span>
            <span>{config.text}</span>
        </button>
    );
}
