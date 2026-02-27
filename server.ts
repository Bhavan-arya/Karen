import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import archiver from "archiver";

const db = new Database("ubpads.db");

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    avg_typing_speed REAL DEFAULT 0,
    avg_mouse_speed REAL DEFAULT 0,
    common_ip TEXT,
    common_device_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS login_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    device_id TEXT,
    typing_speed REAL,
    mouse_speed REAL,
    risk_score REAL,
    status TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial admin user if not exists
const adminExists = db
  .prepare("SELECT * FROM users WHERE username = ?")
  .get("admin");
if (!adminExists) {
  const adminId = uuidv4();
  db.prepare(
    "INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)",
  ).run(adminId, "admin", bcrypt.hashSync("admin123", 10), "admin");
  db.prepare("INSERT INTO user_profiles (user_id) VALUES (?)").run(adminId);
}

// Seed a normal user
const userExists = db
  .prepare("SELECT * FROM users WHERE username = ?")
  .get("employee1");
if (!userExists) {
  const userId = uuidv4();
  db.prepare(
    "INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)",
  ).run(userId, "employee1", bcrypt.hashSync("password123", 10), "user");
  // Give them a baseline profile
  db.prepare(
    "INSERT INTO user_profiles (user_id, avg_typing_speed, avg_mouse_speed, common_ip, common_device_id) VALUES (?, ?, ?, ?, ?)",
  ).run(
    userId,
    250, // ms per keypress
    500, // pixels per second
    "127.0.0.1",
    "device-hash-123",
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password, telemetry } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as any;
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Anomaly Detection Engine
    let riskScore = 0.1; // Base risk
    const profile = db
      .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
      .get(user.id) as any;

    if (profile) {
      // 1. Device Check
      if (
        telemetry.deviceId &&
        profile.common_device_id &&
        telemetry.deviceId !== profile.common_device_id
      ) {
        riskScore += 0.3;
      }

      // 2. IP Check (Simulated Geo)
      if (
        telemetry.ip &&
        profile.common_ip &&
        telemetry.ip !== profile.common_ip
      ) {
        riskScore += 0.2;
      }

      // 3. Keystroke Dynamics (Typing speed)
      if (telemetry.typingSpeed && profile.avg_typing_speed > 0) {
        const diff = Math.abs(telemetry.typingSpeed - profile.avg_typing_speed);
        const deviation = diff / profile.avg_typing_speed;
        if (deviation > 0.3) {
          // 30% deviation
          riskScore += 0.25;
        }
      }

      // 4. Mouse Dynamics
      if (telemetry.mouseSpeed && profile.avg_mouse_speed > 0) {
        const diff = Math.abs(telemetry.mouseSpeed - profile.avg_mouse_speed);
        const deviation = diff / profile.avg_mouse_speed;
        if (deviation > 0.4) {
          // 40% deviation
          riskScore += 0.15;
        }
      }
    }

    // Cap risk score at 1.0
    riskScore = Math.min(riskScore, 1.0);

    let status = "success";
    let action = "none";

    if (riskScore > 0.8) {
      status = "blocked";
      action = "require_facial";
    } else if (riskScore >= 0.5) {
      status = "warning";
      action = "notify_user";
    }

    // Log the event
    const eventId = uuidv4();
    db.prepare(
      `
      INSERT INTO login_events 
      (id, user_id, ip_address, device_id, typing_speed, mouse_speed, risk_score, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      eventId,
      user.id,
      telemetry.ip || "unknown",
      telemetry.deviceId || "unknown",
      telemetry.typingSpeed || 0,
      telemetry.mouseSpeed || 0,
      riskScore,
      status,
    );

    // Update profile slowly (moving average) if successful
    if (status === "success" && profile) {
      const newTyping =
        profile.avg_typing_speed === 0
          ? telemetry.typingSpeed
          : profile.avg_typing_speed * 0.9 + telemetry.typingSpeed * 0.1;
      const newMouse =
        profile.avg_mouse_speed === 0
          ? telemetry.mouseSpeed
          : profile.avg_mouse_speed * 0.9 + telemetry.mouseSpeed * 0.1;

      db.prepare(
        "UPDATE user_profiles SET avg_typing_speed = ?, avg_mouse_speed = ? WHERE user_id = ?",
      ).run(newTyping, newMouse, user.id);
    }

    res.json({
      user: { id: user.id, username: user.username, role: user.role },
      riskScore,
      status,
      action,
    });
  });

  app.get("/api/admin/events", (req, res) => {
    const events = db
      .prepare(
        `
      SELECT e.*, u.username 
      FROM login_events e 
      JOIN users u ON e.user_id = u.id 
      ORDER BY e.timestamp DESC 
      LIMIT 100
    `,
      )
      .all();
    res.json(events);
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalLogins = db
      .prepare("SELECT COUNT(*) as count FROM login_events")
      .get() as any;
    const anomalies = db
      .prepare(
        "SELECT COUNT(*) as count FROM login_events WHERE risk_score >= 0.5",
      )
      .get() as any;
    const blocked = db
      .prepare("SELECT COUNT(*) as count FROM login_events WHERE status = ?")
      .get("blocked") as any;

    res.json({
      totalLogins: totalLogins.count,
      anomalies: anomalies.count,
      blocked: blocked.count,
    });
  });

  app.get("/api/download", (req, res) => {
    res.attachment("project.zip");
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.on("error", function (err) {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    archive.glob("**/*", {
      cwd: process.cwd(),
      ignore: ["node_modules/**", "dist/**", ".git/**", "ubpads.db", "ubpads.db-journal"],
      dot: true
    });

    archive.finalize();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
