import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import nodemailer from "nodemailer";
import cors from "cors";

import os from "os";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";

// Initialization
const app = express();
const PORT = 3000;
const db = new Database("aerocompliance.db");

// Metrics Tracking
let responseTimes: number[] = [];
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      responseTimes.push(duration);
      if (responseTimes.length > 100) responseTimes.shift(); // Keep last 100
    }
  });
  next();
});
const JWT_SECRET = process.env.JWT_SECRET || "aviation-secret-key-9920";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "aviation-admin-2026";

// Audit Logging Helper
function logAudit(data: {
  action: string;
  performed_by: string;
  performed_by_email: string;
  target_user?: string;
  target_user_email?: string;
  old_role?: string;
  new_role?: string;
  status: 'Success' | 'Failed' | 'Blocked';
  reason?: string;
  ip_address?: string;
  details?: any;
}) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (action, performed_by, performed_by_email, target_user, target_user_email, old_role, new_role, status, reason, ip_address, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.action,
      data.performed_by,
      data.performed_by_email,
      data.target_user || null,
      data.target_user_email || null,
      data.old_role || null,
      data.new_role || null,
      data.status,
      data.reason || null,
      data.ip_address || null,
      JSON.stringify(data.details || {})
    );
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
}

app.use(cors());
app.use(express.json());

