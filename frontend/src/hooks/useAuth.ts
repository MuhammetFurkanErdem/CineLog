import { useState, useEffect } from "react";
import { User, currentUser as mockCurrentUser } from "../utils/mockData";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        return { currentUser: user, isAuthenticated: true };
      } catch {
        return { currentUser: null, isAuthenticated: false };
      }
    }
    
    // Fallback to mock data if localStorage is empty
    if (mockCurrentUser) {
      localStorage.setItem("currentUser", JSON.stringify(mockCurrentUser));
      return { currentUser: mockCurrentUser, isAuthenticated: true };
    }
    
    return { currentUser: null, isAuthenticated: false };
  });

  // Sync with localStorage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentUser") {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            setAuthState({ currentUser: user, isAuthenticated: true });
          } catch {
            setAuthState({ currentUser: null, isAuthenticated: false });
          }
        } else {
          setAuthState({ currentUser: null, isAuthenticated: false });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (user: User) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    setAuthState({ currentUser: user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("access_token");
    setAuthState({ currentUser: null, isAuthenticated: false });
  };

  const updateUser = (updates: Partial<User>) => {
    if (authState.currentUser) {
      const updatedUser = { ...authState.currentUser, ...updates };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setAuthState({ currentUser: updatedUser, isAuthenticated: true });
    }
  };

  return {
    currentUser: authState.currentUser,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    updateUser,
  };
}
