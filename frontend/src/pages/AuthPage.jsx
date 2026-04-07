import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ username: "", email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = mode === "login"
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(form);
      // login(data.token, data.user);
      console.log("API response:", data);
login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">DevLink</div>
        <p className="auth-tagline">Track jobs. Build your profile. Land roles.</p>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Sign up</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <input name="full_name" placeholder="Full name" value={form.full_name} onChange={handle} />
              <input name="username" placeholder="Username (e.g. charan)" value={form.username} onChange={handle} required />
            </>
          )}
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handle} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handle} required />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
