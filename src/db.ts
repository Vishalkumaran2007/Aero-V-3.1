import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not defined in environment variables. Falling back to local if possible, but app may fail.');
}

export const connectDB = async () => {
  if (!MONGODB_URI) return;
  // Connect in the background to avoid blocking server startup
  mongoose.connect(MONGODB_URI, {
    dbName: 'aerocompliance',
  }).then(() => {
    console.log('Connected to MongoDB Atlas');
  }).catch((err) => {
    console.error('MongoDB connection error:', err);
  });
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Retrying...');
});

// Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password_hash: String,
  role: { 
    type: String, 
    enum: ['technician', 'engineer', 'supervisor', 'qa_officer', 'planner', 'admin', 'guest'],
    default: 'technician'
  },
  is_active: { type: Boolean, default: true },
  employee_id: { type: String, unique: true },
  phone: String,
  access_level: { type: String, default: 'Standard' },
  account_status: { type: String, default: 'Active' },
  license_number: String,
  certification_type: String,
  issuing_authority: String,
  valid_from: Date,
  expiry_date: Date,
  authorized_types: [String],
  expertise: [String],
  secure_pin: String,
  two_factor_enabled: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const AircraftSchema = new mongoose.Schema({
  aircraft_id: { type: String, unique: true, required: true },
  type: String,
  manufacturer: String,
  serial_number: String,
  status: { type: String, default: 'active' },
  location: String,
  total_flight_hours: { type: Number, default: 0 },
  next_a_check: { type: Number, default: 1000 },
  next_borescope: { type: Number, default: 500 },
  health_index: { type: Number, default: 100 },
  approval_status: { type: String, default: 'approved' },
  created_by_role: String,
  created_by_user: String,
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  action: String,
  performed_by: String,
  performed_by_email: String,
  target_user: String,
  target_user_email: String,
  old_role: String,
  new_role: String,
  status: String, // Success, Failed, Blocked
  reason: String,
  ip_address: String,
  details: mongoose.Schema.Types.Mixed
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const MaintenanceLogSchema = new mongoose.Schema({
  aircraft_id: String,
  ata_chapter: String,
  component: String,
  issue: String,
  action: String,
  technician_id: String,
  timestamp: { type: Date, default: Date.now },
  compliance_status: { type: String, default: 'pending' },
  findings: String,
  parts_replaced: String,
  is_draft: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  certification_note: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const NotificationSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  message: String,
  type: String,
  timestamp: { type: Date, default: Date.now },
  is_read: { type: Boolean, default: false }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const SettingsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  receive_new_logs: { type: Boolean, default: false },
  receive_invalid_logs: { type: Boolean, default: true },
  receive_critical_alerts: { type: Boolean, default: true },
  receive_daily_reports: { type: Boolean, default: false },
  // System-wide settings can also go here or in a separate document
  system_key: String,
  system_value: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const User = mongoose.model('User', UserSchema);
export const Aircraft = mongoose.model('Aircraft', AircraftSchema);
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export const MaintenanceLog = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
export const Settings = mongoose.model('Settings', SettingsSchema);
