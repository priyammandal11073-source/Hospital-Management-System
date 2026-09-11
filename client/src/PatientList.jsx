function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PatientList({ patients, query, onQueryChange, loading }) {
  return (
    <section className="card list">
      <div className="list-header">
        <h2>Patient registry</h2>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, phone, or department"
        />
      </div>
      {loading ? <p className="muted">Loading patients…</p> : null}
      {!loading && patients.length === 0 ? (
        <p className="muted">No patients match that search.</p>
      ) : null}
      <ul>
        {patients.map((patient) => (
          <li key={patient.id}>
            <div>
              <strong>{patient.fullName}</strong>
              <span className="badge">{patient.department}</span>
            </div>
            <p>
              {patient.age} yrs · {patient.gender} · {patient.phone}
            </p>
            {patient.notes ? <p className="notes">{patient.notes}</p> : null}
            <p className="muted">Registered {formatWhen(patient.registeredAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
