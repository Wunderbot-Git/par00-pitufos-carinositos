'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    team: 'red' | 'blue';
    userId?: string | null;
}

export default function AdminPlayersPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});

    useEffect(() => {
        if (authLoading) return;

        // This is a naive check. A real app would redirect non-admins instantly.
        if (user?.appRole !== 'admin') {
            router.push('/');
            return;
        }

        const fetchPlayers = async () => {
            try {
                // We'll reuse the existing public players fetching logic or build a new one
                // Currently, `GET /events/:id/players` returns public info. 
                // That should have id, first_name, last_name, team. 
                // We will assume that exists and has basic data.
                const data = await api.get<Player[]>(`/events/${eventId}/players`);
                setPlayers(data);
            } catch (err) {
                setError('Failed to load players');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayers();
    }, [eventId, user, authLoading, router]);

    const generateInvite = async (playerId: string) => {
        try {
            const res = await api.post<{ inviteId: string }>(`/admin/events/${eventId}/players/${playerId}/invite`, {});
            const inviteUrl = `${window.location.origin}/invite/${res.inviteId}`;
            setGeneratedLinks(prev => ({ ...prev, [playerId]: inviteUrl }));
        } catch (err: any) {
            alert(err.message || 'Failed to generate invite');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Link copied to clipboard!');
    };

    if (authLoading || isLoading) return <div className="p-8 text-center">Loading Admin Panel...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <ProtectedRoute>
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                <h1 className="text-2xl font-bold mb-6">Manage Event Players</h1>
                <p className="text-gray-600 mb-8">Generate invite links for players so they can claim their profiles.</p>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Team</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {players.map(player => (
                                <tr key={player.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        {player.firstName || ''} {player.lastName || ''}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${player.team === 'red' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {player.team.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {player.userId ? (
                                            <span className="text-green-600 text-sm font-semibold">Claimed</span>
                                        ) : (
                                            <span className="text-orange-500 text-sm font-semibold">Unclaimed</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {player.userId ? (
                                            <span className="text-gray-400 text-sm">Linked</span>
                                        ) : generatedLinks[player.id] ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={generatedLinks[player.id]}
                                                    className="text-xs p-1 border rounded w-32 bg-gray-50"
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(generatedLinks[player.id])}
                                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => generateInvite(player.id)}
                                                className="text-sm bg-team-blue text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Generate Link
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ProtectedRoute>
    );
}
