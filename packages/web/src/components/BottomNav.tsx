'use client';

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

function BettingIcon({ }: { isActive: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100" fill="currentColor">
            <path d="M40.11,58.94a9.15,9.15,0,0,1,7.39-9V48a2.5,2.5,0,0,1,5,0v2a9.85,9.85,0,0,1,6.63,5.73,2.5,2.5,0,0,1-4.61,1.93,4.88,4.88,0,0,0-4.51-3c-2.36,0-4.89,1.34-4.89,4.28,0,.77,0,3.09,5.45,4.34h.08c8,1.87,9.25,6.56,9.25,9.19a9.15,9.15,0,0,1-7.39,9v2a2.5,2.5,0,1,1-5,0v-2a9.85,9.85,0,0,1-6.63-5.73,2.5,2.5,0,1,1,4.61-1.93,4.89,4.89,0,0,0,4.52,3c2.36,0,4.89-1.34,4.89-4.28,0-.77,0-3.09-5.45-4.34h-.08C41.31,66.27,40.11,61.58,40.11,58.94Zm18-34.31A2.5,2.5,0,0,0,61.56,24l8.61-12.26a2.51,2.51,0,0,0-.46-3.37C58.65-.81,41.33-.8,30.28,8.4a2.5,2.5,0,0,0-.45,3.36L38.44,24a2.5,2.5,0,0,0,4.09-2.87L35.31,10.86a26.7,26.7,0,0,1,29.38,0L57.47,21.15a2.5,2.5,0,0,0,.61,3.48ZM16.33,73.32A56.84,56.84,0,0,1,36.54,30a2.5,2.5,0,0,1,1.61-.59H61.84a2.5,2.5,0,0,1,1.61.59A56.84,56.84,0,0,1,83.67,73.32v7.11l.77.37a9.31,9.31,0,0,1-4,17.71H19.55a9.31,9.31,0,0,1-4-17.71l.77-.37Zm-1,16.83a4.28,4.28,0,0,0,4.2,3.36h60.9a4.31,4.31,0,0,0,1.86-8.19l-2.19-1A2.5,2.5,0,0,1,78.69,82V73.32A51.85,51.85,0,0,0,60.92,34.41H39.08A51.84,51.84,0,0,0,21.33,73.33v8.68a2.5,2.5,0,0,1-1.42,2.25l-2.19,1a4.29,4.29,0,0,0-2.37,4.89Z" />
        </svg>
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
