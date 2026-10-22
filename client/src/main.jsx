import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PatientAuthProvider } from "./context/PatientAuthContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <PatientAuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PatientAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
