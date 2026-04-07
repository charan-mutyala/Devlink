import { useState, useEffect } from "react";
import { jobsApi } from "../api";
import JobCard from "../components/JobCard";
import AddJobModal from "../components/AddJobModal";
import AITips from "../components/AITips";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  wishlist: "#6366f1", applied: "#3b82f6", interview: "#f59e0b", offer: "#10b981", rejected: "#ef4444",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchJobs() {
    try {
      const params = {};
      if (filter !== "all") params.status = filter;
      if (search) params.search = search;
      const data = await jobsApi.getAll(params);
      setJobs(data.data);
      setStats(data.stats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchJobs(); }, [filter, search]);

  async function handleDelete(id) {
    await jobsApi.remove(id);
    fetchJobs();
  }

  async function handleStatusChange(id, status) {
    await jobsApi.updateStatus(id, status);
    fetchJobs();
  }

  const statItems = [
    { label: "Applied", key: "applied", color: STATUS_COLORS.applied },
    { label: "Interview", key: "interview", color: STATUS_COLORS.interview },
    { label: "Offers", key: "offer", color: STATUS_COLORS.offer },
    { label: "Rejected", key: "rejected", color: STATUS_COLORS.rejected },
  ];

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, {user?.full_name?.split(" ")[0] || user?.username}</h1>
          <p className="dash-sub">Your job search tracker</p>
        </div>
        <div className="dash-actions">
          <button className="btn-outline" onClick={() => setShowAI(true)}>AI Tips</button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Job</button>
        </div>
      </div>

      <div className="stats-row">
        {statItems.map((s) => (
          <div key={s.key} className="stat-box" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-num" style={{ color: s.color }}>{stats[s.key] || 0}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-pills">
          {["all", "wishlist", "applied", "interview", "offer", "rejected"].map((s) => (
            <button
              key={s}
              className={`pill ${filter === s ? "pill-active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-msg">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-msg">No jobs found. Add your first application!</div>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showAdd && <AddJobModal onAdd={() => { fetchJobs(); setShowAdd(false); }} onClose={() => setShowAdd(false)} />}
      {showAI && <AITips onClose={() => setShowAI(false)} />}
    </div>
  );
}
