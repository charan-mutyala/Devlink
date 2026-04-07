const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const profileRoutes = require("./routes/profile");
const aiRoutes = require("./routes/ai");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ──
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

// ── Rate limiting ──
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, message: "Too many requests" } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: "Too many auth attempts" } });
app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);

// ── Health check ──
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── 404 ──
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Error handler ──
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 DevLink API running on http://localhost:${PORT}`));

module.exports = app;