// Database Setup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT,
    is_active INTEGER DEFAULT 1,
    employee_id TEXT UNIQUE,
    phone TEXT,
    access_level TEXT DEFAULT 'Standard',
    account_status TEXT DEFAULT 'Active',
    license_number TEXT,
    certification_type TEXT,
    issuing_authority TEXT,
    valid_from DATE,
    expiry_date DATE,
    authorized_types TEXT, -- Comma separated
    expertise TEXT, -- Comma separated
    secure_pin TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aircraft_id TEXT,
    ata_chapter TEXT,
    component TEXT,
    issue TEXT,
    action TEXT,
    technician_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    compliance_status TEXT DEFAULT 'pending',
    findings TEXT,
    parts_replaced TEXT,
    is_draft INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    certification_note TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS notification_settings (
    user_id INTEGER PRIMARY KEY,
    receive_new_logs INTEGER DEFAULT 0,
    receive_invalid_logs INTEGER DEFAULT 1,
    receive_critical_alerts INTEGER DEFAULT 1,
    receive_daily_reports INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key_name TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT,
    performed_by TEXT,
    performed_by_email TEXT,
    target_user TEXT,
    target_user_email TEXT,
    old_role TEXT,
    new_role TEXT,
    status TEXT, -- Success, Failed, Blocked
    reason TEXT,
    ip_address TEXT,
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS aircraft (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aircraft_id TEXT UNIQUE NOT NULL,
    type TEXT,
    manufacturer TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'active',
    location TEXT,
    total_flight_hours REAL DEFAULT 0,
    next_a_check REAL DEFAULT 1000,
    next_borescope REAL DEFAULT 500,
    health_index INTEGER DEFAULT 100,
    approval_status TEXT DEFAULT 'approved',
    created_by_role TEXT,
    created_by_user TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initialize Admin Secret if not present
const existingSecret = db.prepare("SELECT value FROM system_settings WHERE key_name = 'admin_secret'").get() as any;
if (!existingSecret) {
  const defaultSecret = process.env.ADMIN_SECRET || "aviation-admin-2026";
  const hashedSecret = bcrypt.hashSync(defaultSecret, 10);
  db.prepare("INSERT INTO system_settings (key_name, value) VALUES ('admin_secret', ?)").run(hashedSecret);
}

const columnsUsers = db.prepare("PRAGMA table_info(users)").all() as any[];
const columnNamesUsers = columnsUsers.map(c => c.name);
if (!columnNamesUsers.includes('is_active')) db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
if (!columnNamesUsers.includes('created_at')) {
  db.exec("ALTER TABLE users ADD COLUMN created_at DATETIME");
  db.exec("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
}

const columnsAircraft = db.prepare("PRAGMA table_info(aircraft)").all() as any[];
const columnNamesAircraft = columnsAircraft.map(c => c.name);
if (!columnNamesAircraft.includes('total_flight_hours')) db.exec("ALTER TABLE aircraft ADD COLUMN total_flight_hours REAL DEFAULT 0");
if (!columnNamesAircraft.includes('next_a_check')) db.exec("ALTER TABLE aircraft ADD COLUMN next_a_check REAL DEFAULT 1000");
if (!columnNamesAircraft.includes('next_borescope')) db.exec("ALTER TABLE aircraft ADD COLUMN next_borescope REAL DEFAULT 500");
if (!columnNamesAircraft.includes('health_index')) db.exec("ALTER TABLE aircraft ADD COLUMN health_index INTEGER DEFAULT 100");
if (!columnNamesAircraft.includes('approval_status')) db.exec("ALTER TABLE aircraft ADD COLUMN approval_status TEXT DEFAULT 'approved'");
if (!columnNamesAircraft.includes('created_by_role')) db.exec("ALTER TABLE aircraft ADD COLUMN created_by_role TEXT");
if (!columnNamesAircraft.includes('created_by_user')) db.exec("ALTER TABLE aircraft ADD COLUMN created_by_user TEXT");
if (!columnNamesAircraft.includes('created_at')) {
  db.exec("ALTER TABLE aircraft ADD COLUMN created_at DATETIME");
  db.exec("UPDATE aircraft SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
}

if (!columnNamesUsers.includes('employee_id')) {
  db.exec("ALTER TABLE users ADD COLUMN employee_id TEXT");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id)");
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  db.exec("ALTER TABLE users ADD COLUMN access_level TEXT DEFAULT 'Standard'");
  db.exec("ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'Active'");
  db.exec("ALTER TABLE users ADD COLUMN license_number TEXT");
  db.exec("ALTER TABLE users ADD COLUMN certification_type TEXT");
  db.exec("ALTER TABLE users ADD COLUMN issuing_authority TEXT");
  db.exec("ALTER TABLE users ADD COLUMN valid_from DATE");
  db.exec("ALTER TABLE users ADD COLUMN expiry_date DATE");
  db.exec("ALTER TABLE users ADD COLUMN authorized_types TEXT");
  db.exec("ALTER TABLE users ADD COLUMN expertise TEXT");
  db.exec("ALTER TABLE users ADD COLUMN secure_pin TEXT");
  db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
  
  // Backfill employee IDs
  const users = db.prepare("SELECT id FROM users").all() as any[];
  for (const u of users) {
    const eid = `AC-${Math.floor(100000 + Math.random() * 900000)}`;
    db.prepare("UPDATE users SET employee_id = ? WHERE id = ?").run(eid, u.id);
  }
}

// Simple migration for existing databases
const columns = db.prepare("PRAGMA table_info(logs)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes('findings')) db.exec("ALTER TABLE logs ADD COLUMN findings TEXT");
if (!columnNames.includes('parts_replaced')) db.exec("ALTER TABLE logs ADD COLUMN parts_replaced TEXT");
if (!columnNames.includes('is_draft')) db.exec("ALTER TABLE logs ADD COLUMN is_draft INTEGER DEFAULT 0");
if (!columnNames.includes('status')) db.exec("ALTER TABLE logs ADD COLUMN status TEXT DEFAULT 'pending'");
if (!columnNames.includes('certification_note')) db.exec("ALTER TABLE logs ADD COLUMN certification_note TEXT");
if (!columnNames.includes('compliance_status')) db.exec("ALTER TABLE logs ADD COLUMN compliance_status TEXT DEFAULT 'pending'");

// Role-based helper
function checkRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: Unauthorized role" });
    }
    next();
  };
}

// Automated Report Helper
async function notify_users(eventType: string, subject: string, message: string) {
  // Admins always get everything by default unless they manually opt-out (which we handle by fetching roles and settings)
  // But let's build the query based on the event type
  let column = "";
  switch(eventType) {
    case 'new_log': column = 'receive_new_logs'; break;
    case 'invalid_log': column = 'receive_invalid_logs'; break;
    case 'critical': column = 'receive_critical_alerts'; break;
    case 'daily': column = 'receive_daily_reports'; break;
  }

  const query = `
    SELECT u.email, u.role FROM users u
    LEFT JOIN notification_settings ns ON u.id = ns.user_id
    WHERE u.role = 'admin' 
    OR (ns.${column} = 1)
  `;
  
  const recipients = db.prepare(query).all() as { email: string, role: string }[];
  for (const recipient of recipients) {
    await sendEmail(recipient.email, subject, message);
  }
}

// Deprecated in favor of notify_users but keeping for legacy or simplified admin alerts if needed elsewhere
async function send_email_to_admins(subject: string, message: string) {
  const admins = db.prepare("SELECT email FROM users WHERE role = 'admin'").all() as { email: string }[];
  for (const admin of admins) {
    await sendEmail(admin.email, subject, message);
  }
}

// SSE for Real-time Notifications
let clients: any[] = [];
app.get("/api/notifications/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const client = { id: Date.now(), res };
  clients.push(client);

  req.on("close", () => {
    clients = clients.filter((c) => c.id !== client.id);
  });
});

