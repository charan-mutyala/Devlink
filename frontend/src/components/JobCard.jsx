const STATUS_STYLES = {
  wishlist:  { bg: "#ede9fe", color: "#5b21b6" },
  applied:   { bg: "#dbeafe", color: "#1e40af" },
  interview: { bg: "#fef3c7", color: "#92400e" },
  offer:     { bg: "#d1fae5", color: "#065f46" },
  rejected:  { bg: "#fee2e2", color: "#991b1b" },
};

const STATUSES = ["wishlist", "applied", "interview", "offer", "rejected"];

export default function JobCard({ job, onDelete, onStatusChange }) {
  const style = STATUS_STYLES[job.status] || STATUS_STYLES.applied;

  return (
    <div className="job-card">
      <div className="job-card-top">
        <div>
          <div className="job-company">{job.company}</div>
          <div className="job-role">{job.role}</div>
          {job.location && <div className="job-location">{job.location}</div>}
        </div>
        <span className="status-badge" style={{ background: style.bg, color: style.color }}>
          {job.status}
        </span>
      </div>

      {job.salary_range && (
        <div className="job-salary">{job.salary_range}</div>
      )}

      {job.notes && <p className="job-notes">{job.notes}</p>}

      <div className="job-card-footer">
        <select
          className="status-select"
          value={job.status}
          onChange={(e) => onStatusChange(job.id, e.target.value)}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="job-card-actions">
          {job.job_url && (
            <a href={job.job_url} target="_blank" rel="noreferrer" className="btn-sm">View</a>
          )}
          <button className="btn-sm btn-danger" onClick={() => onDelete(job.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
