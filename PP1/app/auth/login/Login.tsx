'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBox from '@/app/components/ErrorBox';
import { useAuth } from "../../contexts/AuthContext";
import Link from 'next/link';

export interface UserAuthData {
  username: string;
  id: string;
  role: string;
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { accessToken, setAccessToken, setUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (accessToken) {
            router.push('/');
        }
    }, [accessToken, router]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!username.trim() || !password.trim()) {
            setError("Username and password are required");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password.trim(),
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setAccessToken(data['access-token']);
            setUser(data.user);
            router.push('/');
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gradient-to-bl from-indigo-900 to-teal-500">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-400"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {error && (
                    <div className="mt-4 relative">
                        <ErrorBox errorMessage={error} />
                        <button
                            onClick={() => setError(null)}
                            className="absolute top-0 right-0 mt-1 mr-1 text-gray-500 hover:text-gray-700"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <p className="text-center text-gray-600 mt-4">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/signup" className="text-blue-500 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}