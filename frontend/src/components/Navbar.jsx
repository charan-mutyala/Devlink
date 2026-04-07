import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-brand">DevLink</div>
      <div className="nav-right">
        <a
          href={`/profile/${user?.username}`}
          target="_blank"
          rel="noreferrer"
          className="nav-profile-link"
        >
          devlink.app/{user?.username}
        </a>
        <div className="nav-avatar">
          {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase()}
        </div>
        <button className="nav-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
