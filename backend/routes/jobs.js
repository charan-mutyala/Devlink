const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const auth = require("../middleware/auth");

// All job routes require auth
router.use(auth);

// GET /api/jobs — get all jobs for current user (with filter + pagination)
router.get("/", async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [req.user.id];
    let where = "WHERE user_id = $1";

    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (company ILIKE $${params.length} OR role ILIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM jobs ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(Number(limit), offset);
    const result = await pool.query(
      `SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Stats summary
    const statsRes = await pool.query(
      `SELECT status, COUNT(*) as count FROM jobs WHERE user_id = $1 GROUP BY status`,
      [req.user.id]
    );
    const stats = { wishlist:0, applied:0, interview:0, offer:0, rejected:0 };
    statsRes.rows.forEach((r) => { stats[r.status] = parseInt(r.count); });

    res.json({
      success: true,
      data: result.rows,
      stats,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM jobs WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post("/", async (req, res, next) => {
  try {
    const { company, role, status = "applied", applied_date, location, salary_range, job_url, notes } = req.body;
    if (!company || !role)
      return res.status(400).json({ success: false, message: "company and role are required" });

    const result = await pool.query(
      `INSERT INTO jobs (user_id, company, role, status, applied_date, location, salary_range, job_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, company, role, status, applied_date || null, location || null, salary_range || null, job_url || null, notes || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { company, role, status, applied_date, location, salary_range, job_url, notes } = req.body;
    const result = await pool.query(
      `UPDATE jobs SET company=$1, role=$2, status=$3, applied_date=$4, location=$5,
       salary_range=$6, job_url=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [company, role, status, applied_date || null, location || null, salary_range || null, job_url || null, notes || null, req.params.id, req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM jobs WHERE id=$1 AND user_id=$2 RETURNING id", [req.params.id, req.user.id]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id/status — quick status update
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ["wishlist", "applied", "interview", "offer", "rejected"];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const result = await pool.query(
      "UPDATE jobs SET status=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *",
      [status, req.params.id, req.user.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
