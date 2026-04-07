import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { profileApi } from "../api";

const LEVEL_COLOR = { beginner: "#6b7280", intermediate: "#3b82f6", advanced: "#8b5cf6", expert: "#10b981" };

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi.get(username)
      .then((d) => setProfile(d.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">Profile not found.</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{profile.full_name?.[0] || profile.username[0].toUpperCase()}</div>
          <div>
            <h1 className="profile-name">{profile.full_name || profile.username}</h1>
            <p className="profile-username">@{profile.username}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-links">
              {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer">GitHub</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
              {profile.website_url && <a href={profile.website_url} target="_blank" rel="noreferrer">Website</a>}
            </div>
          </div>
        </div>

        {profile.skills?.length > 0 && (
          <section className="profile-section">
            <h2 className="section-title">Skills</h2>
            <div className="skills-grid">
              {profile.skills.map((s, i) => (
                <span key={i} className="skill-badge" style={{ borderColor: LEVEL_COLOR[s.level] }}>
                  {s.name}
                  <span className="skill-level" style={{ color: LEVEL_COLOR[s.level] }}>{s.level}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {profile.projects?.length > 0 && (
          <section className="profile-section">
            <h2 className="section-title">Projects</h2>
            <div className="projects-grid">
              {profile.projects.map((p, i) => (
                <div key={i} className="project-card">
                  <div className="project-title">{p.title}</div>
                  {p.description && <p className="project-desc">{p.description}</p>}
                  {p.tech_stack?.length > 0 && (
                    <div className="tech-tags">
                      {p.tech_stack.map((t, j) => <span key={j} className="tech-tag">{t}</span>)}
                    </div>
                  )}
                  <div className="project-links">
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer">GitHub</a>}
                    {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer">Live</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
