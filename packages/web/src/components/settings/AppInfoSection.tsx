'use client';

import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '@/lib/sync';
import { db } from '@/lib/db';

const STATUS_LABELS: Record<SyncStatus, { label: string; color: string; dot: string }> = {
    online: { label: 'En línea', color: 'text-green-600', dot: 'bg-green-500' },
    offline: { label: 'Sin conexión', color: 'text-gray-500', dot: 'bg-gray-400' },
    syncing: { label: 'Sincronizando...', color: 'text-yellow-600', dot: 'bg-yellow-500' },
    error: { label: 'Error de sincronización', color: 'text-red-600', dot: 'bg-red-500' },
};

export function AppInfoSection() {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
    const [pendingCount, setPendingCount] = useState(syncService.getPendingCount());
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const unsubscribe = syncService.subscribe((status, pending) => {
            setSyncStatus(status);
            setPendingCount(pending);
            if (status !== 'syncing') setIsSyncing(false);
        });
        return unsubscribe;
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        await syncService.sync();
    };

    const handleClearCache = async () => {
        if (!window.confirm('¿Borrar todos los datos locales? Esto eliminará scores y eventos en caché. Los elementos pendientes de sincronización también se borrarán.')) {
            return;
        }
        await db.clearAll();
        window.location.reload();
    };

    const statusInfo = STATUS_LABELS[syncStatus];

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">App</h2>

            {/* Sync status */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                    <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                    {pendingCount > 0 && (
                        <span className="text-[10px] text-gray-400 font-medium">({pendingCount} pendientes)</span>
                    )}
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing || syncStatus === 'offline'}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
            </div>

            {/* Clear cache */}
            <button
                onClick={handleClearCache}
                className="w-full py-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors mb-3"
            >
                Borrar Datos Locales
            </button>

            {/* Version */}
            <p className="text-[10px] text-gray-300 text-center">Ryder Cup Par00 v1.0.0</p>
        </div>
    );
}
