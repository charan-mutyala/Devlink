import { useState } from "react";
import { jobsApi } from "../api";

export default function AddJobModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ company: "", role: "", status: "applied", location: "", salary_range: "", job_url: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handle(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await jobsApi.create(form);
      onAdd();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Job Application</h2>
        <form onSubmit={submit} className="modal-form">
          <div className="form-row">
            <div className="field">
              <label>Company *</label>
              <input name="company" value={form.company} onChange={handle} required placeholder="e.g. Google" />
            </div>
            <div className="field">
              <label>Role *</label>
              <input name="role" value={form.role} onChange={handle} required placeholder="e.g. Software Engineer" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handle}>
                {["wishlist","applied","interview","offer","rejected"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <input name="location" value={form.location} onChange={handle} placeholder="e.g. Remote, Houston TX" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Salary range</label>
              <input name="salary_range" value={form.salary_range} onChange={handle} placeholder="e.g. $120k–$150k" />
            </div>
            <div className="field">
              <label>Job URL</label>
              <input name="job_url" value={form.job_url} onChange={handle} placeholder="https://..." />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handle} rows={3} placeholder="Interview prep, contact info, etc." />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Add Job"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
