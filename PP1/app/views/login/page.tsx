'use client'; // This directive makes the component a Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBox from '@/app/components/ErrorBox';

export default function Login() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault(); // Prevent the default form submission

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password } as LoginFormData),
      });

      
      if (response.ok) {
        // Clear the input fields after successful login
        // console.log('Login successful');
        setUsername('');
        setPassword('');
        setError(null); // Clear any previous error messages
        // console.log('Login successful');
        // Redirect user or perform any other actions here  
        router.push('/');

      } else {    
        const errorData: ErrorResponse = await response.json();
        setError(errorData.message || 'Invalid username or password');
      }
    };

    return (
        // <div className="flex justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-purple-600">
        // <div className="flex justify-center items-center h-screen bg-gradient-to-r from-purple-900 via-cyan-500 to-pink-500">
        <div className="flex justify-center items-center h-screen bg-gradient-to-bl from-indigo-900 to-teal-500">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Login
              </button>
            </form>
            {error && <ErrorBox errorMessage={error} />}
            <p className="text-center text-gray-600 mt-4">
              Don't have an account?{' '}
              <a href="views/signup" className="text-blue-500 hover:underline">
              Sign up
              </a>
            </p>
          </div>
        </div>
      );

    }