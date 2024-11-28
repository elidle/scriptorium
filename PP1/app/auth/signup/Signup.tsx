'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBox from '@/app/components/ErrorBox';

export default function Signup() {
    
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState<string | null>(null);

    interface SignupData {
      username: string;
      firstname: string;
      lastname: string;
      email: string;
      password: string;
      confirmPassword: string;
      phoneNumber: string;
    }

    interface ErrorResponse {
      message: string;
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      const signupData: SignupData = { username, firstname, lastname, email, password, confirmPassword, phoneNumber};

      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        setUsername('');
        setFirstname('');
        setLastname('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhoneNumber('');
        setError(null);
        console.log('User created successfully');
        router.push('login');
      } else {
        const errorData: ErrorResponse = await response.json();
        console.log("error: " + errorData.message);
        setError(errorData.message);
        console.log(error);
      }
    };
    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-green-500 to-teal-600 py-8">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Sign Up</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="username">
                    Username
                </label>
                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    id = "username"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="first-name">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your First Name"
                  id = "first-name"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="last-name">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your First Name"
                  value={lastname}
                  id = "last-name"
                  onChange={(e) => setLastname(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="phone-number">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone-number"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your Password"
                  id = "password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm your Password"
                  id = "confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition duration-300"
              >
                Sign Up
              </button>
            </form>
            {error && <ErrorBox errorMessage={error} />}
            <p className="text-center text-gray-600 mt-4">
              Already have an account?{' '}
              <a href="/auth/login" className="text-green-500 hover:underline">
                Log in
              </a>
            </p>
          </div>
        </div>
      );

}