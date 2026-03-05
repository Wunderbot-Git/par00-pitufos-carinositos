'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface InviteDetails {
    inviteId: string;
    eventId: string;
    eventName?: string;
    playerId: string;
    playerName: string;
}

export default function InviteClaimPage() {
    const params = useParams();
    const inviteId = params.inviteId as string;
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const data = await api.get<InviteDetails>(`/invites/${inviteId}`);
                setInviteDetails(data);
            } catch (err: any) {
                setError(err.message || 'Invalid or expired invite link.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvite();
    }, [inviteId]);

    const handleClaim = async () => {
        if (!user) {
            router.push('/login?redirect=/invite/' + inviteId);
            return;
        }

        setIsClaiming(true);
        try {
            await api.post(`/invites/${inviteId}/claim`, {});
            alert('Success! You have claimed this player profile.');
            router.push(`/events/${inviteDetails?.eventId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to claim role.');
        } finally {
            setIsClaiming(false);
        }
    };

    if (isLoading || authLoading) return <div className="p-8 text-center text-gray-500">Verifying invite...</div>;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-lg font-bold text-red-800 mb-2">Oops!</h2>
                    <p className="text-red-600">{error}</p>
                    <Link href="/" className="mt-6 inline-block text-team-blue hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!inviteDetails) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
            <div className="bg-white border rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-blue-100 text-team-blue rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
                <p className="text-gray-600 mb-6 flex flex-col gap-1">
                    <span>You have been invited to play as:</span>
                    <strong className="text-xl text-gray-900">{inviteDetails.playerName}</strong>
                    {inviteDetails.eventName && (
                        <span>in <span className="font-semibold text-team-blue">{inviteDetails.eventName}</span></span>
                    )}
                </p>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-8 text-sm text-gray-600">
                    By claiming this profile, your account will be linked to this player's stats and scoring permissions.
                </div>

                {!user ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 font-medium">Please log in or sign up to claim your profile.</p>
                        <div className="flex gap-3">
                            <Link href={`/login?redirect=/invite/${inviteId}`} className="flex-1 bg-team-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                                Log In
                            </Link>
                            <Link href={`/signup?redirect=/invite/${inviteId}`} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition">
                                Sign Up
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-500 mb-4">
                            Logged in as <strong className="text-gray-900">{user.email}</strong>.
                        </p>
                        <button
                            onClick={handleClaim}
                            disabled={isClaiming}
                            className="w-full bg-team-blue text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isClaiming ? 'Claiming...' : 'Claim Profile Now'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
