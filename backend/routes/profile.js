const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const cache = require("../cache/redis");

// GET /api/profile/:username — public profile (cached)
router.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const cacheKey = `profile:${username}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    const userRes = await pool.query(
      `SELECT id, username, full_name, bio, github_url, linkedin_url, website_url, avatar_url, created_at
       FROM users WHERE username = $1`,
      [username.toLowerCase()]
    );
    if (!userRes.rows.length)
      return res.status(404).json({ success: false, message: "Profile not found" });

    const user = userRes.rows[0];

    const [skillsRes, projectsRes] = await Promise.all([
      pool.query("SELECT name, level FROM skills WHERE user_id = $1 ORDER BY name", [user.id]),
      pool.query("SELECT title, description, tech_stack, github_url, live_url FROM projects WHERE user_id = $1 ORDER BY created_at DESC", [user.id]),
    ]);

    const profile = {
      ...user,
      skills: skillsRes.rows,
      projects: projectsRes.rows,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, profile, 300);

    res.json({ success: true, data: profile, fromCache: false });
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile/skills — update skills (auth required)
router.put("/me/skills", auth, async (req, res, next) => {
  try {
    const { skills } = req.body; // [{ name, level }]
    if (!Array.isArray(skills))
      return res.status(400).json({ success: false, message: "skills must be an array" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM skills WHERE user_id = $1", [req.user.id]);
      for (const s of skills) {
        if (s.name) {
          await client.query(
            "INSERT INTO skills (user_id, name, level) VALUES ($1, $2, $3)",
            [req.user.id, s.name, s.level || "intermediate"]
          );
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    await cache.del(`profile:${req.user.username}`);
    res.json({ success: true, message: "Skills updated" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile/me/projects — update projects (auth required)
router.put("/me/projects", auth, async (req, res, next) => {
  try {
    const { projects } = req.body; // [{ title, description, tech_stack, github_url, live_url }]
    if (!Array.isArray(projects))
      return res.status(400).json({ success: false, message: "projects must be an array" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM projects WHERE user_id = $1", [req.user.id]);
      for (const p of projects) {
        if (p.title) {
          await client.query(
            "INSERT INTO projects (user_id, title, description, tech_stack, github_url, live_url) VALUES ($1,$2,$3,$4,$5,$6)",
            [req.user.id, p.title, p.description || null, p.tech_stack || [], p.github_url || null, p.live_url || null]
          );
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    await cache.del(`profile:${req.user.username}`);
    res.json({ success: true, message: "Projects updated" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
