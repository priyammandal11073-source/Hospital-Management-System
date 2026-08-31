import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginPatient as apiLoginPatient } from "../services/api.js";

const PatientAuthContext = createContext(null);

const TOKEN_KEY = "patient_token";
const USER_KEY = "patient_user";

export function PatientAuthProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedPatient = localStorage.getItem(USER_KEY);
    if (savedToken) setToken(savedToken);
    if (savedPatient) {
      try {
        setPatient(JSON.parse(savedPatient));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { token: newToken, patient: loggedPatient } = await apiLoginPatient(email, password);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedPatient));
    setToken(newToken);
    setPatient(loggedPatient);
    return loggedPatient;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setPatient(null);
  };

  const value = useMemo(
    () => ({
      patient,
      token,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
    }),
    [patient, token, loading]
  );

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (!context) throw new Error("usePatientAuth must be used inside a PatientAuthProvider");
  return context;
}
