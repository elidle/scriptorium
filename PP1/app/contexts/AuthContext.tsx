"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from "@/app/types";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: any | null;
  setUser: (user: any | null) => void;
  loading: boolean;
}

const SESSION_KEY = 'auth_user';

// Utility functions that check for browser environment
const isBrowser = () => typeof window !== 'undefined';

const saveUserToSession = (user: User) => {
  if (isBrowser()) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
};

const getUserFromSession = (): User | null => {
  if (isBrowser()) {
    const userStr = sessionStorage.getItem(SESSION_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

const clearUserSession = () => {
  if (isBrowser()) {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.clear();
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize states with null and use useEffect for hydration
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user from session storage after component mounts
  useEffect(() => {
    const sessionUser = getUserFromSession();
    setUser(sessionUser);
    setIsInitialized(true);
  }, []);

  const handleSetUser = (newUser: User | null) => {
    if (newUser) {
      saveUserToSession(newUser);
    } else {
      clearUserSession();
    }
    setUser(newUser);
  };

  // Separate function for token refresh
  const refreshAccessToken = async (userData: any) => {
    try {
      const refreshResponse = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: userData.id,
          username: userData.username,
          role: userData.role
        })
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const refreshData = await refreshResponse.json();
      return refreshData["access-token"];
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  };

  // Verify session only after initial client-side hydration
  useEffect(() => {
    if (!isInitialized) return;

    const verifySession = async () => {
      try {
        // Try to verify with existing token
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          handleSetUser(data.user);
          setAccessToken(data["access-token"]);
        } else {
          const sessionUser = getUserFromSession();
          if (sessionUser) {
            try {
              const newAccessToken = await refreshAccessToken(sessionUser);
              handleSetUser(sessionUser);
              setAccessToken(newAccessToken);
            } catch (refreshError) {
              handleSetUser(null);
              setAccessToken(null);
            }
          } else {
            handleSetUser(null);
            setAccessToken(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        handleSetUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [isInitialized]);

  // Expose a refresh function that components can use
  const refresh = async () => {
    if (!user) {
      throw new Error('No user data available for refresh');
    }

    try {
      const newAccessToken = await refreshAccessToken(user);
      setAccessToken(newAccessToken);
      return true;
    } catch (error) {
      setUser(null);
      setAccessToken(null);
      return false;
    }
  };

  // Don't render children until after initial client-side hydration
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        user,
        setUser,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}