'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useUpdateName, useChangePassword } from '@/hooks/useProfile';

interface PlayerInfo {
    playerName: string;
    team: 'red' | 'blue';
    handicapIndex: number;
}

export function AccountSection({ player }: { player: PlayerInfo | null }) {
    const { user, logout, refreshUser } = useAuth();
    const { updateName, isLoading: nameLoading, error: nameError } = useUpdateName();
    const { changePassword, isLoading: pwLoading, error: pwError, success: pwSuccess } = useChangePassword();

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSaveName = async () => {
        const success = await updateName(newName);
        if (success) {
            await refreshUser();
            setIsEditingName(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) return;
        const success = await changePassword(currentPassword, newPassword);
        if (success) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordChange(false);
        }
    };

    if (!user) return null;

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account</h2>

                {/* User info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        player?.team === 'red' ? 'bg-rose-500' : player?.team === 'blue' ? 'bg-blue-500' : 'bg-slate-400'
                    }`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    autoFocus
                                />
                                <button onClick={handleSaveName} disabled={nameLoading} className="text-xs font-bold text-blue-600 px-2 py-1">
                                    {nameLoading ? '...' : 'Save'}
                                </button>
                                <button onClick={() => { setIsEditingName(false); setNewName(user.name); }} className="text-xs text-gray-400 px-1">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{user.name}</span>
                                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>

                {nameError && <p className="text-xs text-red-500 mb-3">{nameError}</p>}

                {/* Player info */}
                {player && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Player Profile</p>
                                <p className="text-sm font-bold text-gray-800">{player.playerName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    player.team === 'red' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {player.team === 'red' ? 'Red' : 'Blue'}
                                </span>
                                <span className="text-xs text-gray-500 font-semibold">HCP {player.handicapIndex}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change password */}
                <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="w-full text-left text-sm font-semibold text-gray-600 py-2 flex items-center justify-between"
                >
                    Change Password
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showPasswordChange ? 'rotate-180' : ''}`}>
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>

                {showPasswordChange && (
                    <div className="space-y-2 pb-2">
                        <input
                            type="password"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                        <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                        {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                        {pwSuccess && <p className="text-xs text-green-500">Password changed successfully</p>}
                        <button
                            onClick={handleChangePassword}
                            disabled={pwLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="w-full py-2 bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                        >
                            {pwLoading ? 'Changing...' : 'Update Password'}
                        </button>
                    </div>
                )}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-4">
                <button
                    onClick={logout}
                    className="w-full py-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm font-bold"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
