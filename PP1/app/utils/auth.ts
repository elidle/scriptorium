import { User } from '@/app/types';
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

// This util function is used to refresh the access token.
export async function refreshToken(user: User) {
  const response = await fetch('/api/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // To use cookies
    body: JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role
    })
  });

  if (!response.ok) throw new Error('Failed to refresh token');

  return await response.json();
}

type FetchAuthParams = {
  url: string;
  options: RequestInit;
  user: User | null;
  setAccessToken: (token: string) => void;
  router: AppRouterInstance | null;
};

// This util function is used to fetch data with auth.
// It handles refreshing access token if needed.
export async function fetchAuth({
  url,
  options,
  user,
  setAccessToken,
  router
}: FetchAuthParams) {
  options.credentials = 'include'; // To use cookies

  let response = await fetch(url, options);

  if (user && router && response.status === 401) {
    const refreshResponse = await refreshToken(user);

    if (!refreshResponse.ok && refreshResponse.status === 401) {
      router.push('/login');
      return null;
    }

    const newToken = refreshResponse['access-token'];
    setAccessToken(newToken);

    options.headers = {
      ...options.headers,
      'access-token': `Bearer ${newToken}`
    };
    response = await fetch(url, options);
  }

  return response;
}

// Handle user logout
export async function logoutUser() {
  try {
    const response = await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include', // Important for clearing cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}