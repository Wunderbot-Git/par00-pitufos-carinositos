'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const ADMIN_PASSWORD = 'Qayedc-1';
const ADMIN_KEY = 'admin_authenticated';

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    handicapIndex: number;
    teeId: string;
    team: 'red' | 'blue';
    flightId?: string;
    position?: number;
    userId?: string | null;
}

interface Tee {
    id?: string;
    name: string;
}

interface Course {
    id: string;
    eventId: string;
    name: string;
    tees: Tee[];
}

function EditPlayerModal({ player, tees, eventId, onSaved, onClose }: {
    player: Player;
    tees: Tee[];
    eventId: string;
    onSaved: (updated: Player) => void;
    onClose: () => void;
}) {
    const [firstName, setFirstName] = useState(player.firstName);
    const [lastName, setLastName] = useState(player.lastName);
    const [handicap, setHandicap] = useState(String(player.handicapIndex));
    const [teeId, setTeeId] = useState(player.teeId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const hcp = parseFloat(handicap);
        if (isNaN(hcp) || hcp < -10 || hcp > 54) {
            setError('Handicap must be between -10 and 54');
            return;
        }
        if (!firstName.trim() || !lastName.trim()) {
            setError('Name cannot be empty');
            return;
        }
        try {
            setSaving(true);
            setError('');
            const updated = await api.put<Player>(`/events/${eventId}/players/${player.id}`, {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                handicapIndex: hcp,
                teeId,
            });
            onSaved(updated);
            onClose();
        } catch {
            setError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl p-5 pb-8 sm:pb-5">
                <h3 className="text-base font-bold text-gray-800 mb-4">Edit Player</h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Handicap</label>
                        <input
                            type="number"
                            step="0.1"
                            min="-10"
                            max="54"
                            value={handicap}
                            onChange={(e) => setHandicap(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tee</label>
                        <select
                            value={teeId}
                            onChange={(e) => setTeeId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                        >
                            {tees.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminLoginGate({ onAuthenticated }: { onAuthenticated: () => void }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem(ADMIN_KEY, 'true');
            onAuthenticated();
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-black uppercase tracking-wider">Admin Access</h1>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest">Authentication Required</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Back
                </button>
            </header>
            <div className="flex-1 flex items-center justify-center p-4">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Admin Login</h2>
                        <p className="text-xs text-gray-500 mt-1">Enter admin password to continue</p>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 mb-3"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors"
                    >
                        Enter
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AdminPlayersPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const router = useRouter();

    const [authenticated, setAuthenticated] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [tees, setTees] = useState<Tee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    // Check if already authenticated in this session
    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem(ADMIN_KEY) === 'true') {
            setAuthenticated(true);
        }
    }, []);

    // Fetch players once authenticated
    useEffect(() => {
        if (!authenticated) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [playersData, courseData] = await Promise.all([
                    api.get<Player[]>(`/events/${eventId}/players`),
                    api.get<Course>(`/events/${eventId}/course`).catch(() => null),
                ]);
                setPlayers(playersData);
                if (courseData) setTees(courseData.tees);
            } catch (err) {
                setError('Failed to load players');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [eventId, authenticated]);

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

    const handlePlayerSaved = (updated: Player) => {
        setPlayers(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    };

    const getTeeName = (teeId: string) => {
        const tee = tees.find(t => t.id === teeId);
        return tee ? tee.name : '—';
    };

    if (!authenticated) {
        return <AdminLoginGate onAuthenticated={() => setAuthenticated(true)} />;
    }

    if (isLoading) return <div className="p-8 text-center">Loading players...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const redPlayers = players.filter(p => p.team === 'red');
    const bluePlayers = players.filter(p => p.team === 'blue');

    const renderTeamSection = (team: 'red' | 'blue', teamPlayers: Player[]) => (
        <div className="mb-6">
            <h2 className={`text-sm font-black uppercase tracking-widest px-4 py-2 ${team === 'red' ? 'text-rose-600 bg-rose-50' : 'text-blue-600 bg-blue-50'} rounded-t-xl`}>
                {team === 'red' ? 'Cariñositos' : 'Pitufos'} ({teamPlayers.length})
            </h2>
            <div className="bg-white rounded-b-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">HCP</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Tee</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Invite</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {teamPlayers.map(player => (
                            <tr key={player.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setEditingPlayer(player)}>
                                <td className="px-4 py-3 text-sm font-medium">
                                    {player.firstName} {player.lastName}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold">
                                    {player.handicapIndex}
                                </td>
                                <td className="px-4 py-3 text-center text-xs text-gray-500">
                                    {getTeeName(player.teeId)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {player.userId ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Claimed</span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">Unclaimed</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    {player.userId ? (
                                        <span className="text-gray-400 text-xs">Linked</span>
                                    ) : generatedLinks[player.id] ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={generatedLinks[player.id]}
                                                className="text-xs p-1 border rounded w-28 bg-gray-50"
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
                                            className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
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
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-black uppercase tracking-wider">Player Management</h1>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest">Admin Panel</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Back
                </button>
            </header>

            <div className="max-w-2xl mx-auto p-4 pt-6">
                {renderTeamSection('red', redPlayers)}
                {renderTeamSection('blue', bluePlayers)}
            </div>

            {editingPlayer && (
                <EditPlayerModal
                    player={editingPlayer}
                    tees={tees}
                    eventId={eventId}
                    onSaved={handlePlayerSaved}
                    onClose={() => setEditingPlayer(null)}
                />
            )}
        </div>
    );
}
