'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center pb-8">
            {/* Header Image */}
            <div className="relative w-full h-[240px] sm:h-[300px] overflow-hidden rounded-b-[32px] thick-border border-t-0 border-l-0 border-r-0 mb-8 shadow-md">
                <Image
                    src="/images/hero_header.webp"
                    alt="Pitufos vs Cariñositos"
                    fill
                    className="object-cover object-top"
                    priority
                />
            </div>

            <div className="w-full max-w-sm px-4 flex flex-col items-center z-10">
                <h1 className="text-3xl font-bangers text-center mb-6 metallic-text">Iniciar Sesión</h1>

                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4 w-full font-fredoka text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full cartoon-card p-6">
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 thick-border rounded-xl bg-white font-bangers text-[#1e293b] tracking-wider focus:outline-none focus:ring-0 shadow-none"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 thick-border rounded-xl bg-white font-bangers text-[#1e293b] tracking-wider focus:outline-none focus:ring-0 shadow-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 gold-button text-[#1e293b] shadow-[0_4px_0_#1e293b] active:translate-y-1 active:shadow-none font-bangers text-lg tracking-wider uppercase disabled:opacity-50"
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <p className="text-center mt-4 text-cream/70 font-fredoka">
                    ¿No tienes cuenta?{' '}
                    <Link href="/signup" className="text-[#ffd700] drop-shadow-sm font-bangers tracking-wider hover:brightness-110">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}
