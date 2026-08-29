import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginUser } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "hms_token";
const USER_KEY = "hms_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore a previously saved session after a browser refresh.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Remove malformed storage rather than leaving the app in a bad state.
        localStorage.removeItem(USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { token: newToken, user: loggedInUser } = await loginUser(email, password);

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
