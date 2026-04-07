const pool = require("./pool");

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username    VARCHAR(30) UNIQUE NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        full_name   VARCHAR(100),
        bio         TEXT,
        github_url  VARCHAR(255),
        linkedin_url VARCHAR(255),
        website_url VARCHAR(255),
        avatar_url  VARCHAR(255),
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company      VARCHAR(100) NOT NULL,
        role         VARCHAR(100) NOT NULL,
        status       VARCHAR(20) NOT NULL DEFAULT 'applied'
                     CHECK (status IN ('wishlist','applied','interview','offer','rejected')),
        applied_date DATE,
        location     VARCHAR(100),
        salary_range VARCHAR(50),
        job_url      VARCHAR(500),
        notes        TEXT,
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    // Skills table (linked to users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name    VARCHAR(50) NOT NULL,
        level   VARCHAR(20) DEFAULT 'intermediate'
                CHECK (level IN ('beginner','intermediate','advanced','expert'))
      );
    `);

    // Projects table (linked to users — for public profile)
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(100) NOT NULL,
        description TEXT,
        tech_stack  TEXT[],
        github_url  VARCHAR(255),
        live_url    VARCHAR(255),
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(user_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);`);

    await client.query("COMMIT");
    console.log("✅ Database migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
