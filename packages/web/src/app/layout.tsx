import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { AuthProvider } from '@/lib/auth';
import { SyncProvider } from '@/lib/syncContext';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export const metadata: Metadata = {
    title: 'Ryder Cup Par00',
    description: 'Golf tournament scoring app',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-100 pb-16">
                <AuthProvider>
                    <SyncProvider>
                        <main className="max-w-md mx-auto bg-white min-h-screen">
                            {children}
                        </main>
                        <OfflineIndicator />
                        <BottomNav />
                    </SyncProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
