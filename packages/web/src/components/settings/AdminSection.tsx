'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useDeleteScores } from '@/hooks/useScores';

interface Flight {
    id: string;
    flightNumber: number;
    players: { id: string; playerName: string; team: string }[];
}

export function AdminSection({ eventId }: { eventId: string }) {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loadingFlights, setLoadingFlights] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [holeInputs, setHoleInputs] = useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const { deleteFlightScores, deleteHoleScores, isDeleting, error } = useDeleteScores();

    useEffect(() => {
        if (showScores && flights.length === 0) {
            setLoadingFlights(true);
            api.get<Flight[]>(`/events/${eventId}/flights`)
                .then(setFlights)
                .catch(() => {})
                .finally(() => setLoadingFlights(false));
        }
    }, [showScores, eventId, flights.length]);

    const handleDeleteAll = async (flight: Flight) => {
        if (!window.confirm(`¿Eliminar TODOS los scores del Grupo ${flight.flightNumber}? Esto no se puede deshacer.`)) return;
        const success = await deleteFlightScores(eventId, flight.id);
        if (success) {
            setSuccessMsg(`Todos los scores eliminados del Grupo ${flight.flightNumber}`);
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    };

    const handleDeleteHole = async (flight: Flight) => {
        const hole = parseInt(holeInputs[flight.id] || '', 10);
        if (isNaN(hole) || hole < 1 || hole > 18) {
            alert('Ingresa un número de hoyo entre 1 y 18');
            return;
        }
        if (!window.confirm(`¿Eliminar scores del Hoyo ${hole} en Grupo ${flight.flightNumber}?`)) return;
        const success = await deleteHoleScores(eventId, flight.id, hole);
        if (success) {
            setHoleInputs(prev => ({ ...prev, [flight.id]: '' }));
            setSuccessMsg(`Scores del Hoyo ${hole} eliminados del Grupo ${flight.flightNumber}`);
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    };

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
                    <p className="text-sm font-bold text-gray-800">Gestionar Jugadores</p>
                    <p className="text-[10px] text-gray-400">Editar jugadores, generar invitaciones, gestionar equipos</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </Link>

            {/* Score Management */}
            <button
                onClick={() => setShowScores(!showScores)}
                className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors w-full mt-2"
            >
                <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </div>
                <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-800">Gestionar Scores</p>
                    <p className="text-[10px] text-gray-400">Eliminar scores por grupo o hoyo</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-300 transition-transform ${showScores ? 'rotate-90' : ''}`}>
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </button>

            {showScores && (
                <div className="mt-3 space-y-3">
                    {loadingFlights ? (
                        <p className="text-xs text-gray-400 text-center py-2">Cargando grupos...</p>
                    ) : flights.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No se encontraron grupos</p>
                    ) : (
                        flights.map(flight => (
                            <div key={flight.id} className="bg-gray-50 rounded-xl p-3">
                                <p className="text-sm font-bold text-gray-700 mb-2">Grupo {flight.flightNumber}</p>
                                <div className="flex gap-2 items-center mb-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={18}
                                        placeholder="Hoyo #"
                                        value={holeInputs[flight.id] || ''}
                                        onChange={e => setHoleInputs(prev => ({ ...prev, [flight.id]: e.target.value }))}
                                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    />
                                    <button
                                        onClick={() => handleDeleteHole(flight)}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-orange-200 transition-colors"
                                    >
                                        Borrar Hoyo
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAll(flight)}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-red-200 transition-colors ml-auto"
                                    >
                                        Borrar Todo
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {successMsg && <p className="text-xs text-green-600 font-semibold">{successMsg}</p>}
                </div>
            )}
        </div>
    );
}
