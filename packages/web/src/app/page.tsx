import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold text-header-navy mb-4">
                Ryder Cup Par00
            </h1>
            <p className="text-gray-600 text-center mb-8">
                Golf tournament scoring made simple
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Link
                    href="/login"
                    className="w-full py-3 px-4 bg-team-blue text-white rounded-lg text-center font-semibold"
                >
                    Login
                </Link>
                <Link
                    href="/signup"
                    className="w-full py-3 px-4 border border-team-blue text-team-blue rounded-lg text-center font-semibold"
                >
                    Sign Up
                </Link>
            </div>
        </div>
    );
}
