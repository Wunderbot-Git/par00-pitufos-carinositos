'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
        if (!/[A-Z]/.test(pwd)) return 'La contraseña debe contener una mayúscula';
        if (!/[a-z]/.test(pwd)) return 'La contraseña debe contener una minúscula';
        if (!/[0-9]/.test(pwd)) return 'La contraseña debe contener un número';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setIsLoading(true);

        try {
            await signup(email, name, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen p-4">
            <h1 className="text-2xl font-bold text-center mt-8 mb-6">Registrarse</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                />
                <input
                    type="text"
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                />
                <p className="text-xs text-gray-500">
                    La contraseña debe tener al menos 8 caracteres con una mayúscula, una minúscula y un número.
                </p>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-team-blue text-white rounded-lg font-semibold disabled:opacity-50"
                >
                    {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                </button>
            </form>

            <p className="text-center mt-4 text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-team-blue">Iniciar sesión</Link>
            </p>
        </div>
    );
}