function broadcastNotification(notification: any) {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
}

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Email Automation
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_USER) {
    console.log("Email Simulation (No SMTP config):", { to, subject, text });
    return;
  }
  try {
    await transporter.sendMail({ from: '"AeroCompliance" <no-reply@aerocompliance.io>', to, subject, text });
  } catch (err) {
    console.error("Email Error:", err);
  }
}

// Auth Routes
app.post("/api/signup", async (req, res) => {
  const { name, email, password, role, adminSecret } = req.body;
  
  if (role === "admin") {
    const storedSecret = db.prepare("SELECT value FROM system_settings WHERE key_name = 'admin_secret'").get() as any;
    if (!storedSecret || !(await bcrypt.compare(adminSecret, storedSecret.value))) {
      return res.status(403).json({ error: "Invalid admin secret key" });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const info = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(name, email, hash, role);
    const userId = info.lastInsertRowid;
    
    // Initialize notification settings
    db.prepare("INSERT INTO notification_settings (user_id) VALUES (?)").run(userId);
    
    const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET);
    res.json({ token, user: { id: userId, name, email, role } });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (user && (await bcrypt.compare(password, user.password_hash))) {
    if (user.is_active === 0) {
      logAudit({
        action: 'USER_LOGIN',
        performed_by: user.name,
        performed_by_email: user.email,
        status: 'Blocked',
        reason: 'Account deactivated'
      });
      return res.status(403).json({ error: "Account deactivated. Contact admin." });
    }

    logAudit({
      action: 'USER_LOGIN',
      performed_by: user.name,
      performed_by_email: user.email,
      status: 'Success'
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } else {
    logAudit({
      action: 'USER_LOGIN',
      performed_by: 'Unknown',
      performed_by_email: email || 'No email provided',
      status: 'Failed',
      reason: 'Invalid credentials'
    });
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/profile", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

app.put("/api/profile", authenticateToken, async (req: any, res) => {
  const { name, password } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    db.prepare("UPDATE users SET name = ?, password_hash = ? WHERE id = ?").run(name, hash, req.user.id);
  } else {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.user.id);
  }
  res.json({ success: true });
});

// Aircraft Routes
app.get("/api/aircraft", authenticateToken, (req: any, res) => {
  let query = "SELECT * FROM aircraft";
  let params: any[] = [];

  if (req.user.role !== 'admin') {
    query += " WHERE approval_status = 'approved'";
  }
  
  query += " ORDER BY aircraft_id ASC";
  const aircraft = db.prepare(query).all(...params);
  res.json(aircraft);
});

app.get("/api/aircraft/pending", authenticateToken, checkRole(["admin"]), (req, res) => {
  const pending = db.prepare("SELECT * FROM aircraft WHERE approval_status = 'pending' ORDER BY created_at DESC").all();
  res.json(pending);
});

app.post("/api/aircraft", authenticateToken, checkRole(["admin", "planner", "supervisor"]), (req: any, res) => {
  const { aircraft_id, type, manufacturer, serial_number, status, location } = req.body;
  const role = req.user.role;
  const approval_status = role === 'admin' ? 'approved' : 'pending';

  try {
    db.prepare(`
      INSERT INTO aircraft (aircraft_id, type, manufacturer, serial_number, status, location, approval_status, created_by_role, created_by_user) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      aircraft_id, type, manufacturer, serial_number, status || 'active', location, approval_status, role, req.user.email
    );

    if (approval_status === 'pending') {
      notify_users("new_log", "AIRCRAFT APPROVAL REQUIRED", `New asset registry request: ${aircraft_id} (${type}) by ${req.user.name} [${role}]`);
      broadcastNotification({ message: `Approval required for ${aircraft_id}`, type: "WARNING" });
    }

    res.json({ success: true, status: approval_status });
  } catch (err) {
    res.status(400).json({ error: "Aircraft ID already exists" });
  }
});

app.post("/api/aircraft/:id/approve", authenticateToken, checkRole(["admin"]), (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  const status = action === 'approve' ? 'approved' : 'rejected';
  
  const asset = db.prepare("SELECT * FROM aircraft WHERE id = ?").get(req.params.id) as any;
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  db.prepare("UPDATE aircraft SET approval_status = ? WHERE id = ?").run(status, req.params.id);

  if (asset.created_by_user) {
    // We don't have a direct notify-one-user helper, but we can broadcast or use a specialized one
    db.prepare(`
      INSERT INTO notifications (user_id, type, message) 
      VALUES ((SELECT id FROM users WHERE email = ?), ?, ?)
    `).run(asset.created_by_user, status === 'approved' ? 'success' : 'alert', `Asset ${asset.aircraft_id} has been ${status} by Admin.`);
  }

  res.json({ success: true });
});

app.get("/api/aircraft/:id", authenticateToken, (req, res) => {
  const aircraft = db.prepare("SELECT * FROM aircraft WHERE id = ?").get(req.params.id);
  if (!aircraft) return res.status(404).json({ error: "Aircraft not found" });
  res.json(aircraft);
});

app.put("/api/aircraft/:id", authenticateToken, checkRole(["admin", "planner", "supervisor"]), (req, res) => {
  const { aircraft_id, type, manufacturer, serial_number, status, location } = req.body;
  db.prepare("UPDATE aircraft SET aircraft_id = ?, type = ?, manufacturer = ?, serial_number = ?, status = ?, location = ? WHERE id = ?").run(
    aircraft_id, type, manufacturer, serial_number, status, location, req.params.id
  );
  res.json({ success: true });
});

app.delete("/api/aircraft/:id", authenticateToken, checkRole(["admin", "planner"]), (req, res) => {
  db.prepare("DELETE FROM aircraft WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// User Management & Profile
app.get("/api/users", authenticateToken, checkRole(["admin"]), (req, res) => {
  const users = db.prepare("SELECT id, name, email, role, is_active, employee_id, account_status, access_level, created_at FROM users").all();
  res.json(users);
});

app.get("/api/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.put("/api/users/profile", authenticateToken, (req: any, res) => {
  const { 
    name, phone, secure_pin, two_factor_enabled, 
    license_number, certification_type, issuing_authority, 
    valid_from, expiry_date, authorized_types, expertise 
  } = req.body;
  try {
    db.prepare(`
      UPDATE users SET 
        name = ?, phone = ?, secure_pin = ?, two_factor_enabled = ?, 
        license_number = ?, certification_type = ?, issuing_authority = ?, 
        valid_from = ?, expiry_date = ?, authorized_types = ?, expertise = ?
      WHERE id = ?
    `).run(
      name, phone, secure_pin, two_factor_enabled ? 1 : 0,
      license_number, certification_type, issuing_authority,
      valid_from, expiry_date, authorized_types, expertise,
      req.user.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to update profile" });
  }
});

app.patch("/api/users/:id/admin-update", authenticateToken, checkRole(["admin"]), (req: any, res) => {
  const targetId = parseInt(req.params.id);
  const { role, is_active, account_status, access_level } = req.body;
  
  try {
    const targetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId) as any;
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const totalAdmins = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as any).count;

    // 1. SELF-MODIFICATION BLOCKS
    if (targetId === req.user.id) {
      if (role && role !== 'admin') {
        logAudit({
          action: 'ADMIN_ROLE_REMOVAL',
          performed_by: req.user.name,
          performed_by_email: req.user.email,
          target_user: targetUser.name,
          target_user_email: targetUser.email,
          status: 'Blocked',
          reason: 'Self-role removal restriction'
        });
        return res.status(400).json({ error: "Security Protocol Violation: You cannot modify your own admin access." });
      }
      if (is_active === false || account_status === 'Deactivated') {
        logAudit({
          action: 'USER_DEACTIVATION',
          performed_by: req.user.name,
          performed_by_email: req.user.email,
          target_user: targetUser.name,
          target_user_email: targetUser.email,
          status: 'Blocked',
          reason: 'Self-deactivation restriction'
        });
        return res.status(400).json({ error: "Security Protocol Violation: You cannot deactivate your own account." });
      }
    }

    // 2. LAST ADMIN PROTECTION
    if (targetUser.role === 'admin' && (role && role !== 'admin')) {
      if (totalAdmins <= 1) {
        logAudit({
          action: 'ADMIN_ROLE_REMOVAL',
          performed_by: req.user.name,
          performed_by_email: req.user.email,
          target_user: targetUser.name,
          target_user_email: targetUser.email,
          status: 'Blocked',
          reason: 'Last admin safeguard'
        });
        return res.status(400).json({ error: "Security Safeguard: At least one admin must remain in the system." });
      }
    }

    db.prepare(`
      UPDATE users SET 
        role = COALESCE(?, role), 
        is_active = COALESCE(?, is_active), 
        account_status = COALESCE(?, account_status), 
        access_level = COALESCE(?, access_level)
      WHERE id = ?
    `).run(role, is_active === undefined ? null : (is_active ? 1 : 0), account_status, access_level, targetId);

    logAudit({
      action: 'ADMIN_USER_UPDATE',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: targetUser.name,
      target_user_email: targetUser.email,
      old_role: targetUser.role,
      new_role: role || targetUser.role,
      status: 'Success',
      details: JSON.stringify({ role, is_active, account_status, access_level })
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

app.get("/api/metrics/user/:id", authenticateToken, (req, res) => {
  const userId = req.params.id;
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });

  const totalLogs = db.prepare("SELECT COUNT(*) as count FROM logs WHERE technician_id = ?").get(user.email) as any;
  const approvedLogs = db.prepare("SELECT COUNT(*) as count FROM logs WHERE technician_id = ? AND status = 'approved'").get(user.email) as any;
  const rejectedLogs = db.prepare("SELECT COUNT(*) as count FROM logs WHERE technician_id = ? AND status = 'rejected'").get(user.email) as any;
  const lastActivity = db.prepare("SELECT timestamp FROM logs WHERE technician_id = ? ORDER BY timestamp DESC LIMIT 1").get(user.email) as any;

  res.json({
    totalLogs: totalLogs.count,
    approvedLogs: approvedLogs.count,
    rejectedLogs: rejectedLogs.count,
    lastActivity: lastActivity?.timestamp || null
  });
});

app.delete("/api/users/:id", authenticateToken, checkRole(["admin"]), (req: any, res) => {
  const targetId = parseInt(req.params.id);
  const targetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId) as any;
  
  if (!targetUser) return res.status(404).json({ error: "User not found" });
  
  // Rule: Cannot delete yourself
  if (targetId === req.user.id) {
    logAudit({
      action: 'USER_DELETION',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: targetUser.name,
      target_user_email: targetUser.email,
      status: 'Blocked',
      reason: 'Self-deletion restriction'
    });
    return res.status(400).json({ error: "Security Protocol Violation: You cannot delete your own account." });
  }

  // Rule: Cannot remove last admin user
  if (targetUser.role === 'admin') {
    const adminCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as any).count;
    if (adminCount <= 1) {
      logAudit({
        action: 'USER_DELETION',
        performed_by: req.user.name,
        performed_by_email: req.user.email,
        target_user: targetUser.name,
        target_user_email: targetUser.email,
        status: 'Blocked',
        reason: 'Last admin safeguard'
      });
      return res.status(400).json({ error: "Final Admin safeguard active. Termination denied." });
    }
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
  
  logAudit({
    action: 'USER_DELETION',
    performed_by: req.user.name,
    performed_by_email: req.user.email,
    target_user: targetUser.name,
    target_user_email: targetUser.email,
    status: 'Success'
  });

  res.json({ success: true });
});

// Log Routes
app.get("/api/logs", authenticateToken, (req: any, res) => {
  let logs;
  if (req.user.role === 'technician') {
    logs = db.prepare("SELECT * FROM logs WHERE technician_id = ? ORDER BY timestamp DESC").all(req.user.email);
  } else {
    logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC").all();
  }
  res.json(logs);
});

// Removed /api/process-log as Gemini must be called from frontend only

app.post("/api/logs", authenticateToken, checkRole(["technician", "admin"]), (req: any, res) => {
  const { aircraft_id, ata_chapter, component, issue, action, compliance_status, findings, parts_replaced, is_draft } = req.body;
  
  const info = db.prepare(`
    INSERT INTO logs (aircraft_id, ata_chapter, component, issue, action, technician_id, compliance_status, findings, parts_replaced, is_draft, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(aircraft_id, ata_chapter, component, issue, action, req.user.email, compliance_status || 'pending', findings, parts_replaced, is_draft ? 1 : 0, is_draft ? 'draft' : 'pending');

  // AUTOMATION: Alert Users
  notify_users("new_log", "New Log Created", `Airframe: ${aircraft_id}\nComponent: ${component}\nIssue: ${issue}\nBy: ${req.user.name}`);

  // Automation: Critical Keyword Check
  const criticalWords = ["engine failure", "hydraulic failure", "fuel leak", "fire"];
  if (criticalWords.some(word => (issue + action + findings).toLowerCase().includes(word))) {
    notify_users("critical", "CRITICAL MAINTENANCE ALERT", `Critical issue detected in log for ${aircraft_id}. Issue: ${issue}\nTechnician: ${req.user.name}`);
    broadcastNotification({ message: `CRITICAL: ${issue} on ${aircraft_id}`, type: "CRITICAL" });
  }

  // Automation: Email on completion
  if (!is_draft) {
    // supervisor@skyscript.ai is now replaced by the dynamic notify_users
    // but maybe we still want a general one? No, the requirement says "No hardcoded emails"
  }

  // Compliance Alert
  if (compliance_status === "invalid") {
    notify_users("invalid_log", "URGENT: Compliance Failure", `Log #${info.lastInsertRowid} failed compliance. Aircraft: ${aircraft_id}`);
    broadcastNotification({ message: `Compliance failure on ${aircraft_id}`, type: "WARNING" });
  }

  res.json({ id: info.lastInsertRowid });
});

// Planner Insights
app.get("/api/planner/insights", authenticateToken, checkRole(["planner", "admin"]), (req, res) => {
  const { aircraft_id } = req.query;
  let query = "SELECT aircraft_id, issue, timestamp FROM logs WHERE timestamp >= datetime('now', '-48 hours')";
  let params = [];
  
  if (aircraft_id) {
    query += " AND aircraft_id = ?";
    params.push(aircraft_id);
  }
  
  const logs = db.prepare(query).all(...params) as any[];
  
  const groups: { [key: string]: string[] } = {};
  logs.forEach(log => {
    const key = `${log.aircraft_id}:${log.issue}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(log.timestamp);
  });

  const recurring = Object.entries(groups)
    .filter(([_, times]) => times.length >= 3)
    .map(([key, _]) => {
      const [aircraft_id, issue] = key.split(':');
      return {
        aircraft_id,
        issue,
        suggestion: `Schedule detailed inspection for ${issue} on ${aircraft_id}`
      };
    });

  res.json(recurring);
});

// QA Validation Engine
app.post("/api/qa/validate", authenticateToken, checkRole(["qa_officer", "admin"]), (req, res) => {
  const { action, component } = req.body;
  const errors = [];
  
  if (!action || action.length < 5) errors.push("Action missing or too brief");
  if (!component) errors.push("Missing component designation");
  
  const vagueTerms = ["fixed", "repaired", "done", "ok", "checked"];
  if (action && vagueTerms.includes(action.toLowerCase().trim())) {
    errors.push("Vague technical narrative detected ('fixed', 'done', etc.)");
  }

  res.json({
    status: errors.length === 0 ? "valid" : "invalid",
    errors
  });
});

// Supervisor Settings
app.get("/api/supervisor/settings", authenticateToken, checkRole(["supervisor", "admin"]), (req: any, res) => {
  const settings = db.prepare("SELECT * FROM notification_settings WHERE user_id = ?").get(req.user.id);
  res.json(settings || {});
});

app.put("/api/supervisor/settings", authenticateToken, checkRole(["supervisor", "admin"]), (req: any, res) => {
  const { receive_new_logs, receive_invalid_logs, receive_critical_alerts, receive_daily_reports } = req.body;
  db.prepare(`
    INSERT OR REPLACE INTO notification_settings 
    (user_id, receive_new_logs, receive_invalid_logs, receive_critical_alerts, receive_daily_reports)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, receive_new_logs ? 1 : 0, receive_invalid_logs ? 1 : 0, receive_critical_alerts ? 1 : 0, receive_daily_reports ? 1 : 0);
  res.json({ success: true });
});

// Admin Secret Management
app.put("/api/admin/change-secret", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
  const { current_secret, new_secret } = req.body;
  
  if (!new_secret || new_secret.length < 8) {
    return res.status(400).json({ error: "New secret must be at least 8 characters" });
  }

  const storedSecret = db.prepare("SELECT value FROM system_settings WHERE key_name = 'admin_secret'").get() as any;
  if (!storedSecret || !(await bcrypt.compare(current_secret, storedSecret.value))) {
    logAudit({
      action: 'SECRET_KEY_CHANGE',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      status: 'Failed',
      reason: 'Invalid current secret'
    });
    return res.status(403).json({ error: "Invalid current secret" });
  }

  const newHash = await bcrypt.hash(new_secret, 10);
  db.prepare("UPDATE system_settings SET value = ? WHERE key_name = 'admin_secret'").run(newHash);
  
  logAudit({
    action: 'SECRET_KEY_CHANGE',
    performed_by: req.user.name,
    performed_by_email: req.user.email,
    status: 'Success'
  });

  res.json({ success: true });
});

// Audit Log Endpoints
app.get("/api/admin/audit-logs", authenticateToken, checkRole(["admin", "supervisor"]), (req: any, res) => {
  const { role } = req.user;
  let logs;
  
  if (role === 'admin') {
    logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC").all();
  } else {
    // Supervisor view: Hide sensitive logs
    logs = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE action NOT IN ('SECRET_KEY_CHANGE', 'ADMIN_ROLE_ASSIGNMENT') 
      ORDER BY timestamp DESC
    `).all();
  }
  
  res.json(logs);
});

app.post("/api/admin/audit-logs/export/csv", authenticateToken, checkRole(["admin"]), (req, res) => {
  const { logs } = req.body;
  if (!logs || logs.length === 0) return res.status(400).json({ error: "No logs available to export" });

  try {
    const fields = ['timestamp', 'action', 'performed_by', 'target_user', 'old_role', 'new_role', 'status', 'reason'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: "CSV Generation Failed" });
  }
});

app.post("/api/admin/audit-logs/export/pdf", authenticateToken, checkRole(["admin"]), (req: any, res) => {
  const { logs } = req.body;
  if (!logs || logs.length === 0) return res.status(400).json({ error: "No logs available to export" });

  try {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('AEROCOMPLIANCE - AUDIT LOG REPORT', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Generated By: ${req.user.name} (${req.user.role.toUpperCase()})`, { align: 'center' });
    doc.moveDown(2);

    // Summary Box
    const successCount = logs.filter((l: any) => l.status === 'Success').length;
    const failedCount = logs.filter((l: any) => l.status === 'Failed').length;
    const blockedCount = logs.filter((l: any) => l.status === 'Blocked').length;

    doc.rect(30, 100, 535, 80).stroke();
    doc.fontSize(12).font('Helvetica-Bold').text('Operational Summary', 40, 110);
    doc.fontSize(10).font('Helvetica').text(`Total Logs Processed: ${logs.length}`, 40, 130);
    doc.fillColor('green').text(`Successful Actions: ${successCount}`, 40, 145);
    doc.fillColor('red').text(`Failed Transactions: ${failedCount}`, 200, 145);
    doc.fillColor('orange').text(`Security Intercepts: ${blockedCount}`, 360, 145);
    doc.fillColor('black').moveDown(3);

    // Table Header
    const tableTop = 200;
    const itemHeight = 35;
    doc.font('Helvetica-Bold');
    doc.rect(30, tableTop, 535, 20).fill('#f2f2f2');
    doc.fillColor('black').text('TIMESTAMP', 35, tableTop + 5, { width: 100 });
    doc.text('ACTION', 135, tableTop + 5, { width: 100 });
    doc.text('PERFORMED BY', 235, tableTop + 5, { width: 100 });
    doc.text('TARGET', 335, tableTop + 5, { width: 100 });
    doc.text('STATUS', 485, tableTop + 5, { width: 70 });
    
    // Rows
    let y = tableTop + 25;
    logs.forEach((log: any, index: number) => {
      if (y > 750) {
        doc.addPage();
        y = 30;
      }
      
      if (index % 2 === 0) {
        doc.rect(30, y - 2, 535, itemHeight).fill('#fafafa');
      }

      doc.fillColor('black').font('Helvetica').fontSize(8);
      doc.text(new Date(log.timestamp).toLocaleString(), 35, y, { width: 90 });
      doc.text(log.action.replace(/_/g, ' '), 135, y, { width: 90 });
      doc.text(log.performed_by, 235, y, { width: 90 });
      doc.text(log.target_user || 'SYSTEM', 335, y, { width: 90 });
      
      const statusColor = log.status === 'Success' ? 'green' : (log.status === 'Failed' ? 'red' : '#f27d26');
      doc.fillColor(statusColor).font('Helvetica-Bold').text(log.status.toUpperCase(), 485, y, { width: 70 });
      
      doc.fillColor('#777').font('Helvetica-Oblique').fontSize(7).text(log.reason || '', 35, y + 10, { width: 500 });
      
      y += itemHeight;
    });

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999').text(`AeroCompliance // Operational Audit Registry // Page ${i + 1}`, 30, 800, { align: 'center' });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF Generation Failed" });
  }
});

// System Status Endpoint
app.get("/api/admin/system-status", authenticateToken, checkRole(["admin"]), (req, res) => {
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
    : 0;

  const status = {
    activeUsers: clients.length,
    serverLoad: os.loadavg(),
    memoryUsage: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
    },
    responseTime: avgResponseTime,
    dbStats: {
      users: db.prepare("SELECT COUNT(*) as count FROM users").get() as any,
      logs: db.prepare("SELECT COUNT(*) as count FROM logs").get() as any,
    },
    uptime: Math.round(os.uptime())
  };

  res.json(status);
});

app.post("/api/logs/:id/status", authenticateToken, checkRole(["engineer", "admin"]), (req: any, res) => {
  const { status, certification_note } = req.body;
  db.prepare("UPDATE logs SET status = ?, certification_note = ? WHERE id = ?").run(status, certification_note, req.params.id);
  res.json({ success: true });
});

app.post("/api/logs/:id/compliance", authenticateToken, checkRole(["qa_officer", "admin"]), (req: any, res) => {
  const { status } = req.body;
  db.prepare("UPDATE logs SET compliance_status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

app.post("/api/validate", authenticateToken, checkRole(["technician", "qa_officer", "admin"]), (req, res) => {
  const { technician_id, action } = req.body;
  const errors = [];
  if (!technician_id) errors.push("Missing technician_id");
  if (!action) errors.push("Missing action description");
  
  res.json({
    valid: errors.length === 0,
    status: errors.length === 0 ? "valid" : "invalid",
    reasons: errors
  });
});

app.get("/api/notifications", authenticateToken, (req: any, res) => {
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY timestamp DESC LIMIT 20").all(req.user.id);
  res.json(notifications);
});

// Daily Report Endpoint
app.get("/api/daily-report", authenticateToken, checkRole(["supervisor", "qa_officer", "planner", "admin"]), (req: any, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN compliance_status = 'invalid' THEN 1 ELSE 0 END) as invalid,
      COUNT(DISTINCT aircraft_id) as unique_aircrafts
    FROM logs 
    WHERE timestamp >= date('now')
  `).get() as any;

  res.json(stats);
});

// Scheduler
cron.schedule("0 18 * * *", () => {
  const stats = db.prepare("SELECT COUNT(*) as total FROM logs WHERE timestamp >= date('now')").get() as any;
  notify_users("daily", "Daily Maintenance Summary", `System Daily Summary: ${stats.total} logs processed today.`);
  console.log("Daily report task executed.");
});


// Global API Error Handler
app.use("/api", (err: any, req: any, res: any, next: any) => {
  console.error("API Error at " + req.path + ":", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    path: req.path
  });
});

// Start Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
