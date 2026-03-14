'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function GaugeIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 14 4-4" />
            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>
    );
}

function EditIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function SettingsIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function BettingIcon({ isActive }: { isActive: boolean }) {
    return (
        <Image
            src="/images/apuestas-icon.png"
            alt="Apuestas"
            width={22}
            height={22}
            className={isActive ? 'opacity-100' : 'opacity-60'}
            style={isActive ? {
                filter: 'brightness(0) saturate(100%) invert(63%) sepia(80%) saturate(500%) hue-rotate(15deg) brightness(95%)',
            } : undefined}
        />
    );
}

const navItems = [
    { href: '/leaderboard', label: 'Marcador', Icon: GaugeIcon },
    { href: '/score', label: 'Scores', Icon: EditIcon },
    { href: '/apuestas', label: 'Apuestas', Icon: BettingIcon },
    { href: '/settings', label: 'Ajustes', Icon: SettingsIcon },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed bottom-4 left-3 right-3 max-w-md mx-auto z-50 overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.6)',
                borderTop: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
        >
            {/* No gloss needed — the frosted glass itself is bright */}

            <div className="flex justify-around items-center h-16 relative z-10">
                {navItems.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 rounded-2xl"
                            style={{
                                color: isActive ? '#c8a200' : '#1a1a3e',
                                background: isActive
                                    ? 'rgba(240,200,80,0.15)'
                                    : 'transparent',
                                transform: isActive ? 'translateY(-1px)' : 'none',
                                opacity: isActive ? 1 : 0.65,
                            }}
                        >
                            <item.Icon isActive={isActive || false} />
                            <span
                                className="text-[10px] mt-0.5 font-bangers tracking-wider"
                                style={{ color: isActive ? '#c8a200' : '#1a1a3e' }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
