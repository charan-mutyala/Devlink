const BASE = "/api";

function getToken() {
  return localStorage.getItem("devlink_token");
}

async function req(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const authApi = {
  register: (body) => req("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => req("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => req("/auth/me"),
  updateProfile: (body) => req("/auth/profile", { method: "PUT", body: JSON.stringify(body) }),
};

export const jobsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/jobs${qs ? "?" + qs : ""}`);
  },
  get: (id) => req(`/jobs/${id}`),
  create: (body) => req("/jobs", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => req(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => req(`/jobs/${id}`, { method: "DELETE" }),
  updateStatus: (id, status) => req(`/jobs/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const profileApi = {
  get: (username) => req(`/profile/${username}`),
  updateSkills: (skills) => req("/profile/me/skills", { method: "PUT", body: JSON.stringify({ skills }) }),
  updateProjects: (projects) => req("/profile/me/projects", { method: "PUT", body: JSON.stringify({ projects }) }),
};

export const aiApi = {
  getTips: () => req("/ai/tips", { method: "POST" }),
  chat: (messages) => req("/ai/chat", { method: "POST", body: JSON.stringify({ messages }) }),
};
