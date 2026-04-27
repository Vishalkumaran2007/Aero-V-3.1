import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import nodemailer from "nodemailer";
import cors from "cors";

import os from "os";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import { connectDB, User, Aircraft, AuditLog, MaintenanceLog, Notification, Settings } from "./src/db.ts";

// Initialization
const app = express();
const PORT = 3000;

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
async function logAudit(data: {
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
    const log = new AuditLog({
      action: data.action,
      performed_by: data.performed_by,
      performed_by_email: data.performed_by_email,
      target_user: data.target_user || null,
      target_user_email: data.target_user_email || null,
      old_role: data.old_role || null,
      new_role: data.new_role || null,
      status: data.status,
      reason: data.reason || null,
      ip_address: data.ip_address || null,
      details: data.details || {}
    });
    await log.save();
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
}

app.use(cors());
app.use(express.json());

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
  let column = "";
  switch(eventType) {
    case 'new_log': column = 'receive_new_logs'; break;
    case 'invalid_log': column = 'receive_invalid_logs'; break;
    case 'critical': column = 'receive_critical_alerts'; break;
    case 'daily': column = 'receive_daily_reports'; break;
  }

  try {
    const recipients = await User.aggregate([
      {
        $lookup: {
          from: 'settings',
          localField: '_id',
          foreignField: 'user_id',
          as: 'ns'
        }
      },
      {
        $match: {
          $or: [
            { role: 'admin' },
            { [`ns.${column}`]: true }
          ]
        }
      },
      {
        $project: { email: 1, role: 1 }
      }
    ]);

    for (const recipient of recipients) {
      await sendEmail(recipient.email, subject, message);
    }
  } catch (err) {
    console.error("Notification helper failed:", err);
  }
}

