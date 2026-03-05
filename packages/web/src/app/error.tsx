'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Next.js caught error:', error);
        // Also ping a local endpoint so I can see it in terminal, or just render it
        fetch('/api/log-error?msg=' + encodeURIComponent(error.message));
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-50 text-red-900">
            <h2 className="text-xl font-bold mb-4">Client-side Crash Detected</h2>
            <div className="bg-white p-4 font-mono text-sm border border-red-200 w-full overflow-auto">
                <p className="font-bold">{error.name}: {error.message}</p>
                <pre className="mt-2 text-xs text-red-700">{error.stack}</pre>
            </div>
            <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
