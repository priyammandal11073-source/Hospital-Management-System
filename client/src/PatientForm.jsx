const emptyForm = {
  fullName: "",
  age: "",
  gender: "Female",
  phone: "",
  department: "General OPD",
  notes: "",
};

export default function PatientForm({ onSubmit, busy }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      age: Number(form.get("age")),
      gender: form.get("gender"),
      phone: form.get("phone"),
      department: form.get("department"),
      notes: form.get("notes"),
    };
    const ok = await onSubmit(payload);
    if (ok) event.currentTarget.reset();
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Register patient</h2>
      <label>
        Full name
        <input name="fullName" defaultValue={emptyForm.fullName} required minLength={2} />
      </label>
      <div className="row">
        <label>
          Age
          <input name="age" type="number" min="0" max="120" required />
        </label>
        <label>
          Gender
          <select name="gender" defaultValue={emptyForm.gender}>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label>
        Phone
        <input name="phone" inputMode="numeric" pattern="\d{10}" required placeholder="10 digits" />
      </label>
      <label>
        Department
        <select name="department" defaultValue={emptyForm.department}>
          <option>General OPD</option>
          <option>Cardiology</option>
          <option>Pediatrics</option>
          <option>Orthopedics</option>
          <option>Emergency</option>
        </select>
      </label>
      <label>
        Notes
        <textarea name="notes" rows="3" placeholder="Reason for visit (optional)" />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Add to registry"}
      </button>
    </form>
  );
}
