const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const auth = require("../middleware/auth");
const pool = require("../db/pool");
const cache = require("../cache/redis");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/tips — get AI resume tips based on profile + jobs
router.post("/tips", auth, async (req, res, next) => {
  try {
    const cacheKey = `ai:tips:${req.user.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, tips: cached, fromCache: true });

    const [userRes, jobsRes, skillsRes] = await Promise.all([
      pool.query("SELECT full_name, bio FROM users WHERE id=$1", [req.user.id]),
      pool.query("SELECT company, role, status FROM jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10", [req.user.id]),
      pool.query("SELECT name, level FROM skills WHERE user_id=$1", [req.user.id]),
    ]);

    const user = userRes.rows[0];
    const jobs = jobsRes.rows;
    const skills = skillsRes.rows;

    const context = `
Name: ${user?.full_name || "Not set"}
Bio: ${user?.bio || "Not set"}
Skills: ${skills.map((s) => `${s.name} (${s.level})`).join(", ") || "None listed"}
Recent job applications:
${jobs.map((j) => `- ${j.role} at ${j.company} [${j.status}]`).join("\n") || "None"}
    `.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Based on this developer's profile and job search activity, give 4 specific, actionable resume improvement tips. Be direct and concrete. Format as a numbered list.\n\n${context}`,
      }],
    });

    const tips = response.choices?.[0]?.message?.content || "Unable to generate tips.";
    await cache.set(cacheKey, tips, 3600); // cache for 1 hour
    res.json({ success: true, tips });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/chat — general AI assistant chat
router.post("/chat", auth, async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages))
      return res.status(400).json({ success: false, message: "messages array required" });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        { role: "system", content: "You are a career coach AI helping a software developer with their job search and resume. Be concise and actionable." },
        ...messages,
      ],
    });

    res.json({ success: true, reply: response.choices?.[0]?.message?.content });
  } catch (err) {
    next(err);
  }
});

module.exports = router;