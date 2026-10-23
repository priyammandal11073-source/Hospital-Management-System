import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginPatient, loginUser } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "hms_token";
const USER_KEY = "hms_user";

/**
 * Checks whether a JWT is expired using client-side payload inspection.
 * Prevents restored stale sessions from lingering in browser storage.
 */
const isTokenExpired = (jwtToken) => {
  if (!jwtToken || typeof jwtToken !== "string") return true;
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64Url)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore a previously saved session after a browser refresh.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem("patient_token");
    const savedUser = localStorage.getItem(USER_KEY) || localStorage.getItem("patient_user");

    if (savedToken) {
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("patient_token");
        localStorage.removeItem("patient_user");
      } else {
        setToken(savedToken);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (!parsed.role && parsed.email) {
              parsed.role = "patient";
            }
            setUser(parsed);
          } catch {
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem("patient_user");
          }
        }
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password, portalType = "staff") => {
    if (portalType === "patient") {
      const { token: patientToken, patient } = await loginPatient(email, password);
      const userPayload = { ...patient, role: "patient" };
      localStorage.setItem(TOKEN_KEY, patientToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userPayload));
      localStorage.setItem("patient_token", patientToken);
      localStorage.setItem("patient_user", JSON.stringify(userPayload));
      setToken(patientToken);
      setUser(userPayload);
      return userPayload;
    }

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
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_user");
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