// Deprecated in favor of notify_users but keeping for legacy or simplified admin alerts if needed elsewhere
async function send_email_to_admins(subject: string, message: string) {
  try {
    const admins = await User.find({ role: 'admin' }, 'email');
    for (const admin of admins) {
      await sendEmail(admin.email, subject, message);
    }
  } catch (err) {
    console.error("Admin notification failed:", err);
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
    const storedSecret = await Settings.findOne({ system_key: 'admin_secret' });
    if (!storedSecret || !(await bcrypt.compare(adminSecret, storedSecret.system_value || ''))) {
      return res.status(403).json({ error: "Invalid admin secret key" });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({
      name,
      email,
      password_hash: hash,
      role,
      employee_id: `AC-${Math.floor(100000 + Math.random() * 900000)}`
    });
    const user = await newUser.save();
    
    // Initialize notification settings
    const newSettings = new Settings({ user_id: user._id });
    await newSettings.save();
    
    logAudit({
      action: 'USER_SIGNUP',
      performed_by: name,
      performed_by_email: email,
      status: 'Success',
      details: { role }
    });

    const token = jwt.sign({ id: user._id, email, role, name }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    
    if (user && (await bcrypt.compare(password, user.password_hash || ''))) {
      if (!user.is_active) {
        logAudit({
          action: 'USER_LOGIN',
          performed_by: user.name || 'Unknown',
          performed_by_email: user.email,
          status: 'Blocked',
          reason: 'Account deactivated'
        });
        return res.status(403).json({ error: "Account deactivated. Contact admin." });
      }

      logAudit({
        action: 'USER_LOGIN',
        performed_by: user.name || 'Unknown',
        performed_by_email: user.email,
        status: 'Success'
      });

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
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
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/profile", authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select('id name email role');
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
});

app.put("/api/profile", authenticateToken, async (req: any, res) => {
  const { name, password } = req.body;
  try {
    const updates: any = { name };
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }
    await User.findByIdAndUpdate(req.user.id, updates);

    logAudit({
      action: 'PROFILE_UPDATED',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      status: 'Success'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Profile update failed" });
  }
});

// Aircraft Routes
app.get("/api/aircraft", authenticateToken, async (req: any, res) => {
  try {
    let query: any = {};
    if (req.user.role !== 'admin') {
      query.approval_status = 'approved';
    }
    
    const aircraft = await Aircraft.find(query).sort({ aircraft_id: 1 });
    res.json(aircraft);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch aircraft" });
  }
});

app.get("/api/aircraft/pending", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const pending = await Aircraft.find({ approval_status: 'pending' }).sort({ created_at: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending aircraft" });
  }
});

app.post("/api/aircraft", authenticateToken, checkRole(["admin", "planner", "supervisor"]), async (req: any, res) => {
  const { aircraft_id, type, manufacturer, serial_number, status, location } = req.body;
  const role = req.user.role;
  const approval_status = role === 'admin' ? 'approved' : 'pending';

  try {
    const newAircraft = new Aircraft({
      aircraft_id, type, manufacturer, serial_number, 
      status: status || 'active', 
      location, approval_status, 
      created_by_role: role, 
      created_by_user: req.user.email
    });
    await newAircraft.save();

    logAudit({
      action: approval_status === 'approved' ? 'AIRCRAFT_REGISTERED' : 'AIRCRAFT_APPROVAL_REQUESTED',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: aircraft_id,
      status: 'Success',
      details: { type, manufacturer }
    });

    if (approval_status === 'pending') {
      notify_users("new_log", "AIRCRAFT APPROVAL REQUIRED", `New asset registry request: ${aircraft_id} (${type}) by ${req.user.name} [${role}]`);
      broadcastNotification({ message: `Approval required for ${aircraft_id}`, type: "WARNING" });
    }

    res.json({ success: true, status: approval_status });
  } catch (err) {
    res.status(400).json({ error: "Aircraft ID already exists" });
  }
});

app.post("/api/aircraft/:id/approve", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  const status = action === 'approve' ? 'approved' : 'rejected';
  
  try {
    const asset = await Aircraft.findById(req.params.id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    await Aircraft.findByIdAndUpdate(req.params.id, { approval_status: status });

    logAudit({
      action: status === 'approved' ? 'AIRCRAFT_APPROVED' : 'AIRCRAFT_REJECTED',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: asset.aircraft_id,
      status: 'Success'
    });

    if (asset.created_by_user) {
      const creator = await User.findOne({ email: asset.created_by_user });
      if (creator) {
        const notif = new Notification({
          user_id: creator._id,
          type: status === 'approved' ? 'success' : 'alert',
          message: `Asset ${asset.aircraft_id} has been ${status} by Admin.`
        });
        await notif.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Approval failed" });
  }
});

app.get("/api/aircraft/:id", authenticateToken, async (req: any, res) => {
  try {
    const aircraft = await Aircraft.findById(req.params.id);
    if (!aircraft) return res.status(404).json({ error: "Aircraft not found" });
    res.json(aircraft);
  } catch (err) {
    res.status(404).json({ error: "Aircraft not found" });
  }
});

app.put("/api/aircraft/:id", authenticateToken, checkRole(["admin", "planner", "supervisor"]), async (req: any, res) => {
  const { aircraft_id, type, manufacturer, serial_number, status, location } = req.body;
  try {
    await Aircraft.findByIdAndUpdate(req.params.id, {
      aircraft_id, type, manufacturer, serial_number, status, location
    });

    logAudit({
      action: 'AIRCRAFT_UPDATED',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: aircraft_id,
      status: 'Success'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

app.delete("/api/aircraft/:id", authenticateToken, checkRole(["admin", "planner"]), async (req: any, res) => {
  try {
    const asset = await Aircraft.findById(req.params.id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    
    await Aircraft.findByIdAndDelete(req.params.id);

    logAudit({
      action: 'AIRCRAFT_DELETED',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: asset.aircraft_id,
      status: 'Success'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Deletion failed" });
  }
});

// User Management & Profile
app.get("/api/users", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}, 'id name email role is_active employee_id account_status access_level created_at');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/users/:id", authenticateToken, async (req: any, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized" });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
});

app.put("/api/users/profile", authenticateToken, async (req: any, res) => {
  const { 
    name, phone, secure_pin, two_factor_enabled, 
    license_number, certification_type, issuing_authority, 
    valid_from, expiry_date, authorized_types, expertise 
  } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, {
      name, phone, secure_pin, 
      two_factor_enabled: !!two_factor_enabled,
      license_number, certification_type, issuing_authority,
      valid_from, expiry_date, authorized_types, expertise
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to update profile" });
  }
});

app.patch("/api/users/:id/admin-update", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
  const targetId = req.params.id;
  const { role, is_active, account_status, access_level } = req.body;
  
  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // 1. SELF-MODIFICATION BLOCKS
    if (targetId === req.user.id.toString()) {
      if (role && role !== 'admin') {
        logAudit({
          action: 'ADMIN_ROLE_REMOVAL',
          performed_by: req.user.name,
          performed_by_email: req.user.email,
          target_user: targetUser.name || 'Unknown',
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
          target_user: targetUser.name || 'Unknown',
          target_user_email: targetUser.email,
          status: 'Blocked',
          reason: 'Self-deactivation restriction'
        });
        return res.status(400).json({ error: "Security Protocol Violation: You cannot deactivate your own account." });
      }
    }

    // 2. LAST ADMIN PROTECTION
    if (targetUser.role === 'admin' && role && role !== 'admin') {
      if (totalAdmins <= 1) {
        logAudit({
          action: 'ADMIN_ROLE_REMOVAL',
          performed_by: req.user.name,
          performed_by_email: req.user.email,
          target_user: targetUser.name || 'Unknown',
          target_user_email: targetUser.email,
          status: 'Blocked',
          reason: 'Last admin safeguard'
        });
        return res.status(400).json({ error: "Security Safeguard: At least one admin must remain in the system." });
      }
    }

    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = !!is_active;
    if (account_status !== undefined) updates.account_status = account_status;
    if (access_level !== undefined) updates.access_level = access_level;

    await User.findByIdAndUpdate(targetId, updates);

    logAudit({
      action: 'ADMIN_USER_UPDATE',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: targetUser.name || 'Unknown',
      target_user_email: targetUser.email,
      old_role: targetUser.role,
      new_role: role || targetUser.role,
      status: 'Success',
      details: { role, is_active, account_status, access_level }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

app.get("/api/metrics/user/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalLogs = await MaintenanceLog.countDocuments({ technician_id: user.email });
    const approvedLogs = await MaintenanceLog.countDocuments({ technician_id: user.email, status: 'approved' });
    const rejectedLogs = await MaintenanceLog.countDocuments({ technician_id: user.email, status: 'rejected' });
    const lastActivityLog = await MaintenanceLog.findOne({ technician_id: user.email }).sort({ timestamp: -1 });

    res.json({
      totalLogs,
      approvedLogs,
      rejectedLogs,
      lastActivity: lastActivityLog?.timestamp || null
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

app.delete("/api/users/:id", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
  const targetId = req.params.id;
  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    
    // Rule: Cannot delete yourself
    if (targetId === req.user.id.toString()) {
      logAudit({
        action: 'USER_DELETION',
        performed_by: req.user.name,
        performed_by_email: req.user.email,
        target_user: targetUser.name || 'Unknown',
        target_user_email: targetUser.email,
        status: 'Blocked',
        reason: 'Self-deletion restriction'
      });
      return res.status(400).json({ error: "Security Protocol Violation: You cannot delete your own account." });
    }

    // Rule: Cannot remove last admin user
    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        logAudit({
          action: 'USER_DELETION',
          performed_by: req.user.name,
          performed_by_email: req.user.email,
          target_user: targetUser.name || 'Unknown',
          target_user_email: targetUser.email,
          status: 'Blocked',
          reason: 'Last admin safeguard'
        });
        return res.status(400).json({ error: "Final Admin safeguard active. Termination denied." });
      }
    }

    await User.findByIdAndDelete(targetId);
    
    logAudit({
      action: 'USER_DELETION',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: targetUser.name || 'Unknown',
      target_user_email: targetUser.email,
      status: 'Success'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Deletion failed" });
  }
});

// Log Routes
app.get("/api/logs", authenticateToken, async (req: any, res) => {
  try {
    let query: any = {};
    if (req.user.role === 'technician') {
      query.technician_id = req.user.email;
    }
    const logs = await MaintenanceLog.find(query).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.post("/api/logs", authenticateToken, checkRole(["technician", "admin"]), async (req: any, res) => {
  const { aircraft_id, ata_chapter, component, issue, action, compliance_status, findings, parts_replaced, is_draft } = req.body;
  
  try {
    const newLog = new MaintenanceLog({
      aircraft_id, ata_chapter, component, issue, action, 
      technician_id: req.user.email, 
      compliance_status: compliance_status || 'pending', 
      findings, parts_replaced, 
      is_draft: !!is_draft, 
      status: is_draft ? 'draft' : 'pending'
    });
    const log = await newLog.save();

    logAudit({
      action: is_draft ? 'MAINTENANCE_LOG_DRAFT' : 'MAINTENANCE_LOG_CREATED',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      target_user: aircraft_id,
      status: 'Success',
      details: { log_id: log._id, component }
    });

    // AUTOMATION: Alert Users
    notify_users("new_log", "New Log Created", `Airframe: ${aircraft_id}\nComponent: ${component}\nIssue: ${issue}\nBy: ${req.user.name}`);

    // Automation: Critical Keyword Check
    const criticalWords = ["engine failure", "hydraulic failure", "fuel leak", "fire"];
    if (criticalWords.some(word => (issue + action + findings).toLowerCase().includes(word))) {
      notify_users("critical", "CRITICAL MAINTENANCE ALERT", `Critical issue detected in log for ${aircraft_id}. Issue: ${issue}\nTechnician: ${req.user.name}`);
      broadcastNotification({ message: `CRITICAL: ${issue} on ${aircraft_id}`, type: "CRITICAL" });
    }

    // Compliance Alert
    if (compliance_status === "invalid") {
      notify_users("invalid_log", "URGENT: Compliance Failure", `Log #${log._id} failed compliance. Aircraft: ${aircraft_id}`);
      broadcastNotification({ message: `Compliance failure on ${aircraft_id}`, type: "WARNING" });
    }

    res.json({ id: log._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create log" });
  }
});

// Planner Insights
app.get("/api/planner/insights", authenticateToken, checkRole(["planner", "admin"]), async (req, res) => {
  const { aircraft_id } = req.query;
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    let query: any = { timestamp: { $gte: fortyEightHoursAgo } };
    
    if (aircraft_id) {
      query.aircraft_id = aircraft_id;
    }
    
    const logs = await MaintenanceLog.find(query).select('aircraft_id issue timestamp');
    
    const groups: { [key: string]: Date[] } = {};
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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
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
app.get("/api/supervisor/settings", authenticateToken, checkRole(["supervisor", "admin"]), async (req: any, res) => {
  try {
    const settings = await Settings.findOne({ user_id: req.user.id });
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put("/api/supervisor/settings", authenticateToken, checkRole(["supervisor", "admin"]), async (req: any, res) => {
  const { receive_new_logs, receive_invalid_logs, receive_critical_alerts, receive_daily_reports } = req.body;
  try {
    await Settings.findOneAndUpdate(
      { user_id: req.user.id },
      { 
        receive_new_logs: !!receive_new_logs, 
        receive_invalid_logs: !!receive_invalid_logs, 
        receive_critical_alerts: !!receive_critical_alerts, 
        receive_daily_reports: !!receive_daily_reports 
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Admin Secret Management
app.put("/api/admin/change-secret", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
  const { current_secret, new_secret } = req.body;
  
  if (!new_secret || new_secret.length < 8) {
    return res.status(400).json({ error: "New secret must be at least 8 characters" });
  }

  try {
    const storedSecret = await Settings.findOne({ system_key: 'admin_secret' });
    if (!storedSecret || !(await bcrypt.compare(current_secret, storedSecret.system_value || ''))) {
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
    await Settings.findOneAndUpdate({ system_key: 'admin_secret' }, { system_value: newHash });
    
    logAudit({
      action: 'SECRET_KEY_CHANGE',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      status: 'Success'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to change secret" });
  }
});

// Audit Log Endpoints
app.get("/api/admin/audit-logs", authenticateToken, checkRole(["admin", "supervisor", "qa_officer"]), async (req: any, res) => {
  const { role } = req.user;
  try {
    let logs;
    if (role === 'admin') {
      logs = await AuditLog.find().sort({ timestamp: -1 });
    } else {
      // Supervisor view: Hide sensitive logs
      logs = await AuditLog.find({
        action: { $nin: ['SECRET_KEY_CHANGE', 'ADMIN_ROLE_ASSIGNMENT'] }
      }).sort({ timestamp: -1 });
    }
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

app.post("/api/admin/audit-logs/export/csv", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
  const { logs } = req.body;
  if (!logs || logs.length === 0) return res.status(400).json({ error: "No logs available to export" });

  try {
    const fields = ['timestamp', 'action', 'performed_by', 'target_user', 'old_role', 'new_role', 'status', 'reason'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(logs);

    logAudit({
      action: 'AUDIT_LOG_EXPORT_CSV',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      status: 'Success',
      details: { count: logs.length }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: "CSV Generation Failed" });
  }
});

app.post("/api/admin/audit-logs/export/pdf", authenticateToken, checkRole(["admin"]), async (req: any, res) => {
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

    logAudit({
      action: 'AUDIT_LOG_EXPORT_PDF',
      performed_by: req.user.name,
      performed_by_email: req.user.email,
      status: 'Success',
      details: { count: logs.length }
    });

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
      doc.text((log.action || '').replace(/_/g, ' '), 135, y, { width: 90 });
      doc.text(log.performed_by, 235, y, { width: 90 });
      doc.text(log.target_user || 'SYSTEM', 335, y, { width: 90 });
      
      const statusColor = log.status === 'Success' ? 'green' : (log.status === 'Failed' ? 'red' : '#f27d26');
      doc.fillColor(statusColor).font('Helvetica-Bold').text((log.status || '').toUpperCase(), 485, y, { width: 70 });
      
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
app.get("/api/admin/system-status", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
      : 0;

    const userCount = await User.countDocuments();
    const logCount = await MaintenanceLog.countDocuments();

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
        users: { count: userCount },
        logs: { count: logCount },
      },
      uptime: Math.round(os.uptime())
    };

    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch system status" });
  }
});

app.post("/api/logs/:id/status", authenticateToken, checkRole(["engineer", "admin"]), async (req: any, res) => {
  const { status, certification_note } = req.body;
  try {
    await MaintenanceLog.findByIdAndUpdate(req.params.id, { status, certification_note });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update log status" });
  }
});

app.post("/api/logs/:id/compliance", authenticateToken, checkRole(["qa_officer", "admin"]), async (req: any, res) => {
  const { status } = req.body;
  try {
    await MaintenanceLog.findByIdAndUpdate(req.params.id, { compliance_status: status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update compliance status" });
  }
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

app.get("/api/notifications", authenticateToken, async (req: any, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ user_id: req.user.id }, { user_id: null }]
    }).sort({ timestamp: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Daily Report Endpoint
app.get("/api/daily-report", authenticateToken, checkRole(["supervisor", "qa_officer", "planner", "admin"]), async (req: any, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsToday = await MaintenanceLog.find({ timestamp: { $gte: today } });
    
    const stats = {
      total: logsToday.length,
      invalid: logsToday.filter(l => l.compliance_status === 'invalid').length,
      unique_aircrafts: new Set(logsToday.map(l => l.aircraft_id)).size
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily report" });
  }
});

// Scheduler
cron.schedule("0 18 * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalLogsToday = await MaintenanceLog.countDocuments({ timestamp: { $gte: today } });
    
    notify_users("daily", "Daily Maintenance Summary", `System Daily Summary: ${totalLogsToday} logs processed today.`);
    console.log("Daily report task executed.");
  } catch (err) {
    console.error("Cron task failed:", err);
  }
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
  await connectDB();

  // Database Setup: Consistently initialize System Settings if not present
  try {
    const existingSecret = await Settings.findOne({ system_key: 'admin_secret' });
    if (!existingSecret) {
      const defaultSecret = process.env.ADMIN_SECRET || "aviation-admin-2026";
      const hashedSecret = bcrypt.hashSync(defaultSecret, 10);
      const newSecret = new Settings({
        system_key: 'admin_secret',
        system_value: hashedSecret
      });
      await newSecret.save();
      console.log("Initialized Default Admin Secret in MongoDB");
    }
  } catch (err) {
    console.error("Initialization failed:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 1000
        }
      },
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

startServer().catch(err => {
  console.error("CRITICAL SERVER START FAILURE:", err);
  process.exit(1);
});
