const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const auth = require("../middleware/auth");

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: "username, email and password are required" });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username))
      return res.status(400).json({ success: false, message: "Username must be 3-30 alphanumeric characters" });

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existing.rows.length)
      return res.status(409).json({ success: false, message: "Email or username already taken" });

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, email, password, full_name)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, created_at`,
      [username.toLowerCase(), email.toLowerCase(), hashed, full_name || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      success: true, token,
      user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — get current user
router.get("/me", auth, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, full_name, bio, github_url, linkedin_url, website_url, avatar_url, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile — update profile
router.put("/profile", auth, async (req, res, next) => {
  try {
    const { full_name, bio, github_url, linkedin_url, website_url, avatar_url } = req.body;
    const result = await pool.query(
      `UPDATE users SET full_name=$1, bio=$2, github_url=$3, linkedin_url=$4,
       website_url=$5, avatar_url=$6, updated_at=NOW()
       WHERE id=$7 RETURNING id, username, email, full_name, bio, github_url, linkedin_url, website_url, avatar_url`,
      [full_name, bio, github_url, linkedin_url, website_url, avatar_url, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
