"use client";
import { AppBar, Typography, TextField, Button } from "@mui/material";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/contexts/AuthContext";
import {User} from "@/app/types";

const SESSION_KEY = 'auth_user';
const saveUserToSession = (user: User) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
};

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setAccessToken, setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        credentials: 'include' // To use cookies
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log("Login data: ", data);
      setAccessToken(data['access-token']);
      setUser(data.user);
      saveUserToSession(data.user);

      router.push('/code-templates/search');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Main Content */}
      <main className="container mx-auto max-w-md px-4 pt-24 pb-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <Typography variant="h4" className="text-blue-400 mb-6">
            Log In
          </Typography>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <Typography className="text-red-500">{error}</Typography>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <TextField
              label="Username"
              type="username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(30, 41, 59)',
                  '&:hover': {
                    backgroundColor: 'rgb(30, 41, 59, 0.8)',
                  },
                  '& fieldset': {
                    borderColor: 'rgb(100, 116, 139)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgb(148, 163, 184)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(148, 163, 184)',
                },
                '& input': {
                  color: 'rgb(226, 232, 240)',
                },
              }}
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(30, 41, 59)',
                  '&:hover': {
                    backgroundColor: 'rgb(30, 41, 59, 0.8)',
                  },
                  '& fieldset': {
                    borderColor: 'rgb(100, 116, 139)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgb(148, 163, 184)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(148, 163, 184)',
                },
                '& input': {
                  color: 'rgb(226, 232, 240)',
                },
              }}
            />

            <div className="space-y-4">
              <div className="flex justify-end">
                <Typography
                  className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                  onClick={() => alert('mampus awokoawkoakwokaw')}
                >
                  Forgot password?
                </Typography>
              </div>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 py-3"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>

              <div className="flex justify-center items-center space-x-1">
                <Typography className="text-slate-400">
                  Don't have an account?
                </Typography>
                <Link href="/register">
                  <Typography
                    className="text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    Register
                  </Typography>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}