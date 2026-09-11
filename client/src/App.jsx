import { useEffect, useState } from "react";
import { fetchPatients, registerPatient } from "./api.js";
import PatientForm from "./PatientForm.jsx";
import PatientList from "./PatientList.jsx";

export default function App() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(search = query) {
    setLoading(true);
    setError("");
    try {
      setPatients(await fetchPatients(search));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load(query);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleRegister(payload) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await registerPatient(payload);
      setQuery("");
      await load("");
      setNotice(`${payload.fullName} was added to the registry.`);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Hospital Management System</p>
        <h1>Patient registry</h1>
        <p className="lede">
          Register a patient, then find them by name, phone, or department. This is the
          first working slice of the hospital app.
        </p>
      </header>
      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner ok">{notice}</p> : null}
      <main>
        <PatientForm onSubmit={handleRegister} busy={saving} />
        <PatientList
          patients={patients}
          query={query}
          onQueryChange={setQuery}
          loading={loading}
        />
      </main>
    </div>
  );
}
