const request = require("supertest");

// Mock DB and Redis for testing without real connections
jest.mock("../db/pool", () => {
  const users = [];
  const jobs = [];
  let userIdx = 1;
  let jobIdx = 1;

  return {
    query: jest.fn(async (sql, params) => {
      if (sql.includes("SELECT NOW()")) return { rows: [{ now: new Date() }] };

      // Register
      if (sql.includes("INSERT INTO users")) {
        const user = { id: String(userIdx++), username: params[0], email: params[1], password: params[2], full_name: params[3], created_at: new Date() };
        users.push(user);
        return { rows: [user] };
      }
      if (sql.includes("SELECT id FROM users WHERE email")) {
        const found = users.find((u) => u.email === params[0] || u.username === params[1]);
        return { rows: found ? [found] : [] };
      }
      if (sql.includes("SELECT * FROM users WHERE email")) {
        const found = users.find((u) => u.email === params[0]);
        return { rows: found ? [found] : [] };
      }
      if (sql.includes("SELECT id, username") && sql.includes("WHERE id")) {
        const found = users.find((u) => u.id === params[0]);
        return { rows: found ? [found] : [] };
      }

      // Jobs
      if (sql.includes("INSERT INTO jobs")) {
        const job = { id: String(jobIdx++), user_id: params[0], company: params[1], role: params[2], status: params[3], created_at: new Date(), updated_at: new Date() };
        jobs.push(job);
        return { rows: [job] };
      }
      if (sql.includes("SELECT COUNT(*)")) return { rows: [{ count: "0" }] };
      if (sql.includes("SELECT * FROM jobs") && sql.includes("ORDER BY")) {
        const userJobs = jobs.filter((j) => j.user_id === params[0]);
        return { rows: userJobs };
      }
      if (sql.includes("SELECT status, COUNT(*)")) return { rows: [] };
      if (sql.includes("SELECT * FROM jobs WHERE id")) {
        const job = jobs.find((j) => j.id === params[0] && j.user_id === params[1]);
        return { rows: job ? [job] : [] };
      }
      if (sql.includes("DELETE FROM jobs")) {
        const idx = jobs.findIndex((j) => j.id === params[0] && j.user_id === params[1]);
        if (idx > -1) { const [del] = jobs.splice(idx, 1); return { rows: [del] }; }
        return { rows: [] };
      }

      return { rows: [] };
    }),
  };
});

jest.mock("../cache/redis", () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(null),
}));

const app = require("../server");

let token;

describe("Auth API", () => {
  test("POST /api/auth/register — creates a user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "charan", email: "charan@test.com", password: "password123", full_name: "Charan M",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test("POST /api/auth/register — rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
  });

  test("POST /api/auth/login — logs in successfully", async () => {
    const bcrypt = require("bcryptjs");
    const pool = require("../db/pool");
    pool.query.mockResolvedValueOnce({
      rows: [{ id: "1", username: "charan", email: "charan@test.com", password: await bcrypt.hash("password123", 12), full_name: "Charan M" }]
    });
    const res = await request(app).post("/api/auth/login").send({ email: "charan@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("GET /api/health — returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Jobs API", () => {
  test("POST /api/jobs — creates a job", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({ company: "Google", role: "Software Engineer", status: "applied" });
    expect(res.status).toBe(201);
    expect(res.body.data.company).toBe("Google");
  });

  test("POST /api/jobs — rejects missing company", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "Engineer" });
    expect(res.status).toBe(400);
  });

  test("GET /api/jobs — requires auth", async () => {
    const res = await request(app).get("/api/jobs");
    expect(res.status).toBe(401);
  });
});
