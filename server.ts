import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import winston from 'winston';
import dotenv from 'dotenv';
import * as jarapoint from './services/jarapoint';

// Load environment variables from .env file
dotenv.config();

// ─── Structured Logger ─────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// ─── Environment Validation ─────────────────────────────────────────────────
const REQUIRED_PROD_VARS = ['JWT_SECRET', 'BVN_ENCRYPTION_KEY'];
const RECOMMENDED_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'FLW_SECRET_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'TERMII_API_KEY'];

if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_PROD_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    logger.error('[STARTUP] Critical environment variables missing in production. Refusing to start.', { missing });
    process.exit(1);
  }
} else {
  const missing = REQUIRED_PROD_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    logger.warn('[STARTUP] Critical env vars not set (using insecure defaults for dev). Set these before going to production.', { missing });
  }
  const missingRec = RECOMMENDED_VARS.filter(v => !process.env[v]);
  if (missingRec.length > 0) {
    logger.warn('[STARTUP] Recommended env vars not configured (some features will be disabled).', { missing: missingRec });
  }
}

// Web Push Configuration
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:support@kosibills.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}


console.log('Initializing database...');
const db = new Database('kosi_bills.db');
db.pragma('journal_mode = WAL'); // Use WAL mode for better concurrency and corruption resistance
db.pragma('synchronous = NORMAL'); // Faster writes with acceptable safety
db.pragma('cache_size = -64000'); // 64MB cache
db.pragma('temp_store = MEMORY'); // Store temp tables in memory
db.pragma('mmap_size = 30000000000'); // Enable memory mapping for large files

// Initialize Database
console.log('Creating tables...');
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT,
      balance REAL DEFAULT 0,
      tier TEXT DEFAULT 'Basic',
      is_live_mode INTEGER DEFAULT 0,
      is_biometric_enabled INTEGER DEFAULT 0,
      pin TEXT DEFAULT '1234',
      profile_photo TEXT,
      account_status TEXT DEFAULT 'active',
      kyc_level INTEGER DEFAULT 1,
      currency TEXT DEFAULT 'NGN',
      is_agent INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      referral_code TEXT,
      hide_balance INTEGER DEFAULT 0,
      session_token TEXT,
      is_customer_care INTEGER DEFAULT 0,
      daily_transfer_limit REAL DEFAULT 50000,
      daily_withdrawal_limit REAL DEFAULT 50000,
      total_referred INTEGER DEFAULT 0,
      bvn TEXT,
      last_login_at TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.exec('ALTER TABLE users ADD COLUMN daily_transfer_limit REAL DEFAULT 50000;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN daily_withdrawal_limit REAL DEFAULT 50000;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN total_referred INTEGER DEFAULT 0;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN bvn TEXT;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN locked_until TEXT;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN email_receipts_enabled INTEGER DEFAULT 1;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN verification_token TEXT;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN reset_token_expiry TEXT;');
  } catch(e) { /* ignore duplicate column error */ }
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN category TEXT;');
  } catch(e) { /* ignore duplicate column error */ }

  // Create transaction categories table
  try {
    db.exec('ALTER TABLE users ADD COLUMN birthday TEXT;');
  } catch(e) { /* ignore duplicate column error */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      description TEXT,
      amount REAL,
      date TEXT,
      status TEXT,
      tx_ref TEXT,
      category TEXT,
      balance_after REAL,
      sub_wallet_id INTEGER,
      metadata TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sub_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      name TEXT,
      balance REAL DEFAULT 0,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sub_wallet_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sub_wallet_id INTEGER,
      user_id INTEGER,
      allowed_categories TEXT,
      FOREIGN KEY(sub_wallet_id) REFERENCES sub_wallets(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      points INTEGER,
      icon TEXT,
      color TEXT,
      bg TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      message TEXT,
      date TEXT,
      read INTEGER DEFAULT 0,
      type TEXT,
      transaction_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      sender_id INTEGER,
      sender_type TEXT, -- 'user', 'ai', 'agent'
      message TEXT,
      created_at TEXT,
      FOREIGN KEY(ticket_id) REFERENCES support_tickets(id)
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO system_settings (key, value) VALUES 
      ('transfer_fee', '10'),
      ('min_withdrawal', '1000'),
      ('maintenance_mode', 'false');

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT,
      target_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      phone TEXT,
      service_type TEXT,
      provider TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subscription TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Create indexes for performance with large datasets
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(is_agent, is_admin, is_customer_care);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

    -- Security events audit log
    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);

    -- Idempotency keys to prevent duplicate payments/transfers
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      user_id INTEGER,
      endpoint TEXT,
      response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Refresh tokens for JWT rotation
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Persistent OTP + 2FA code storage
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS otp_store (
        phone TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS two_factor_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL
      );
    `);
  } catch (e) { /* tables may already exist */ }

  db.exec(`
    INSERT OR IGNORE INTO rewards (id, title, points, icon, color, bg) VALUES 
    (1, '10% Off Airtime', 500, 'Star', 'text-amber-500', 'bg-amber-100 dark:bg-amber-900/30'),
    (2, 'Free 1GB Data', 1200, 'Gift', 'text-emerald-500', 'bg-emerald-100 dark:bg-emerald-900/30'),
    (3, '₦500 Cashback', 2000, 'Award', 'text-blue-500', 'bg-blue-100 dark:bg-blue-900/30'),
    (4, 'Premium Upgrade', 5000, 'Star', 'text-purple-500', 'bg-purple-100 dark:bg-purple-900/30');
  `);

  // Migrations: Add new columns if they don't exist
  const migrations = [
    'ALTER TABLE users ADD COLUMN phone TEXT',
    'ALTER TABLE users ADD COLUMN pin TEXT DEFAULT "1234"',
    'ALTER TABLE users ADD COLUMN is_live_mode INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN is_biometric_enabled INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN profile_photo TEXT',
    'ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT "active"',
    'ALTER TABLE users ADD COLUMN kyc_level INTEGER DEFAULT 1',
    'ALTER TABLE users ADD COLUMN currency TEXT DEFAULT "NGN"',
    'ALTER TABLE users ADD COLUMN is_agent INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN referral_code TEXT',
    'ALTER TABLE users ADD COLUMN hide_balance INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN is_customer_care INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP',
    'ALTER TABLE transactions ADD COLUMN tx_ref TEXT',
    'ALTER TABLE transactions ADD COLUMN category TEXT',
    'ALTER TABLE transactions ADD COLUMN balance_after REAL',
    'ALTER TABLE transactions ADD COLUMN sub_wallet_id INTEGER',
    'ALTER TABLE notifications ADD COLUMN transaction_id INTEGER',
    'ALTER TABLE users ADD COLUMN referred_by INTEGER',
    'ALTER TABLE users ADD COLUMN email_receipts_enabled INTEGER DEFAULT 0'
  ];

  for (const migration of migrations) {
    try {
      db.exec(migration);
    } catch (e) {
      // Column already exists
    }
  }

  // Set admin from environment variable (never hardcode admin emails)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kelvin@gmail.com';
  if (ADMIN_EMAIL) {
    try {
      db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(ADMIN_EMAIL);
      logger.info('[STARTUP] Admin role granted to configured ADMIN_EMAIL', { email: ADMIN_EMAIL });
    } catch (e) {
      logger.error('[STARTUP] Failed to set admin from ADMIN_EMAIL', { e });
    }
  } else {
    logger.warn('[STARTUP] ADMIN_EMAIL env var not set. Admin must be assigned manually via the admin panel or DB.');
  }

  // Create unique index separately to handle potential duplicates gracefully
  try {
    // Clean up duplicates by appending ID to phone number
    db.exec(`
      UPDATE users 
      SET phone = phone || '_' || id 
      WHERE phone IS NOT NULL AND phone != '' 
      AND id NOT IN (
        SELECT MIN(id) FROM users 
        WHERE phone IS NOT NULL AND phone != '' 
        GROUP BY phone
      )
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
  } catch (e) {
    console.error('Could not create unique index on phone:', e);
  }

  try {
    db.exec('ALTER TABLE users ADD COLUMN is_customer_care INTEGER DEFAULT 0');
  } catch (e) {
    // Column might already exist, ignore error
  }

  console.log('Database initialized successfully.');

const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 12); // Increased salt rounds to 12 for better security
};

const verifyPassword = (password: string, hash: string) => {
  return bcrypt.compareSync(password, hash);
};

const hashPin = (pin: string) => {
  return bcrypt.hashSync(pin, 10);
};

const verifyPin = (pin: string, hash: string) => {
  if (!hash) return false;
  if (!hash.startsWith('$2')) {
    logger.warn('[SECURITY] Rejecting legacy plaintext PIN — please have user reset their PIN');
    return false;
  }
  return bcrypt.compareSync(pin, hash);
};

const JWT_SECRET = process.env.JWT_SECRET || 'kosi-bills-dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kosi-bills-refresh-dev-secret-change-in-production';

// ─── BVN Encryption (AES-256-GCM) ──────────────────────────────────────────
const BVN_KEY_RAW = process.env.BVN_ENCRYPTION_KEY || 'kosi-bills-dev-bvn-key-32-chars!!';
const BVN_ENCRYPTION_KEY = Buffer.from(BVN_KEY_RAW.padEnd(32, '0').slice(0, 32));

function encryptBVN(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', BVN_ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    logger.error('[BVN] Encryption failed', { err });
    return text;
  }
}

function decryptBVN(stored: string): string {
  if (!stored) return '';
  if (!stored.startsWith('enc:')) return stored; // Legacy plaintext
  try {
    const [, ivHex, authTagHex, encHex] = stored.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', BVN_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encryptedText).toString('utf8') + decipher.final('utf8');
  } catch {
    logger.warn('[BVN] Decryption failed, returning masked value');
    return '***ENCRYPTED***';
  }
}

function maskBVN(bvn: string | null | undefined): string {
  if (!bvn) return '';
  const raw = decryptBVN(bvn);
  if (raw.length <= 4) return '****';
  return raw.slice(0, 2) + '*'.repeat(raw.length - 4) + raw.slice(-2);
}

// Strip sensitive fields and mask BVN before sending user data to the client
function sanitizeUser(user: any): any {
  if (!user) return user;
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.pin;
  delete sanitized.session_token;
  delete sanitized.verification_token;
  delete sanitized.reset_token;
  delete sanitized.reset_token_expiry;
  if (sanitized.bvn) sanitized.bvn = maskBVN(sanitized.bvn);
  return sanitized;
}

const processTransaction = db.transaction((userId: number, type: string, description: string, amount: number, date: string, status: string, category: string | null = null, subWalletId: number | null = null, txRef: string | null = null) => {
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw new Error('User not found');
  
  // Prevent negative balance for debits
  if (amount < 0 && user.balance < Math.abs(amount)) {
    throw new Error('Insufficient funds');
  }
  
  // 1. Update user balance
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, userId);
  const newBalance = user.balance + amount;
  
  // 2. Insert transaction
  const insertTx = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status, category, sub_wallet_id, tx_ref, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertTx.run(userId, type, description, amount, date, status, category, subWalletId, txRef, newBalance);

  // 3. Log transaction for admin with more details
  db.prepare('INSERT INTO admin_logs (action, target_id, details) VALUES (?, ?, ?)')
    .run('TRANSACTION_PROCESSED', userId, `Type: ${type}, Amount: ${amount}, Desc: ${description}, Status: ${status}, Ref: ${txRef}`);
  
  console.log(`[TRANSACTION] User ${userId}: ${type} of ${amount} - ${status}`);
});

const WEAK_PINS = new Set(['0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321','1212','0123','9876','1122','1357','2468']);

function isWeakPin(pin: string): boolean {
  if (!/^\d{4}$/.test(pin)) return true;
  return WEAK_PINS.has(pin);
}

function logSecurityEvent(userId: number | null, eventType: string, ip: string, userAgent: string, details: string = '') {
  try {
    db.prepare('INSERT INTO security_events (user_id, event_type, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)').run(userId, eventType, ip, userAgent, details);
  } catch (err) {
    logger.error('[SECURITY] Failed to log security event', { err, eventType });
  }
}

function checkIdempotency(key: string, userId: number, endpoint: string): { hit: boolean; response?: any } {
  if (!key) return { hit: false };
  const existing = db.prepare('SELECT response FROM idempotency_keys WHERE key = ? AND user_id = ? AND endpoint = ?').get(key, userId, endpoint) as any;
  if (existing) return { hit: true, response: JSON.parse(existing.response) };
  return { hit: false };
}

function saveIdempotency(key: string, userId: number, endpoint: string, response: any) {
  if (!key) return;
  try {
    db.prepare('INSERT OR IGNORE INTO idempotency_keys (key, user_id, endpoint, response) VALUES (?, ?, ?, ?)').run(key, userId, endpoint, JSON.stringify(response));
  } catch {}
}

function issueTokenPair(userId: number, email: string, sessionToken: string, ip: string, userAgent: string) {
  const accessToken = jwt.sign({ id: userId, email, session_token: sessionToken }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600000).toISOString(); // 30 days
  db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)').run(userId, refreshTokenHash, ip, userAgent, expiresAt);
  return { accessToken, refreshToken };
}

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const authenticateToken = (req: any, res: any, next: any) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.sendStatus(403);
    }
    
    const stmt = db.prepare('SELECT session_token FROM users WHERE id = ?');
    const user = stmt.get(decoded.id) as any;
    
    if (!user || user.session_token !== decoded.session_token) {
      return res.sendStatus(403);
    }
    
    req.user = decoded;
    next();
  });
};

// Helper to send push notifications
async function sendPushNotification(userId: number, title: string, body: string, data?: any) {
  try {
    const subscriptions = db.prepare('SELECT subscription FROM push_subscriptions WHERE user_id = ?').all(userId) as any[];
    
    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: data || {}
      }
    });

    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.subscription);
        await webpush.sendNotification(subscription, payload);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or no longer valid
          db.prepare('DELETE FROM push_subscriptions WHERE subscription = ?').run(sub.subscription);
        } else {
          console.error('Push notification error:', error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

// Helper to create notifications
function createNotification(userId: number, title: string, message: string, type: 'alert' | 'success' | 'info' | 'warning', transactionId?: number) {
  try {
    const stmt = db.prepare('INSERT INTO notifications (user_id, title, message, date, type, transaction_id) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(userId, title, message, new Date().toISOString(), type, transactionId || null);
    
    // Also send push notification
    sendPushNotification(userId, title, message, { type, transactionId });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  
  // Helmet for basic security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for dev/iframe compatibility
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false,
  }));

  // Compression middleware for better performance
  app.use(compression());
  
  // Rate limiting for sensitive routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: { success: false, error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 payment attempts per 15 min
    message: { success: false, error: 'Too many payment attempts. Please wait.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 PIN attempts per 15 min before lockout
    message: { success: false, error: 'Too many PIN attempts. Please wait 15 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skipSuccessfulRequests: true, // Only count failures
  });

  // Helper for input validation
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{11}$/.test(phone.replace(/\D/g, ''));

  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));

  // CSRF protection
  const csrfProtection = csrf({ 
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    } 
  });

  // Auth routes that legitimately have no CSRF token yet
  const CSRF_EXEMPT_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-2fa',
    '/api/auth/refresh-token',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/csrf-token',
  ];

  // Apply CSRF to all state-changing requests except exempt auth routes
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    if (CSRF_EXEMPT_PATHS.includes(req.path)) return next();
    return csrfProtection(req, res, next);
  });

  // CSRF token endpoint — client calls this once to get a valid token
  app.get('/api/csrf-token', csrfProtection, (req: any, res) => {
    res.json({ token: req.csrfToken() });
  });

  // Termii SMS Helper
  const sendSMS = async (to: string, message: string) => {
    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || 'KosiBills';

    if (!apiKey) {
      console.warn('Termii API Key not configured. SMS not sent.');
      return { success: false, error: 'API Key missing' };
    }

    try {
      const response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: apiKey
        })
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Termii SMS Error:', error);
      return { success: false, error };
    }
  };

  // Email Helper
  const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'Kosi Bills <noreply@kosibills.com>';

    if (!host || !user || !pass) {
      console.warn('SMTP configuration missing. Email not sent.');
      return { success: false, error: 'SMTP config missing' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text
      });

      return { success: true };
    } catch (error) {
      console.error('Email Error:', error);
      return { success: false, error };
    }
  };

  const sendTransactionEmail = async (userId: number, title: string, message: string) => {
    try {
      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as any;
      if (user && user.email) {
        await sendEmail(
          user.email,
          `Transaction Notification: ${title}`,
          `Hello ${user.name || 'User'},\n\n${message}\n\nBest regards,\nKosi Bills Team`
        );
      }
    } catch (error) {
      console.error('Failed to send transaction email:', error);
    }
  };

  // API Routes
  // DB-backed OTP helpers (survive server restarts)
  const saveOtp = (phone: string, otp: string) => {
    const expiresAt = new Date(Date.now() + 600000).toISOString();
    db.prepare('INSERT OR REPLACE INTO otp_store (phone, otp, expires_at) VALUES (?, ?, ?)').run(phone, otp, expiresAt);
  };
  const verifyAndConsumeOtp = (phone: string, otp: string): boolean => {
    const row = db.prepare('SELECT otp FROM otp_store WHERE phone = ? AND expires_at > ?').get(phone, new Date().toISOString()) as any;
    if (!row || row.otp !== otp) return false;
    db.prepare('DELETE FROM otp_store WHERE phone = ?').run(phone);
    return true;
  };
  const save2FA = (email: string, code: string, userId: number) => {
    const expiresAt = new Date(Date.now() + 300000).toISOString();
    db.prepare('INSERT OR REPLACE INTO two_factor_codes (email, code, user_id, expires_at) VALUES (?, ?, ?, ?)').run(email, code, userId, expiresAt);
  };
  const consume2FA = (email: string, code: string): { userId: number } | null => {
    const row = db.prepare('SELECT user_id FROM two_factor_codes WHERE email = ? AND code = ? AND expires_at > ?').get(email, code, new Date().toISOString()) as any;
    if (!row) return null;
    db.prepare('DELETE FROM two_factor_codes WHERE email = ?').run(email);
    return { userId: row.user_id };
  };

  app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOtp(phone, otp);
    
    const message = `Your Kosi Bills OTP is ${otp}. Valid for 10 minutes.`;

    const result = await sendSMS(phone, message);
    if (result.success) {
      res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (verifyAndConsumeOtp(phone, otp)) {
      res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
    const { name, email, phone, password } = result.data;
    const referredByCode = req.body.referralCode || null;
    try {
      const safeName = name || 'USR';
      const referralCode = `KOSI-${safeName.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Look up referrer
      let referrerId: number | null = null;
      if (referredByCode) {
        const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referredByCode) as any;
        if (referrer) referrerId = referrer.id;
      }

      const stmt = db.prepare('INSERT INTO users (name, email, phone, password, balance, tier, pin, referral_code, last_login_at, verification_token, referred_by, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      // Start with 0 balance and unverified email
      const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      const info = stmt.run(name, email, phone, hashPassword(password), 0, 'Basic', hashPin('1234'), referralCode, new Date().toISOString(), verificationToken, referrerId, smtpConfigured ? 0 : 1);

      // Credit referrer if found
      if (referrerId) {
        db.prepare('UPDATE users SET total_referred = total_referred + 1 WHERE id = ?').run(referrerId);
        createNotification(referrerId, 'New Referral!', `${name} just signed up using your referral code. Keep sharing!`, 'success');
      }
      
      // Send Verification Email (only if SMTP is configured)
      if (smtpConfigured) {
        const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}`;
        try {
          sendEmail(
            email,
            'Verify Your Email - Kosi Bills',
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2>Welcome to Kosi Bills!</h2>
              <p>Hello ${name},</p>
              <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p>Best regards,<br>Kosi Bills Team</p>
            </div>
            `
          );
        } catch (error) {
          logger.error('[AUTH] Failed to send verification email', { error });
        }
      }

      // Add initial transaction
      const txStmt = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status) VALUES (?, ?, ?, ?, ?, ?)');
      txStmt.run(info.lastInsertRowid, 'Wallet Fund', 'Account Created', 0, new Date().toISOString(), 'success');

      let isAdmin = false;
      if (ADMIN_EMAIL && email === ADMIN_EMAIL) {
        db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(info.lastInsertRowid);
        isAdmin = true;
      }

      const sessionToken = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(sessionToken, info.lastInsertRowid);

      const regIp = (req as any).ip || 'unknown';
      const regUa = (req as any).headers?.['user-agent'] || 'unknown';
      const { accessToken: regAccessToken, refreshToken: regRefreshToken } = issueTokenPair(Number(info.lastInsertRowid), email, sessionToken, regIp, regUa);
      logSecurityEvent(Number(info.lastInsertRowid), 'REGISTER', regIp, regUa, `email: ${email}`);
      
      // Send Welcome Email
      if (smtpConfigured) {
        sendEmail(
          email,
          'Welcome to Kosi Bills!',
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <h2>Welcome to Kosi Bills! 🎉</h2>
            <p>Hello ${name},</p>
            <p>Welcome to Kosi Bills! We're excited to have you on board. You can now fund your wallet, pay bills, and manage your finances with ease.</p>
            <p><strong>Your referral code is: ${referralCode}</strong></p>
            <p>Share this code with friends and earn rewards when they sign up!</p>
            <p>Best regards,<br>Kosi Bills Team</p>
          </div>
          `
        ).catch(err => logger.error('[AUTH] Failed to send welcome email', { error: err }));
      }

      res.cookie('token', regAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
      res.cookie('refresh_token', regRefreshToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({ 
        success: true, 
        user: { 
          id: info.lastInsertRowid, 
          name, 
          email, 
          phone,
          balance: 0, 
          tier: 'Basic', 
          isLiveMode: false, 
          isBiometricEnabled: false,
          hasPin: true,
          accountStatus: 'active',
          kycLevel: 1,
          currency: 'NGN',
          isAgent: false,
          isAdmin,
          referralCode,
          hideBalance: false
        } 
      });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Database error' });
      }
    }
  });

  app.get('/api/auth/verify-email', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    try {
      const user = db.prepare('SELECT id FROM users WHERE verification_token = ?').get(token) as any;
      if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

      db.prepare('UPDATE users SET is_email_verified = 1, verification_token = NULL WHERE id = ?').run(user.id);
      
      res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #10b981;">Email Verified!</h1>
          <p>Your email has been successfully verified. You can now log in to your account.</p>
          <a href="/" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to App</a>
        </div>
      `);
    } catch (error) {
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  app.post('/api/auth/resend-verification', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
      const user = db.prepare('SELECT id, name, is_email_verified FROM users WHERE email = ?').get(email) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.is_email_verified) return res.status(400).json({ error: 'Email already verified' });

      const verificationToken = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE users SET verification_token = ? WHERE id = ?').run(verificationToken, user.id);

      const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}`;
      sendEmail(
        email,
        'Verify Your Email - Kosi Bills',
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Email Verification</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Best regards,<br>Kosi Bills Team</p>
        </div>
        `
      );

      res.json({ success: true, message: 'Verification email sent' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  });

  app.post('/api/auth/google', (req, res) => {
    const { name, email, profilePhoto } = req.body;
    try {
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      
      if (!user) {
        const safeName = name || 'USR';
        const safeProfilePhoto = profilePhoto || null;
        const referralCode = `KOSI-${safeName.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
        const stmt = db.prepare('INSERT INTO users (name, email, phone, password, balance, tier, pin, referral_code, profile_photo, last_login_at, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const info = stmt.run(safeName, email, null, hashPassword(randomPassword), 0, 'Basic', hashPin('1234'), referralCode, safeProfilePhoto, new Date().toISOString(), 1);
        
        const txStmt = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status) VALUES (?, ?, ?, ?, ?, ?)');
        txStmt.run(info.lastInsertRowid, 'Wallet Fund', 'Account Created', 0, new Date().toISOString(), 'success');
        
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as any;
      } else {
        db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
      }
      
      if (ADMIN_EMAIL && email === ADMIN_EMAIL && !user.is_admin) {
        db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(user.id);
        user.is_admin = 1;
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      const mappedUser = {
        ...userWithoutPassword,
        isLiveMode: !!userWithoutPassword.is_live_mode,
        isBiometricEnabled: !!userWithoutPassword.is_biometric_enabled,
        isAgent: !!userWithoutPassword.is_agent,
        isAdmin: !!userWithoutPassword.is_admin,
        isCustomerCare: !!userWithoutPassword.is_customer_care,
        hideBalance: !!userWithoutPassword.hide_balance,
        accountStatus: userWithoutPassword.account_status,
        kycLevel: userWithoutPassword.kyc_level,
        profilePhoto: userWithoutPassword.profile_photo,
        referralCode: userWithoutPassword.referral_code,
        isEmailVerified: !!userWithoutPassword.is_email_verified,
        emailReceiptsEnabled: !!userWithoutPassword.email_receipts_enabled
      };
      
      const sessionToken = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(sessionToken, mappedUser.id);

      const gIp = (req as any).ip || 'unknown';
      const gUa = (req as any).headers?.['user-agent'] || 'unknown';
      const { accessToken: gAccessToken, refreshToken: gRefreshToken } = issueTokenPair(mappedUser.id, mappedUser.email, sessionToken, gIp, gUa);
      logSecurityEvent(mappedUser.id, 'GOOGLE_LOGIN', gIp, gUa, `email: ${mappedUser.email}`);
      
      res.cookie('token', gAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
      res.cookie('refresh_token', gRefreshToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
      });
      
      createNotification(mappedUser.id, 'New Login', 'A new sign-in was detected on your account via Google.', 'info');
      
      res.json({ success: true, user: sanitizeUser(mappedUser) });
    } catch (error: any) {
      logger.error('[AUTH] Google Auth Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Database error' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
    const { email, password } = result.data;
    
    const ip = (req as any).ip || 'unknown';
    const ua = (req as any).headers?.['user-agent'] || 'unknown';
    
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;
    
    if (user && verifyPassword(password, user.password)) {
      // Check if email is verified (skip for admin email)
      if (!user.is_email_verified && email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Please verify your email before logging in. Check your inbox for the verification link.' });
      }
      
      if (ADMIN_EMAIL && email === ADMIN_EMAIL && !user.is_admin) {
        db.prepare('UPDATE users SET is_admin = 1, last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
        user.is_admin = 1;
      } else {
        db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
      }
      
      // Remove sensitive fields from response
      const { password: _, pin: _pin, session_token: _session, verification_token: _vtoken, reset_token: _rtoken, reset_token_expiry: _rexp, ...userWithoutPassword } = user;
      
      // Convert SQLite 0/1 to boolean and map keys
      const mappedUser = {
        ...userWithoutPassword,
        hasPin: !!(user.pin),
        isLiveMode: !!userWithoutPassword.is_live_mode,
        isBiometricEnabled: !!userWithoutPassword.is_biometric_enabled,
        isAgent: !!userWithoutPassword.is_agent,
        isAdmin: !!userWithoutPassword.is_admin,
        isCustomerCare: !!userWithoutPassword.is_customer_care,
        hideBalance: !!userWithoutPassword.hide_balance,
        accountStatus: userWithoutPassword.account_status,
        kycLevel: userWithoutPassword.kyc_level,
        profilePhoto: userWithoutPassword.profile_photo,
        referralCode: userWithoutPassword.referral_code,
        twoFactorEnabled: !!userWithoutPassword.two_factor_enabled,
        isEmailVerified: !!userWithoutPassword.is_email_verified,
        emailReceiptsEnabled: !!userWithoutPassword.email_receipts_enabled
      };

      // Check for 2FA - only enforce if SMTP is configured
      const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      if (mappedUser.twoFactorEnabled && smtpConfigured) {
        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        save2FA(mappedUser.email, twoFactorCode, mappedUser.id);

        sendEmail(
          mappedUser.email,
          'Your 2FA Verification Code',
          `Hello ${mappedUser.name || 'User'},\n\nYour Kosi Bills login verification code is: ${twoFactorCode}\n\nThis code will expire in 5 minutes.\n\nBest regards,\nKosi Bills Team`
        );

        return res.json({ 
          success: true, 
          requires2FA: true, 
          email: mappedUser.email,
          message: 'Verification code sent to your email' 
        });
      }
      
      const sessionToken = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(sessionToken, mappedUser.id);

      const { accessToken, refreshToken } = issueTokenPair(mappedUser.id, mappedUser.email, sessionToken, ip, ua);
      
      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      logSecurityEvent(mappedUser.id, 'LOGIN_SUCCESS', ip, ua, `email: ${mappedUser.email}`);
      logger.info('[AUTH] Successful login', { userId: mappedUser.id, email: mappedUser.email, ip });

      // Send Login Notification Email (non-blocking)
      sendEmail(
        mappedUser.email,
        'New Login Detected',
        `Hello ${mappedUser.name || 'User'},\n\nA new login was detected on your Kosi Bills account at ${new Date().toLocaleString()}.\n\nIf this was not you, please secure your account immediately.\n\nBest regards,\nKosi Bills Team`
      ).catch(err => logger.warn('[AUTH] Failed to send login notification email', { error: err?.message }));
      
      // Create login notification (non-blocking)
      try {
        createNotification(mappedUser.id, 'New Login', 'A new sign-in was detected on your account.', 'info');
      } catch (err) {
        logger.warn('[AUTH] Failed to create login notification', { error: err });
      }
      
      res.json({ success: true, user: sanitizeUser({ ...mappedUser }) });
    } else {
      // Increment failed login attempts
      const maxAttempts = 5;
      const lockoutMinutes = 30;
      
      if (user) {
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        if (newAttempts >= maxAttempts) {
          // Lock the account
          const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
          db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(newAttempts, lockedUntil, user.id);
          logger.warn('[SECURITY] Account locked due to failed login attempts', { email, ip, userId: user.id, attempts: newAttempts });
          logSecurityEvent(user.id, 'ACCOUNT_LOCKED', ip, ua, `email: ${email}, attempts: ${newAttempts}`);
          return res.status(403).json({ 
            error: `Account locked due to too many failed login attempts. Please try again in ${lockoutMinutes} minutes.` 
          });
        } else {
          db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(newAttempts, user.id);
          const remainingAttempts = maxAttempts - newAttempts;
          logger.warn('[AUTH] Failed login attempt', { email, ip, userId: user.id, attempts: newAttempts, remaining: remainingAttempts });
          return res.status(401).json({ 
            error: `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.` 
          });
        }
      }
      
      logSecurityEvent(null, 'LOGIN_FAILED', ip, ua, `email: ${email}`);
      logger.warn('[AUTH] Failed login attempt', { email, ip });
      res.status(401).json({ error: 'Invalid email or password' });
    }
  });

  // Refresh Token Endpoint
  app.post('/api/auth/refresh', async (req: any, res) => {
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > ?').get(tokenHash, new Date().toISOString()) as any;
      
      if (!stored) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const user = db.prepare('SELECT id, email, session_token FROM users WHERE id = ?').get(stored.user_id) as any;
      if (!user) return res.status(401).json({ error: 'User not found' });

      // Rotate: delete old refresh token and issue new pair
      db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);

      const newSessionToken = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(newSessionToken, user.id);

      const ip = req.ip || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = issueTokenPair(user.id, user.email, newSessionToken, ip, ua);

      res.cookie('token', newAccessToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 60 * 60 * 1000
      });
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
      });

      logger.info('[AUTH] Token refreshed', { userId: user.id, ip });
      res.json({ success: true, message: 'Token refreshed' });
    } catch (err) {
      logger.error('[AUTH] Refresh token error', { err });
      res.status(500).json({ error: 'Token refresh failed' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
      const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(resetToken, expiry, user.id);

      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      if (smtpConfigured) {
        const emailResult = await sendEmail(
          email,
          'Reset Your Password - Kosi Bills',
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Best regards,<br>Kosi Bills Team</p>
          </div>
          `
        );
        if (emailResult.success) {
          res.json({ success: true, message: 'Reset link sent to your email' });
        } else {
          logger.error('[AUTH] Failed to send reset email', { error: emailResult.error });
          res.json({ success: true, message: 'Reset link generated (email sending failed)', resetUrl, resetToken });
        }
      } else {
        // Return the reset URL in response for development without SMTP
        logger.warn('[AUTH] SMTP not configured, returning reset token in response', { email });
        res.json({ success: true, message: 'Reset link generated (SMTP not configured)', resetUrl, resetToken });
      }
    } catch (error) {
      logger.error('[AUTH] Forgot password error', { error });
      res.status(500).json({ error: 'Failed to process request' });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    try {
      const user = db.prepare('SELECT id, name, email FROM users WHERE reset_token = ? AND reset_token_expiry > ?').get(token, new Date().toISOString()) as any;
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

      db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?').run(hashPassword(newPassword), user.id);
      
      createNotification(user.id, 'Password Changed', 'Your account password has been successfully reset.', 'warning');
      
      const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      if (smtpConfigured) {
        sendEmail(
          user.email,
          'Password Reset Successful',
          `Hello ${user.name || 'User'},\n\nYour Kosi Bills account password has been successfully reset. If you did not perform this action, please contact support immediately.\n\nBest regards,\nKosi Bills Team`
        );
      } else {
        logger.warn('[AUTH] SMTP not configured, skipping password reset email', { email: user.email });
      }

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.post('/api/auth/verify-2fa', (req, res) => {
    const { email, code } = req.body;
    const storedData = consume2FA(email, code);

    if (!storedData) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(storedData.userId) as any;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(sessionToken, user.id);

    const tfaIp = (req as any).ip || 'unknown';
    const tfaUa = (req as any).headers?.['user-agent'] || 'unknown';
    const { accessToken: tfaToken, refreshToken: tfaRefresh } = issueTokenPair(user.id, user.email, sessionToken, tfaIp, tfaUa);
    logSecurityEvent(user.id, '2FA_LOGIN_SUCCESS', tfaIp, tfaUa, `email: ${user.email}`);
    
    res.cookie('token', tfaToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    res.cookie('refresh_token', tfaRefresh, {
      httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      user: sanitizeUser({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        tier: user.tier,
        isLiveMode: !!user.is_live_mode,
        isAgent: !!user.is_agent,
        isAdmin: !!user.is_admin,
        isCustomerCare: !!user.is_customer_care,
        referralCode: user.referral_code
      })
    });
  });

  app.post('/api/auth/2fa/toggle', authenticateToken, (req: any, res) => {
    const { enabled } = req.body;
    const userId = req.user.id;

    try {
      db.prepare('UPDATE users SET two_factor_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
      res.json({ success: true, message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update 2FA status' });
    }
  });

  // Get User Details
  app.get('/api/user/:id', authenticateToken, (req: any, res) => {
    const { id } = req.params;
    // Users can only fetch their own profile (admin fetches go through /api/admin/users)
    if (Number(id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    try {
      const stmt = db.prepare('SELECT id, name, email, phone, balance, tier, pin, is_live_mode as isLiveMode, is_biometric_enabled as isBiometricEnabled, profile_photo as profilePhoto, account_status as accountStatus, kyc_level as kycLevel, currency, is_agent as isAgent, is_admin as isAdmin, is_customer_care as isCustomerCare, referral_code as referralCode, hide_balance as hideBalance, daily_transfer_limit as dailyTransferLimit, daily_withdrawal_limit as dailyWithdrawalLimit, total_referred as totalReferred, bvn, last_login_at as lastLoginAt, two_factor_enabled as twoFactorEnabled FROM users WHERE id = ?');
      const user = stmt.get(id) as any;
      
      if (user) {
        user.hasPin = !!(user.pin);
        user.isLiveMode = !!user.isLiveMode;
        user.isBiometricEnabled = !!user.isBiometricEnabled;
        user.isAgent = !!user.isAgent;
        user.isAdmin = !!user.isAdmin;
        user.isCustomerCare = !!user.isCustomerCare;
        user.hideBalance = !!user.hideBalance;
        res.json({ success: true, user: sanitizeUser(user) });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Verify PIN - rate limited to prevent brute force
  app.post('/api/user/verify-pin', authenticateToken, pinLimiter, (req: any, res) => {
    const { userId, pin } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN must be a 4-digit number' });
    const user = db.prepare('SELECT pin FROM users WHERE id = ?').get(userId) as any;
    if (user && verifyPin(pin, user.pin)) {
      res.json({ success: true });
    } else {
      logSecurityEvent(Number(userId), 'PIN_VERIFY_FAILED', ip, ua, 'Invalid PIN attempt');
      logger.warn('[SECURITY] Failed PIN verification', { userId, ip });
      res.status(401).json({ error: 'Invalid transaction PIN' });
    }
  });

  // Update User Profile/Settings
  app.post('/api/user/update', authenticateToken, (req: any, res) => {
    const { userId, tier, isLiveMode, isBiometricEnabled, hideBalance, pin, name, password, phone, profilePhoto, accountStatus, kycLevel, currency } = req.body;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const stmt = db.prepare(`
        UPDATE users 
        SET tier = COALESCE(?, tier), 
            is_live_mode = COALESCE(?, is_live_mode), 
            is_biometric_enabled = COALESCE(?, is_biometric_enabled),
            hide_balance = COALESCE(?, hide_balance),
            pin = COALESCE(?, pin),
            name = COALESCE(?, name),
            password = COALESCE(?, password),
            phone = COALESCE(?, phone),
            profile_photo = COALESCE(?, profile_photo),
            account_status = COALESCE(?, account_status),
            kyc_level = COALESCE(?, kyc_level),
            currency = COALESCE(?, currency)
        WHERE id = ?
      `);
      
      if (pin && isWeakPin(pin)) {
        return res.status(400).json({ error: 'PIN is too weak. Avoid sequential or repeating digits (e.g. 1234, 0000).' });
      }
      if (password && password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }
      const hashedPass = password ? hashPassword(password) : null;
      const hashedPin = pin ? hashPin(pin) : null;
      stmt.run(
        tier, 
        isLiveMode !== undefined ? (isLiveMode ? 1 : 0) : null, 
        isBiometricEnabled !== undefined ? (isBiometricEnabled ? 1 : 0) : null, 
        hideBalance !== undefined ? (hideBalance ? 1 : 0) : null,
        hashedPin, 
        name, 
        hashedPass, 
        phone, 
        profilePhoto, 
        accountStatus, 
        kycLevel, 
        currency, 
        userId
      );

      if (password) {
        createNotification(userId, 'Password Updated', 'Your account password was updated successfully.', 'warning');
      }
      if (pin) {
        createNotification(userId, 'PIN Updated', 'Your transaction PIN was updated successfully.', 'warning');
      }
      
      const updatedUser = db.prepare('SELECT id, name, email, phone, balance, tier, is_live_mode as isLiveMode, is_biometric_enabled as isBiometricEnabled, profile_photo as profilePhoto, account_status as accountStatus, kyc_level as kycLevel, currency, is_agent as isAgent, is_admin as isAdmin, is_customer_care as isCustomerCare, referral_code as referralCode, hide_balance as hideBalance, daily_transfer_limit as dailyTransferLimit, daily_withdrawal_limit as dailyWithdrawalLimit, total_referred as totalReferred, bvn, last_login_at as lastLoginAt, two_factor_enabled as twoFactorEnabled FROM users WHERE id = ?').get(userId) as any;
      
      if (updatedUser) {
        const pinRow = db.prepare('SELECT pin FROM users WHERE id = ?').get(userId) as any;
        updatedUser.hasPin = !!(pinRow?.pin);
        updatedUser.isLiveMode = !!updatedUser.isLiveMode;
        updatedUser.isBiometricEnabled = !!updatedUser.isBiometricEnabled;
        updatedUser.isAgent = !!updatedUser.isAgent;
        updatedUser.isAdmin = !!updatedUser.isAdmin;
        updatedUser.isCustomerCare = !!updatedUser.isCustomerCare;
        updatedUser.hideBalance = !!updatedUser.hideBalance;

        // Send email if password was changed
        if (password) {
          sendEmail(
            updatedUser.email,
            'Security Alert: Password Changed',
            `Hello ${updatedUser.name || 'User'},\n\nYour Kosi Bills account password has been successfully changed. If you did not perform this action, please contact support immediately.\n\nBest regards,\nKosi Bills Team`
          );
        }

        res.json({ success: true, user: sanitizeUser(updatedUser) });
      } else {
        res.status(404).json({ error: 'User not found after update' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  });

  // BVN Update Endpoint - encrypts BVN before storage
  app.post('/api/user/update-bvn', authenticateToken, (req: any, res) => {
    const { userId, bvn } = req.body;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    if (!bvn || !/^\d{11}$/.test(bvn)) return res.status(400).json({ error: 'BVN must be an 11-digit number' });
    try {
      const encryptedBVN = encryptBVN(bvn);
      db.prepare('UPDATE users SET bvn = ? WHERE id = ?').run(encryptedBVN, userId);
      logger.info('[KYC] BVN updated', { userId });
      res.json({ success: true, bvn: maskBVN(encryptedBVN) });
    } catch (error) {
      logger.error('[KYC] BVN update failed', { userId, error });
      res.status(500).json({ error: 'Failed to update BVN' });
    }
  });

  // Logout Endpoint - invalidates refresh tokens
  app.post('/api/auth/logout', authenticateToken, (req: any, res) => {
    try {
      const refreshToken = req.cookies.refresh_token;
      if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);
      }
      db.prepare('UPDATE users SET session_token = NULL WHERE id = ?').run(req.user.id);
      res.clearCookie('token');
      res.clearCookie('refresh_token');
      logSecurityEvent(req.user.id, 'LOGOUT', req.ip || 'unknown', req.headers['user-agent'] || 'unknown');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  app.post('/api/user/apply-agent', authenticateToken, (req: any, res) => {
    const { userId } = req.body;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      db.prepare('UPDATE users SET is_agent = 1 WHERE id = ?').run(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to apply for agent' });
    }
  });

  app.post('/api/user/toggle-email-receipts', authenticateToken, (req: any, res) => {
    const { enabled } = req.body;
    try {
      db.prepare('UPDATE users SET email_receipts_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update preference' });
    }
  });

  // Sub-Wallets Endpoints
  app.get('/api/sub-wallets/:userId', authenticateToken, (req: any, res) => {
    // Enforce that a user can only fetch their own sub-wallets
    const userId = req.user.id;
    try {
      // Get owned sub-wallets
      const owned = db.prepare('SELECT * FROM sub_wallets WHERE owner_id = ?').all(userId);

      // Get shared sub-wallets (user is a member but not owner)
      const shared = db.prepare(`
        SELECT sw.*, swm.allowed_categories 
        FROM sub_wallets sw 
        JOIN sub_wallet_members swm ON sw.id = swm.sub_wallet_id 
        WHERE swm.user_id = ?
      `).all(userId);

      // Fix N+1: fetch all members for all owned wallets in a single query
      let ownedWithMembers: any[] = [];
      if (owned.length > 0) {
        const ids = (owned as any[]).map((w: any) => w.id);
        const placeholders = ids.map(() => '?').join(',');
        const allMembers = db.prepare(`
          SELECT swm.*, u.name, u.email 
          FROM sub_wallet_members swm 
          JOIN users u ON swm.user_id = u.id 
          WHERE swm.sub_wallet_id IN (${placeholders})
        `).all(...ids);
        const membersByWallet: Record<number, any[]> = {};
        for (const m of allMembers as any[]) {
          if (!membersByWallet[m.sub_wallet_id]) membersByWallet[m.sub_wallet_id] = [];
          membersByWallet[m.sub_wallet_id].push(m);
        }
        ownedWithMembers = (owned as any[]).map((w: any) => ({ ...w, members: membersByWallet[w.id] || [] }));
      }

      res.json({ success: true, owned: ownedWithMembers, shared });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sub-wallets' });
    }
  });

  app.post('/api/sub-wallets/create', authenticateToken, (req: any, res) => {
    const { name } = req.body;
    const ownerId = req.user.id; // taken from JWT, not body
    try {
      const stmt = db.prepare('INSERT INTO sub_wallets (owner_id, name, balance) VALUES (?, ?, 0)');
      const info = stmt.run(ownerId, name);
      res.json({ success: true, subWalletId: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create sub-wallet' });
    }
  });

  app.post('/api/sub-wallets/fund', authenticateToken, (req: any, res) => {
    const { subWalletId, amount } = req.body;
    const userId = req.user.id; // taken from JWT, not body
    try {
      const updateMain = db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
      const updateSub = db.prepare('UPDATE sub_wallets SET balance = balance + ? WHERE id = ?');
      const insertTx = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status, category, sub_wallet_id, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

      const runTransaction = db.transaction(() => {
        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
        if (!user || user.balance < amount) {
          throw new Error('Insufficient balance');
        }

        updateMain.run(amount, userId);
        updateSub.run(amount, subWalletId);
        const newBalance = user.balance - amount;
        insertTx.run(userId, 'Sub-Wallet Funding', `Funded sub-wallet #${subWalletId}`, -amount, new Date().toISOString(), 'success', 'Transfer', subWalletId, newBalance);
      });

      runTransaction();
      
      createNotification(userId, 'Sub-Wallet Funded', `You successfully funded sub-wallet #${subWalletId} with ₦${amount.toLocaleString()}`, 'success');
      
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Insufficient balance') {
        res.status(400).json({ error: 'Insufficient balance' });
      } else {
        res.status(500).json({ error: 'Failed to fund sub-wallet' });
      }
    }
  });

  app.post('/api/sub-wallets/add-member', authenticateToken, (req: any, res) => {
    const { subWalletId, email, allowedCategories } = req.body;
    const requesterId = req.user.id;
    try {
      // Ensure only the owner can add members
      const wallet = db.prepare('SELECT owner_id FROM sub_wallets WHERE id = ?').get(subWalletId) as any;
      if (!wallet) return res.status(404).json({ error: 'Sub-wallet not found' });
      if (wallet.owner_id !== requesterId) return res.status(403).json({ error: 'Only the wallet owner can add members' });

      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const checkMember = db.prepare('SELECT id FROM sub_wallet_members WHERE sub_wallet_id = ? AND user_id = ?').get(subWalletId, user.id);
      if (checkMember) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      const stmt = db.prepare('INSERT INTO sub_wallet_members (sub_wallet_id, user_id, allowed_categories) VALUES (?, ?, ?)');
      stmt.run(subWalletId, user.id, allowedCategories);
      
      createNotification(user.id, 'Added to Sub-Wallet', `You have been added as a member to sub-wallet #${subWalletId}`, 'info');
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add member' });
    }
  });

  // Payment Endpoint
  app.post('/api/payments/pay', authenticateToken, paymentLimiter, (req: any, res) => {
    const { userId, pin, type, description, amount, metadata } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    // Validate amount
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || !isFinite(parsedAmount)) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    // Idempotency check
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey, Number(userId), 'payment');
      if (cached.hit) return res.json(cached.response);
    }

    try {
      const updateBalance = db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
      const insertTx = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status, balance_after, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

      let txId: number | bigint = 0;
      let finalAmount = parsedAmount;
      
      const userStmt = db.prepare('SELECT balance, is_agent, pin FROM users WHERE id = ?');
      const user = userStmt.get(userId) as any;

      if (!user) throw new Error('User not found');
      
      if (user.pin && (!pin || !verifyPin(pin, user.pin))) {
        const payIp = req.ip || 'unknown';
        const payUa = req.headers['user-agent'] || 'unknown';
        logSecurityEvent(Number(userId), 'PAYMENT_PIN_FAILED', payIp, payUa, `type: ${type}, amount: ${parsedAmount}`);
        return res.status(400).json({ success: false, error: 'Invalid transaction PIN' });
      }
      
      if (user.is_agent) {
        finalAmount = parsedAmount * 0.98; // 2% discount
      }

      if (user.balance < finalAmount) {
        insertTx.run(userId, type, description, -finalAmount, new Date().toISOString(), 'failed', user.balance, metadata ? JSON.stringify(metadata) : null);
        return res.status(400).json({ success: false, error: 'Insufficient balance' });
      }

      const transaction = db.transaction(() => {
        updateBalance.run(finalAmount, userId);
        const newBalance = user.balance - finalAmount;
        const result = insertTx.run(userId, type, description, -finalAmount, new Date().toISOString(), 'success', newBalance, metadata ? JSON.stringify(metadata) : null);
        txId = result.lastInsertRowid;
      });

      transaction();

      // Process VTU transactions through JaraPoint API
      if (metadata && (type === 'Airtime' || type === 'Data' || type === 'Electricity' || type === 'Cable TV')) {
        let vtuResult;
        try {
          if (type === 'Airtime') {
            vtuResult = await jarapoint.buyAirtime(
              metadata.phone,
              finalAmount,
              metadata.network
            );
          } else if (type === 'Data') {
            vtuResult = await jarapoint.buyData(
              metadata.phone,
              metadata.plan,
              metadata.network
            );
          } else if (type === 'Electricity') {
            vtuResult = await jarapoint.buyElectricity(
              metadata.meterNumber,
              finalAmount,
              metadata.provider
            );
          } else if (type === 'Cable TV') {
            vtuResult = await jarapoint.buyCableTV(
              metadata.iucNumber,
              metadata.plan,
              metadata.provider
            );
          }

          if (!vtuResult.status) {
            // VTU failed, refund the user
            const refundTx = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status, balance_after, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            const refundStmt = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
            const refundTransaction = db.transaction(() => {
              refundStmt.run(finalAmount, userId);
              const refundUser = userStmt.get(userId) as any;
              refundTx.run(userId, 'Refund', `VTU failed: ${vtuResult.message}`, finalAmount, new Date().toISOString(), 'success', refundUser.balance, JSON.stringify({ originalTxId: txId }));
            });
            refundTransaction();
            return res.status(400).json({ success: false, error: `VTU failed: ${vtuResult.message}` });
          }

          logger.info('[VTU] Transaction processed through JaraPoint', { type, txId, reference: vtuResult.reference });
        } catch (vtuError: any) {
          logger.error('[VTU] JaraPoint API error', { type, error: vtuError.message });
          // Don't fail the transaction, log it for manual review
        }
      }

      const updatedUser = db.prepare('SELECT id, name, email, phone, balance, tier, is_live_mode as isLiveMode, is_biometric_enabled as isBiometricEnabled, profile_photo as profilePhoto, account_status as accountStatus, kyc_level as kycLevel, currency, is_agent as isAgent, is_admin as isAdmin, is_customer_care as isCustomerCare, referral_code as referralCode, hide_balance as hideBalance, daily_transfer_limit as dailyTransferLimit, daily_withdrawal_limit as dailyWithdrawalLimit, total_referred as totalReferred, bvn, last_login_at as lastLoginAt, two_factor_enabled as twoFactorEnabled, email_receipts_enabled as emailReceiptsEnabled FROM users WHERE id = ?').get(userId) as any;
      const pinRowPay = db.prepare('SELECT pin FROM users WHERE id = ?').get(userId) as any;
      updatedUser.hasPin = !!(pinRowPay?.pin);
      updatedUser.isLiveMode = !!updatedUser.isLiveMode;
      updatedUser.isBiometricEnabled = !!updatedUser.isBiometricEnabled;
      updatedUser.isAgent = !!updatedUser.isAgent;
      updatedUser.isAdmin = !!updatedUser.isAdmin;
      updatedUser.isCustomerCare = !!updatedUser.isCustomerCare;
      updatedUser.hideBalance = !!updatedUser.hideBalance;
      updatedUser.emailReceiptsEnabled = !!updatedUser.emailReceiptsEnabled;

      const notificationMsg = `Your ${type} payment of ₦${finalAmount.toLocaleString()} was successful. Ref: ${txId}`;
      
      // Send email notification to user
      if (updatedUser && updatedUser.email && updatedUser.emailReceiptsEnabled) {
        sendEmail(
          updatedUser.email,
          `Transaction Receipt: ${type}`,
          `Hello ${updatedUser.name || 'User'},\n\nYour ${type} payment of ₦${finalAmount.toLocaleString()} was successful.\n\nTransaction Details:\nType: ${type}\nAmount: ₦${finalAmount.toLocaleString()}\nReference: ${txId}\nDate: ${new Date().toLocaleString()}\n\nThank you for choosing Kosi Bills!`,
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center;">Transaction Receipt</h2>
            <p>Hello <strong>${updatedUser.name || 'User'}</strong>,</p>
            <p>Your <strong>${type}</strong> payment was successful.</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr><td style="color: #6b7280;">Amount:</td><td style="text-align: right; font-weight: bold;">₦${finalAmount.toLocaleString()}</td></tr>
                <tr><td style="color: #6b7280;">Type:</td><td style="text-align: right;">${type}</td></tr>
                <tr><td style="color: #6b7280;">Reference:</td><td style="text-align: right; font-family: monospace;">${txId}</td></tr>
                <tr><td style="color: #6b7280;">Date:</td><td style="text-align: right;">${new Date().toLocaleString()}</td></tr>
              </table>
            </div>
            <p style="text-align: center; color: #6b7280; font-size: 14px;">Thank you for choosing Kosi Bills!</p>
          </div>
          `
        );
      }

      // Send SMS notification if phone exists
      if (updatedUser.phone) {
        sendSMS(updatedUser.phone, `Kosi Bills: ${notificationMsg}`);
      }

      // Create in-app notification
      createNotification(userId, 'Payment Successful', notificationMsg, 'success', Number(txId));

      const payResponse = { success: true, user: sanitizeUser(updatedUser), finalAmount, transactionId: `TXN-${String(txId).padStart(8, '0')}` };
      if (idempotencyKey) saveIdempotency(idempotencyKey, Number(userId), 'payment', payResponse);
      logger.info('[PAYMENT] Payment successful', { userId, type, amount: finalAmount, txId });
      res.json(payResponse);
    } catch (error: any) {

      if (error.message === 'Insufficient balance') {
        res.status(400).json({ error: 'Insufficient balance' });
      } else if (error.message === 'User not found') {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.status(500).json({ error: 'Payment failed' });
      }
    }
  });

  // Wallet Funding Endpoint using JaraPoint
  app.post('/api/wallet/fund', authenticateToken, async (req: any, res) => {
    const { userId, amount } = req.body;
    
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount < 100) {
      return res.status(400).json({ error: 'Minimum funding amount is ₦100' });
    }

    try {
      const user = db.prepare('SELECT id, name, email, phone FROM users WHERE id = ?').get(userId) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Initiate funding through JaraPoint
      const fundingResult = await jarapoint.fundWallet(
        parsedAmount,
        user.email,
        user.phone || '',
        user.name
      );

      if (fundingResult.status) {
        // For now, assume funding is successful and add to balance
        // In production, you would verify the payment callback
        const updateBalance = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
        const insertTx = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status, balance_after, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        
        const transaction = db.transaction(() => {
          updateBalance.run(parsedAmount, userId);
          const newBalance = user.balance + parsedAmount;
          insertTx.run(userId, 'Funding', 'Wallet funding via JaraPoint', parsedAmount, new Date().toISOString(), 'success', newBalance, JSON.stringify({ reference: fundingResult.reference }));
        });
        
        transaction();

        const updatedUser = db.prepare('SELECT id, name, email, phone, balance, tier FROM users WHERE id = ?').get(userId) as any;
        
        createNotification(userId, 'Wallet Funded', `Your wallet has been funded with ₦${parsedAmount.toLocaleString()}`, 'success');
        
        res.json({ 
          success: true, 
          user: sanitizeUser(updatedUser),
          reference: fundingResult.reference 
        });
      } else {
        res.status(400).json({ error: fundingResult.message || 'Funding failed' });
      }
    } catch (error: any) {
      logger.error('[WALLET] Funding error', { userId, amount: parsedAmount, error: error.message });
      res.status(500).json({ error: 'Funding failed' });
    }
  });

  // Beneficiaries Endpoints
  app.get('/api/beneficiaries/:userId', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const stmt = db.prepare('SELECT * FROM beneficiaries WHERE user_id = ?');
      const beneficiaries = stmt.all(userId);
      res.json({ success: true, beneficiaries });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch beneficiaries' });
    }
  });

  app.post('/api/beneficiaries', authenticateToken, (req: any, res) => {
    const { userId, name, phone, serviceType, provider } = req.body;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const stmt = db.prepare('INSERT INTO beneficiaries (user_id, name, phone, service_type, provider) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(userId, name, phone, serviceType, provider);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add beneficiary' });
    }
  });

  app.delete('/api/beneficiaries/:id', authenticateToken, (req: any, res) => {
    const { id } = req.params;
    try {
      // Ensure the beneficiary belongs to the authenticated user
      const beneficiary = db.prepare('SELECT user_id FROM beneficiaries WHERE id = ?').get(id) as any;
      if (!beneficiary) return res.status(404).json({ error: 'Beneficiary not found' });
      if (Number(beneficiary.user_id) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
      db.prepare('DELETE FROM beneficiaries WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete beneficiary' });
    }
  });

  // History Endpoint
  app.get('/api/transactions/:userId', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const stmt = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC');
      const transactions = stmt.all(userId);
      res.json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Rewards Endpoint
  app.get('/api/rewards', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM rewards');
      const rewards = stmt.all();
      res.json({ success: true, rewards });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rewards' });
    }
  });

  // Find a user by phone number (for transfers)
  app.get('/api/users/find', authenticateToken, (req: any, res) => {
    const phone = (req.query.phone as string || '').replace(/[\s+\-()]/g, '');
    if (!phone || phone.length < 10) return res.status(400).json({ error: 'Valid phone number required' });
    try {
      const user = db.prepare('SELECT id, name, phone, email, tier FROM users WHERE phone = ? AND account_status = ?').get(phone, 'active') as any;
      if (!user) return res.status(404).json({ error: 'No Kosi Bills user found with that phone number' });
      res.json({ success: true, user: { id: String(user.id), name: user.name, phone: user.phone, tier: user.tier || 'Basic' } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search user' });
    }
  });

  // User-to-user transfer
  app.post('/api/transfer', authenticateToken, paymentLimiter, (req: any, res) => {
    const { senderId, recipientId, amount, pin, note } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    // Prevent spoofing: senderId must match the authenticated user
    if (Number(senderId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    if (!senderId || !recipientId || !amount || !pin) return res.status(400).json({ error: 'Missing required fields' });
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0 || !isFinite(amt)) return res.status(400).json({ error: 'Amount must be a positive number' });
    if (amt < 50) return res.status(400).json({ error: 'Minimum transfer amount is ₦50' });
    if (Number(senderId) === Number(recipientId)) return res.status(400).json({ error: 'Cannot transfer to yourself' });

    // Idempotency check
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey, Number(senderId), 'transfer');
      if (cached.hit) return res.json(cached.response);
    }

    const transfer = db.transaction(() => {
      const sender = db.prepare('SELECT id, name, balance, pin, account_status, daily_transfer_limit FROM users WHERE id = ?').get(senderId) as any;
      if (!sender) throw new Error('Sender not found');
      if (sender.account_status !== 'active') throw new Error('Your account is frozen');
      if (!verifyPin(pin, sender.pin)) throw new Error('Incorrect PIN');
      if (sender.balance < amt) throw new Error('Insufficient balance');
      const limit = sender.daily_transfer_limit || 200000;
      if (amt > limit) throw new Error(`Amount exceeds daily transfer limit of ₦${limit.toLocaleString()}`);

      const recipient = db.prepare('SELECT id, name, account_status FROM users WHERE id = ?').get(recipientId) as any;
      if (!recipient) throw new Error('Recipient not found');
      if (recipient.account_status !== 'active') throw new Error('Recipient account is not active');

      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amt, senderId);
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amt, recipientId);

      const ref = 'KB-TRF-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      const now = new Date().toISOString();
      const desc = note ? `Transfer to ${recipient.name} – ${note}` : `Transfer to ${recipient.name}`;
      const descIn = note ? `Transfer from ${sender.name} – ${note}` : `Transfer from ${sender.name}`;

      db.prepare(`INSERT INTO transactions (user_id, type, amount, status, description, date, tx_ref, category, balance_after) VALUES (?, 'Transfer', ?, 'success', ?, ?, ?, 'Transfer', (SELECT balance FROM users WHERE id = ?))`).run(senderId, -amt, desc, now, ref, senderId);
      db.prepare(`INSERT INTO transactions (user_id, type, amount, status, description, date, tx_ref, category, balance_after) VALUES (?, 'Transfer', ?, 'success', ?, ?, ?, 'Transfer', (SELECT balance FROM users WHERE id = ?))`).run(recipientId, amt, descIn, now, ref + '-IN', recipientId);

      db.prepare(`INSERT INTO notifications (user_id, title, message, type, date) VALUES (?, ?, ?, 'info', ?)`).run(
        recipientId, 'Transfer Received', `You received ₦${amt.toLocaleString()} from ${sender.name}`, now
      );

      return { reference: ref, senderName: sender.name, recipientName: recipient.name };
    });

    try {
      const result = transfer() as any;
      const trfResponse = { success: true, reference: result.reference, message: 'Transfer successful' };
      if (idempotencyKey) saveIdempotency(idempotencyKey, Number(senderId), 'transfer', trfResponse);
      logger.info('[TRANSFER] Transfer successful', { senderId, recipientId, amount: amt, ref: result.reference });
      res.json(trfResponse);
    } catch (error: any) {
      logger.error('[TRANSFER] Transfer failed', { senderId, recipientId, amount: amt, error: error.message });
      if (error.message === 'Incorrect PIN') {
        const trfIp = req.ip || 'unknown';
        const trfUa = req.headers['user-agent'] || 'unknown';
        logSecurityEvent(Number(senderId), 'TRANSFER_PIN_FAILED', trfIp, trfUa, `amount: ${amt}`);
      }
      res.status(400).json({ error: error.message || 'Transfer failed' });
    }
  });

  app.post('/api/notifications/subscribe', authenticateToken, (req: any, res) => {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription required' });

    try {
      const subscriptionStr = JSON.stringify(subscription);
      // Check if subscription already exists
      const existing = db.prepare('SELECT id FROM push_subscriptions WHERE user_id = ? AND subscription = ?').get(req.user.id, subscriptionStr);
      
      if (!existing) {
        db.prepare('INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)').run(req.user.id, subscriptionStr);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  });

  // Notifications Endpoints
  app.get('/api/notifications/:userId', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        return res.json({ success: true, notifications: [] });
      }

      const stmt = db.prepare('SELECT id, title, message, date, read, type, transaction_id as transactionId FROM notifications WHERE user_id = ? ORDER BY date DESC LIMIT 50');
      const notifications = stmt.all(userId).map((n: any) => ({
        ...n,
        id: n.id.toString(),
        read: !!n.read,
        transactionId: n.transactionId?.toString()
      }));
      res.json({ success: true, notifications });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Bill Services Endpoints
  app.get('/api/bill-services/:service', authenticateToken, async (req, res) => {
    const { service } = req.params;
    
    try {
      if (service === 'Data') {
        // Fetch data plans from JaraPoint for all networks
        const networks = ['mtn', 'airtel', 'glo', '9mobile'];
        const services = [];
        
        for (const network of networks) {
          const result = await jarapoint.getDataPlans(network);
          if (result.status && result.data) {
            services.push({
              provider_id: network,
              provider_name: network.charAt(0).toUpperCase() + network.slice(1),
              packages: result.data
            });
          }
        }
        
        res.json({ success: true, services });
      } else if (service === 'Cable TV') {
        // Cable TV providers
        res.json({
          success: true,
          services: [
            {
              provider_id: 'dstv',
              provider_name: 'DSTV',
              packages: [
                { id: 'dstv-compact', name: 'Compact', price: 10500 },
                { id: 'dstv-compact-plus', name: 'Compact Plus', price: 16500 },
                { id: 'dstv-premium', name: 'Premium', price: 24500 }
              ]
            },
            {
              provider_id: 'gotv',
              provider_name: 'GOtv',
              packages: [
                { id: 'gotv-jolli', name: 'Jolli', price: 1250 },
                { id: 'gotv-jinja', name: 'Jinja', price: 1900 },
                { id: 'gotv-max', name: 'Max', price: 3600 }
              ]
            },
            {
              provider_id: 'startimes',
              provider_name: 'StarTimes',
              packages: [
                { id: 'startimes-basic', name: 'Basic', price: 1500 },
                { id: 'startimes-smart', name: 'Smart', price: 2500 }
              ]
            }
          ]
        });
      } else if (service === 'Electricity') {
        // Electricity providers
        res.json({
          success: true,
          services: [
            {
              provider_id: 'ikedc',
              provider_name: 'Ikeja Electric',
              packages: []
            },
            {
              provider_id: 'ekedc',
              provider_name: 'Eko Electric',
              packages: []
            },
            {
              provider_id: 'aedc',
              provider_name: 'Abuja Electric',
              packages: []
            },
            {
              provider_id: 'phedc',
              provider_name: 'Port Harcourt Electric',
              packages: []
            }
          ]
        });
      } else {
        res.json({ success: false, error: 'Service not found' });
      }
    } catch (error) {
      console.error('Bill services error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
  });

  app.put('/api/notifications/:userId/read', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?');
      stmt.run(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  });

  app.put('/api/notifications/:userId/read/:id', authenticateToken, (req: any, res) => {
    const { userId, id } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?');
      stmt.run(userId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.delete('/api/notifications/:userId', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notifications' });
    }
  });

  const logAdminAction = (adminId: number, action: string, targetId: number | null, details: string) => {
    try {
      db.prepare('INSERT INTO admin_logs (admin_id, action, target_id, details) VALUES (?, ?, ?, ?)').run(
        adminId,
        action,
        targetId,
        details
      );
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  // Admin Endpoints
  // Helper: Verify JWT token from cookie or Authorization header
  const verifyJwtId = (req: express.Request): number | null => {
    const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return decoded?.id ?? null;
    } catch {
      return null;
    }
  };

  // Middleware to check admin — verifies JWT and admin role (no x-admin-id header needed)
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = verifyJwtId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const admin = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(userId) as any;
    if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Forbidden' });

    (req as any).user = { id: userId };
    next();
  };

  const requireCustomerCare = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = verifyJwtId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const cc = db.prepare('SELECT id, is_customer_care, is_admin FROM users WHERE id = ?').get(userId) as any;
    if (!cc || (!cc.is_customer_care && !cc.is_admin)) return res.status(403).json({ error: 'Forbidden' });

    (req as any).user = { id: userId };
    next();
  };


  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    try {
      const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
      const totalTransactions = (db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any).count;
      const totalVolume = (db.prepare('SELECT SUM(ABS(amount)) as sum FROM transactions WHERE status = \'success\'').get() as any).sum || 0;
      const activeTickets = (db.prepare('SELECT COUNT(*) as count FROM support_tickets WHERE status = \'open\'').get() as any).count;
      const totalSystemBalance = (db.prepare('SELECT SUM(balance) as sum FROM users').get() as any).sum || 0;
      
      // Get volume by category
      const volumeByCategory = db.prepare(`
        SELECT category, SUM(ABS(amount)) as volume 
        FROM transactions 
        WHERE status = 'success' AND category IS NOT NULL 
        GROUP BY category
        ORDER BY volume DESC
      `).all();

      // Get daily transaction volume for last 14 days
      const dailyVolume = db.prepare(`
        SELECT date(date) as day, SUM(ABS(amount)) as volume 
        FROM transactions 
        WHERE status = 'success' AND date >= date('now', '-14 days')
        GROUP BY day 
        ORDER BY day ASC
      `).all();

      // Get user growth for last 14 days
      const userGrowth = db.prepare(`
        SELECT date(created_at) as day, COUNT(*) as count 
        FROM users 
        WHERE created_at >= date('now', '-14 days')
        GROUP BY day 
        ORDER BY day ASC
      `).all();

      res.json({ 
        success: true, 
        stats: { 
          totalUsers, 
          totalTransactions, 
          totalVolume, 
          activeTickets,
          totalSystemBalance,
          volumeByCategory,
          dailyVolume,
          userGrowth
        } 
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/admin/users', requireCustomerCare, (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || 'all';
    const sortBy = (req.query.sortBy as string) || 'id';
    const sortOrder = (req.query.sortOrder as string) || 'DESC';
    const offset = (page - 1) * limit;

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'name', 'email', 'accountStatus', 'createdAt', 'balance'];
    const dbFieldMap: { [key: string]: string } = {
      id: 'id',
      name: 'name',
      email: 'email',
      accountStatus: 'account_status',
      createdAt: 'created_at',
      balance: 'balance'
    };

    const sortField = allowedSortFields.includes(sortBy) ? dbFieldMap[sortBy] : 'id';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
      let query = 'SELECT id, name, email, phone, balance, tier, is_agent as isAgent, is_admin as isAdmin, is_customer_care as isCustomerCare, account_status as accountStatus, kyc_level as kycLevel, created_at as createdAt, daily_transfer_limit as dailyTransferLimit, daily_withdrawal_limit as dailyWithdrawalLimit, total_referred as totalReferred, bvn, last_login_at as lastLoginAt, two_factor_enabled as twoFactorEnabled FROM users';
      let countQuery = 'SELECT COUNT(*) as count FROM users';
      const params: any[] = [];
      const whereClauses: string[] = [];

      if (search) {
        whereClauses.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      if (role === 'agents') {
        whereClauses.push('is_agent = 1');
      } else if (role === 'customers') {
        whereClauses.push('is_agent = 0 AND is_admin = 0');
      } else if (role === 'customer_care') {
        whereClauses.push('is_customer_care = 1');
      }

      if (whereClauses.length > 0) {
        const clause = ' WHERE ' + whereClauses.join(' AND ');
        query += clause;
        countQuery += clause;
      }

      query += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
      const users = db.prepare(query).all(...params, limit, offset).map((u: any) => ({
        ...sanitizeUser(u),
        isAgent: !!u.isAgent,
        isAdmin: !!u.isAdmin,
        isCustomerCare: !!u.isCustomerCare
      }));

      const total = (db.prepare(countQuery).get(...params) as any).count;

      res.json({ 
        success: true, 
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/send-email', requireAdmin, (req: any, res) => {
    const { targetEmail, subject, message } = req.body;
    const adminId = Number(req.user.id);

    if (!targetEmail || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Escape HTML to prevent XSS from admin-supplied message content
    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    try {
      sendEmail(
        targetEmail,
        subject,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px;">
          <h2 style="color: #10b981;">Message from Kosi Bills Admin</h2>
          <div style="margin: 20px 0; border-top: 1px solid #e5e7eb; padding-top: 20px; line-height: 1.6;">
            ${safeMessage}
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
            This is an official communication from Kosi Bills.
          </p>
        </div>
        `
      );

      logAdminAction(adminId, 'Send Email', null, `Sent email to ${targetEmail} with subject: ${subject}`);
      res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
      console.error('Admin Send Email Error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  app.get('/api/admin/logs', requireAdmin, (req, res) => {
    const limit = 50;
    try {
      const logs = db.prepare(`
        SELECT l.*, u.name as admin_name 
        FROM admin_logs l 
        JOIN users u ON l.admin_id = u.id 
        ORDER BY l.created_at DESC 
        LIMIT ?
      `).all(limit);
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.post('/api/admin/users/:id/status', requireAdmin, (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'suspended'
    const adminId = req.user.id;
    
    try {
      db.prepare('UPDATE users SET account_status = ? WHERE id = ?').run(status, id);
      logAdminAction(adminId, `user_status_change_${status}`, parseInt(id), `Changed user ${id} status to ${status}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  app.post('/api/admin/users/:id/role', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = Number((req as any).user.id);
    
    try {
      let isAgent = 0;
      let isCustomerCare = 0;
      let isAdmin = 0;

      if (role === 'agent') isAgent = 1;
      if (role === 'customer_care') isCustomerCare = 1;
      if (role === 'admin') isAdmin = 1;

      db.prepare('UPDATE users SET is_agent = ?, is_customer_care = ?, is_admin = ? WHERE id = ?').run(isAgent, isCustomerCare, isAdmin, id);
      
      // Send email notification to user
      const userInfo = db.prepare('SELECT email, name FROM users WHERE id = ?').get(id) as any;
      if (userInfo && userInfo.email) {
        sendEmail(
          userInfo.email,
          'Account Role Updated',
          `Hello ${userInfo.name || 'User'},\n\nYour Kosi Bills account role has been updated to: ${role.replace('_', ' ').toUpperCase()}.\n\nPlease log in to see your new features and permissions.\n\nBest regards,\nKosi Bills Team`
        );
      }

      logAdminAction(adminId, `user_role_change_${role}`, parseInt(id), `Changed user ${id} role to ${role}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const adminId = Number((req as any).user.id);
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    try {
      const userInfo = db.prepare('SELECT email, name FROM users WHERE id = ?').get(id) as any;
      if (!userInfo) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Delete user's transactions first
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(id);
      // Delete user's notifications
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
      // Delete user's sub-wallets
      db.prepare('DELETE FROM sub_wallet_members WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM sub_wallets WHERE owner_id = ?').run(id);
      // Delete user
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      
      logAdminAction(adminId, 'user_delete', parseInt(id), `Deleted user ${userInfo.email} (${userInfo.name})`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.post('/api/admin/users', requireAdmin, (req, res) => {
    const { name, email, phone, password, isAgent } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, phone, password, is_agent) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(name, email, phone, hashPassword(password), isAgent ? 1 : 0);
      res.json({ success: true, userId: info.lastInsertRowid });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  });

  app.put('/api/admin/users/:id/role', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { isAgent } = req.body;
    try {
      const stmt = db.prepare('UPDATE users SET is_agent = ? WHERE id = ?');
      stmt.run(isAgent ? 1 : 0, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.post('/api/admin/users/:id/fund', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { amount, type, description } = req.body;
    const adminId = Number((req as any).user.id);
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!['credit', 'debit'].includes(type)) return res.status(400).json({ error: 'Invalid transaction type' });

    try {
      db.transaction(() => {
        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(id) as any;
        if (!user) throw new Error('User not found');

        const newBalance = type === 'credit' ? user.balance + amount : user.balance - amount;
        
        if (type === 'debit' && newBalance < 0) {
          throw new Error('Insufficient balance for debit');
        }

        db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, id);

        const txRef = `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        db.prepare(`
          INSERT INTO transactions (user_id, type, description, amount, date, status, tx_ref, category, balance_after)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          'manual_funding',
          description || `Manual ${type} by Admin`,
          type === 'credit' ? amount : -amount,
          new Date().toISOString(),
          'success',
          txRef,
          'Funding',
          newBalance
        );

        logAdminAction(adminId, `manual_${type}`, parseInt(id), `Manual ${type} of ₦${amount} to user ${id}. Reason: ${description}`);
      })();

      res.json({ success: true, message: `Successfully ${type}ed user wallet` });
    } catch (error: any) {
      console.error('Funding error:', error);
      res.status(400).json({ error: error.message || 'Failed to fund user' });
    }
  });

  app.post('/api/customer-care/users/:id/reset-password', requireCustomerCare, (req, res) => {
    const { id } = req.params;
    try {
      // Generate a secure random temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const stmt = db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
      stmt.run(hashPassword(tempPassword), id);

      const targetUser = db.prepare('SELECT email, name FROM users WHERE id = ?').get(id) as any;

      // Notify user via in-app notification (without revealing the password)
      createNotification(Number(id), 'Password Reset by Support', 'Your account password has been reset by our support team. Please check your email for the temporary password and update it immediately.', 'warning');

      // Send temporary password via email only
      if (targetUser && targetUser.email) {
        sendEmail(
          targetUser.email,
          'Your Kosi Bills Password Has Been Reset',
          `Hello ${targetUser.name || 'User'},\n\nA customer care representative has reset your password.\n\nYour temporary password is: ${tempPassword}\n\nPlease log in immediately and change your password in Settings → Security.\n\nIf you did not request this, contact support immediately.\n\nBest regards,\nKosi Bills Support Team`
        );
      }

      res.json({ success: true, message: 'Password reset. Temporary password sent via email.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Admin: Generate VAPID Keys (Helper for setup)
  app.get('/api/admin/generate-vapid', requireAdmin, (req, res) => {
    try {
      const keys = webpush.generateVAPIDKeys();
      res.json({
        success: true,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        message: 'Add these to your environment variables in Settings'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate keys' });
    }
  });

  // Admin: Get all transactions
  app.get('/api/admin/transactions', requireCustomerCare, (req: any, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const type = (req.query.type as string) || 'all';
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortOrder = (req.query.sortOrder as string) || 'DESC';
    const offset = (page - 1) * limit;

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['date', 'amount', 'type', 'status', 'userName'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
      let query = `
        SELECT t.*, u.name as userName, u.email as userEmail 
        FROM transactions t 
        JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      let countQuery = `
        SELECT COUNT(*) as count 
        FROM transactions t 
        JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (search) {
        const searchClause = ' AND (u.name LIKE ? OR u.email LIKE ? OR t.description LIKE ? OR t.tx_ref LIKE ?)';
        query += searchClause;
        countQuery += searchClause;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      if (status !== 'all') {
        query += ' AND t.status = ?';
        countQuery += ' AND t.status = ?';
        params.push(status);
      }

      if (type !== 'all') {
        query += ' AND t.type = ?';
        countQuery += ' AND t.type = ?';
        params.push(type);
      }

      query += ` ORDER BY ${finalSortBy === 'userName' ? 'u.name' : 't.' + finalSortBy} ${finalSortOrder} LIMIT ? OFFSET ?`;
      const transactions = db.prepare(query).all(...params, limit, offset);
      const total = (db.prepare(countQuery).get(...params) as any).count;

      res.json({ 
        success: true, 
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Admin: Toggle Customer Care role
  app.put('/api/admin/users/:id/customer-care', requireAdmin, (req: any, res) => {
    const { id } = req.params;
    const { isCustomerCare } = req.body;

    try {
      db.prepare('UPDATE users SET is_customer_care = ? WHERE id = ?').run(isCustomerCare ? 1 : 0, id);
      res.json({ success: true, message: 'User role updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // Support Tickets
  app.post('/api/support/tickets', authenticateToken, (req, res) => {
    const { userId, subject, initialMessage } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO support_tickets (user_id, subject, created_at, updated_at) VALUES (?, ?, ?, ?)');
      const now = new Date().toISOString();
      const info = stmt.run(userId, subject, now, now);
      const ticketId = info.lastInsertRowid;

      const msgStmt = db.prepare('INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, created_at) VALUES (?, ?, ?, ?, ?)');
      msgStmt.run(ticketId, userId, 'user', initialMessage, now);

      // Send confirmation email to user
      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as any;
      if (user && user.email) {
        sendEmail(
          user.email,
          `Support Ticket Created: ${subject}`,
          `Hello ${user.name || 'User'},\n\nYour support ticket "${subject}" has been successfully created. Our team will review it and get back to you shortly.\n\nTicket ID: #${ticketId}\n\nBest regards,\nKosi Bills Support Team`
        );
      }

      res.json({ success: true, ticketId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  const KOSI_SYSTEM_PROMPT = `You are Kosi, the intelligent AI assistant for Kosi Bills — Nigeria's trusted bill payment and fintech platform. You have deep, comprehensive knowledge of every feature, workflow, and policy in the Kosi Bills system.

## PLATFORM OVERVIEW
Kosi Bills is a Nigerian fintech app that lets users pay all their bills from one place: airtime, data, electricity, cable TV (DSTV/GOtv/Startimes), internet, education fees, betting wallet funding, and other utilities. Users also manage a digital wallet, send money to other users, earn loyalty rewards, and get customer support — all in one app.

## CORE FEATURES YOU KNOW DEEPLY

### Wallet & Funding
- Users have a main NGN wallet with a real-time balance visible on the dashboard.
- To fund: go to Dashboard → tap the wallet card → "Add Funds" → choose bank transfer or card.
- Each user gets a unique virtual account number for instant bank transfers.
- Sub-wallets: users can create multiple sub-wallets (e.g., Family, Business, Savings) to organize spending. Each sub-wallet can have a spending limit. Found in the Wallet section.
- Balance can be hidden/shown by toggling the eye icon on the wallet card.

### Bill Payments
- **Airtime**: Buy airtime for MTN, Airtel, Glo, 9mobile for self or any number. Instant delivery.
- **Data**: Buy data bundles for any network. Choose plan, enter number, confirm with PIN.
- **Electricity**: Pay prepaid or postpaid bills. Supported DISCOs: IKEDC, EKEDC, AEDC, PHED, IBEDC, BEDC, KEDCO, JEDC, KAEDCO, YEDC, EEDC. Enter meter number, verify customer details, select amount.
- **Cable TV**: Pay DSTV, GOtv, Startimes subscriptions. Enter smart card/decoder number, choose package, confirm.
- **Internet**: Pay for ISP subscriptions — Smile, Spectranet, Swift, ipNX, and more.
- **Education**: Pay WAEC, JAMB, NECO result checker PINs and other educational bills.
- **Betting**: Fund betting wallets for Bet9ja, Sportybet, 1xBet, Betway, Nairabet, etc.
- **Other Utilities**: Water bills, waste management, and other local utility payments.
- All payments require the user's 4-digit transaction PIN for confirmation.
- Agents get a 2% automatic discount on every payment.

### Transfers
- Send money to other Kosi Bills users instantly using their email or phone number.
- Minimum transfer: ₦50. Daily transfer limit defaults to ₦50,000 (adjustable by admin).
- Requires transaction PIN. Sends notification to both sender and recipient.

### Transaction History
- Full history in the "History" tab. Filter by date, type, and status (success/failed/pending).
- Each transaction has a unique reference ID and shows balance after transaction.
- Failed transactions can be retried directly from history.

### Rewards & Tiers
- Tiers: Basic → Silver → Gold → Premium (Diamond coming soon).
- Earn reward points on every transaction. More activity = higher tier.
- Higher tiers unlock: lower fees, priority support, higher limits, exclusive offers.
- View current tier and points in the "Rewards" section.

### Security Features
- **Transaction PIN**: 4-digit PIN required for all payments and transfers. Set during onboarding, changeable in Settings. Stored securely encrypted.
- **Biometric auth**: Enable fingerprint/face unlock in Settings for faster login.
- **Two-Factor Authentication (2FA)**: Optional email-based 2FA for login (requires email to be configured).
- **Live Mode vs Test Mode**: Toggle in Settings. Test mode lets you simulate transactions without real money. Live mode uses real funds.
- **Account freeze**: Admin can freeze/unfreeze accounts for security.

### Account Settings
- Update profile (name, phone, profile photo).
- Change password and transaction PIN.
- Enable/disable email receipts for transactions.
- Hide balance toggle.
- KYC (Know Your Customer) verification levels: Level 1 (basic), higher levels unlock more features and higher limits.
- BVN linking for higher KYC levels.
- Referral system: each user has a unique referral code. Share to earn rewards when new users sign up.

### Account Types & Roles
- **Customer**: Standard user. Access to all payment features.
- **Agent**: Upgraded account with 2% discount on all transactions. Apply via Settings.
- **Customer Care**: Can access the customer care dashboard, view and respond to support tickets.
- **Admin**: Full platform access including admin dashboard, user management, transaction management, broadcast, system settings.

### Admin Dashboard (for admins only)
- Overview: stats on total users, system balance, transaction volume, open support tickets.
- Charts showing 14-day transaction volume and user distribution.
- Customers tab: view, search, sort all customers. Freeze/unfreeze accounts, adjust balances, promote to agent/admin/customer care.
- Agents tab: view all agent accounts.
- Transactions tab: view all platform transactions with filters (status, type, date).
- Tickets tab: manage all support tickets, reply to users, close tickets.
- Broadcast: send push notifications to all users or specific groups.
- Email: send direct email to any user.
- Logs: view admin action audit log.
- Settings: configure platform settings (transfer fee, min withdrawal, maintenance mode, VAPID keys for push notifications).

### Support
- Live chat support available via "Support" in the app.
- Users can type a message to get instant AI help (that's me, Kosi!).
- Say "human", "agent", or "customer care" to escalate to a live agent — a ticket is created.
- Support tickets are tracked and responded to by the customer care team.

## HOW TO RESPOND
- Be warm, professional, and helpful. You are Nigerian-aware and understand the context (NGN currency, Nigerian banks, DISCOs, networks, etc.).
- Give specific, actionable step-by-step answers when explaining how to do something.
- If asked about system internals (database, code, architecture), explain at a high level without exposing sensitive technical details.
- If the user seems frustrated or has a payment issue, empathize and guide them to support or retry options.
- Always stay in character as Kosi, the Kosi Bills AI assistant.
- Keep responses concise but complete. Use bullet points or numbered steps when helpful.
- If you don't know something specific, say so honestly and suggest they contact support.`;

  app.post('/api/support/ai-chat', authenticateToken, async (req, res) => {
    const { message, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
      if (apiKey) {
        // Use Gemini AI with full system knowledge
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        
        const systemContext = context === 'admin' 
          ? KOSI_SYSTEM_PROMPT + '\n\nCURRENT CONTEXT: You are assisting an admin user in the Admin Dashboard. They may ask about managing users, transactions, platform settings, or interpreting platform data.'
          : KOSI_SYSTEM_PROMPT;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: message,
          config: {
            systemInstruction: systemContext,
            maxOutputTokens: 600,
            temperature: 0.7,
          }
        });

        const text = response.text || generateLocalResponse(message);
        return res.json({ success: true, text });
      } else {
        // Fallback: rich local responses
        await new Promise(resolve => setTimeout(resolve, 600));
        const text = generateLocalResponse(message);
        return res.json({ success: true, text });
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      // Always fall back to local responses
      const text = generateLocalResponse(message);
      res.json({ success: true, text });
    }
  });

  function generateLocalResponse(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('good morning') || msg.includes('good afternoon') || msg.includes('good evening')) {
      return "Hello! I'm Kosi, your Kosi Bills financial assistant. I can help you with wallet funding, airtime, data, electricity, cable TV, internet, betting, education bills, transfers, rewards, and account settings. What can I help you with today?";
    }

    if (msg.includes('fund') || msg.includes('add money') || msg.includes('deposit') || msg.includes('top up') || msg.includes('topup')) {
      return "To fund your wallet:\n1. Go to your Dashboard\n2. Tap the wallet card and select 'Add Funds'\n3. Choose Bank Transfer (recommended — instant credit) or Card\n4. Use your unique Kosi Bills virtual account number for transfers.\n\nYour balance updates automatically once payment is confirmed.";
    }

    if (msg.includes('airtime')) {
      return "To buy airtime:\n1. Tap 'Bills' → 'Airtime'\n2. Select your network (MTN, Airtel, Glo, 9mobile)\n3. Enter the phone number and amount\n4. Confirm with your 4-digit transaction PIN\n\nAirtime is delivered instantly. Agents get a 2% discount automatically.";
    }

    if (msg.includes('data') && !msg.includes('my data') && !msg.includes('your data')) {
      return "To buy data:\n1. Tap 'Bills' → 'Data'\n2. Choose your network\n3. Select a data bundle plan\n4. Enter the phone number\n5. Confirm with your transaction PIN\n\nData is activated within seconds.";
    }

    if (msg.includes('electricity') || msg.includes('nepa') || msg.includes('phcn') || msg.includes('ikedc') || msg.includes('ekedc') || msg.includes('meter') || msg.includes('power') || msg.includes('disco')) {
      return "To pay your electricity bill:\n1. Tap 'Bills' → 'Electricity'\n2. Select your DISCO (IKEDC, EKEDC, AEDC, PHED, etc.)\n3. Choose Prepaid or Postpaid\n4. Enter your meter number\n5. Verify the customer name shown\n6. Enter amount and confirm with your PIN\n\nPrepaid tokens are shown immediately after payment.";
    }

    if (msg.includes('cable') || msg.includes('dstv') || msg.includes('gotv') || msg.includes('startimes') || msg.includes('tv') || msg.includes('decoder')) {
      return "To pay your cable TV subscription:\n1. Tap 'Bills' → 'Cable TV'\n2. Select DSTV, GOtv, or Startimes\n3. Enter your smart card / decoder number\n4. Choose your subscription package\n5. Confirm with your transaction PIN\n\nYour subscription is renewed instantly.";
    }

    if (msg.includes('internet') || msg.includes('smile') || msg.includes('spectranet') || msg.includes('swift') || msg.includes('ipnx')) {
      return "To pay your internet bill:\n1. Tap 'Bills' → 'Internet'\n2. Select your ISP (Smile, Spectranet, Swift, ipNX, etc.)\n3. Enter your account/customer ID\n4. Choose a plan and confirm with your PIN\n\nYour subscription renews immediately.";
    }

    if (msg.includes('education') || msg.includes('waec') || msg.includes('jamb') || msg.includes('neco') || msg.includes('result')) {
      return "To pay education fees:\n1. Tap 'Bills' → 'Education'\n2. Select the service (WAEC, JAMB, NECO, etc.)\n3. Enter the required details\n4. Confirm with your transaction PIN\n\nYour scratch card PIN or result checker is delivered instantly.";
    }

    if (msg.includes('betting') || msg.includes('bet9ja') || msg.includes('sportybet') || msg.includes('betway') || msg.includes('1xbet') || msg.includes('bet')) {
      return "To fund your betting wallet:\n1. Tap 'Bills' → 'Betting'\n2. Select your platform (Bet9ja, Sportybet, 1xBet, Betway, Nairabet, etc.)\n3. Enter your betting account ID\n4. Enter the amount and confirm with your PIN\n\nFunds reflect in your betting account within seconds.";
    }

    if (msg.includes('transfer') || msg.includes('send money') || msg.includes('send fund')) {
      return "To send money to another Kosi Bills user:\n1. Tap the 'Transfer' icon on the dashboard\n2. Enter the recipient's email or phone number\n3. Enter the amount (minimum ₦50)\n4. Add a note (optional)\n5. Confirm with your 4-digit PIN\n\nTransfers are instant. Daily limit is ₦50,000 by default.";
    }

    if (msg.includes('sub-wallet') || msg.includes('sub wallet') || msg.includes('family') || msg.includes('business wallet')) {
      return "Sub-wallets help you organize spending:\n1. Go to Dashboard → Wallet section\n2. Tap 'Sub-Wallets' → 'Create'\n3. Name it (e.g., Family, Business, Savings)\n4. Set an optional spending limit\n\nYou can fund sub-wallets from your main balance and track expenses separately.";
    }

    if (msg.includes('rewards') || msg.includes('tier') || msg.includes('points') || msg.includes('silver') || msg.includes('gold') || msg.includes('premium') || msg.includes('basic')) {
      return "Kosi Bills rewards your loyalty:\n\n• **Basic**: Starting tier for all new users\n• **Silver**: Unlocked after consistent activity\n• **Gold**: More benefits, lower fees\n• **Premium**: Highest tier, priority support, best rates\n\nEarn points on every transaction. Check your tier and points in the 'Rewards' tab.";
    }

    if (msg.includes('pin') || msg.includes('transaction pin') || msg.includes('forgot pin') || msg.includes('change pin') || msg.includes('reset pin')) {
      return "Your transaction PIN is a 4-digit code required for all payments and transfers.\n\n• **Change PIN**: Go to Settings → Security → Change Transaction PIN\n• **Forgot PIN**: Contact support — after identity verification, an admin can reset it\n• **PIN not set**: Set it in Settings → Security\n\nYour PIN is stored securely encrypted for your protection.";
    }

    if (msg.includes('agent') || msg.includes('upgrade') || msg.includes('discount') || msg.includes('2%')) {
      return "Agent accounts get a 2% discount on every transaction automatically!\n\nTo become an agent:\n1. Go to Settings\n2. Tap 'Account Type'\n3. Apply for Agent status\n\nAgents are ideal for business owners or anyone who processes many transactions. The 2% savings add up quickly.";
    }

    if (msg.includes('history') || msg.includes('transaction') || msg.includes('receipt') || msg.includes('past payment')) {
      return "To view your transaction history:\n1. Tap the 'History' tab\n2. Use filters to find specific transactions by type, date, or status\n3. Tap any transaction for full details and receipt\n\nFailed transactions can be retried directly from the history screen. Each transaction has a unique reference ID.";
    }

    if (msg.includes('kyc') || msg.includes('verification') || msg.includes('verify') || msg.includes('bvn') || msg.includes('identity')) {
      return "KYC (Know Your Customer) verification unlocks higher limits and features:\n\n• **Level 1**: Basic — automatic on signup\n• **Higher Levels**: Require BVN linking and document verification\n\nGo to Settings → Verification to check your KYC level and see what's needed to upgrade. Higher KYC levels allow larger transactions.";
    }

    if (msg.includes('security') || msg.includes('safe') || msg.includes('biometric') || msg.includes('fingerprint') || msg.includes('2fa') || msg.includes('two factor')) {
      return "Kosi Bills takes security seriously:\n\n• **Transaction PIN**: Required for every payment/transfer\n• **Biometric login**: Enable fingerprint/face ID in Settings → Security\n• **2FA**: Optional two-factor authentication via email for login\n• **Account freeze**: Report any suspicious activity to support immediately\n\nNever share your PIN with anyone, including support staff.";
    }

    if (msg.includes('balance') || msg.includes('how much') || msg.includes('check balance')) {
      return "Your balance is displayed on the main Dashboard in the wallet card at the top. Tap the eye icon to show or hide your balance.\n\nFor sub-wallet balances, scroll down on the Dashboard or go to the Wallet section.";
    }

    if (msg.includes('live mode') || msg.includes('test mode') || msg.includes('demo')) {
      return "Kosi Bills has two modes:\n\n• **Test Mode**: Simulate transactions without using real money. Great for testing.\n• **Live Mode**: Real transactions with actual funds.\n\nToggle between modes in Settings. A red 'Live' badge appears in the header when you're in Live Mode. Always confirm you're in the right mode before making payments.";
    }

    if (msg.includes('support') || msg.includes('help') || msg.includes('problem') || msg.includes('issue') || msg.includes('complaint')) {
      return "I'm here to help! For common issues:\n\n• **Payment failed**: Check your balance and try again from History\n• **Wrong amount charged**: Contact support immediately with your transaction reference\n• **Account issues**: Support can assist with account-related problems\n\nTo speak to a human agent, type 'human agent' or 'customer care' and I'll create a support ticket for you.";
    }

    if (msg.includes('referral') || msg.includes('refer') || msg.includes('invite')) {
      return "Share your unique referral code with friends and earn rewards!\n\nYour referral code is in Settings → Referral or on your profile. When someone signs up using your code, you both earn bonus points. Track how many people you've referred in your profile.";
    }

    if (msg.includes('admin') || msg.includes('dashboard') || msg.includes('manage user') || msg.includes('platform')) {
      return "The Admin Dashboard gives full control of the Kosi Bills platform:\n\n• **Overview**: Live stats — users, volume, balances, tickets\n• **Customers/Agents**: View, search, freeze accounts, adjust balances\n• **Transactions**: Filter and view all platform transactions\n• **Tickets**: Respond to user support tickets\n• **Broadcast**: Send push notifications to users\n• **Settings**: Configure fees, limits, and platform settings\n\nOnly admin accounts can access this area.";
    }

    if (msg.includes('human') || msg.includes('real person') || msg.includes('live agent') || msg.includes('customer care')) {
      return "To connect with a human agent, please say 'I need a human agent' clearly in your next message. I'll create a support ticket and a customer care representative will respond as soon as possible during working hours.";
    }

    return "I'm Kosi, your Kosi Bills AI assistant. I can help with:\n\n• 💳 Wallet funding & transfers\n• ⚡ Electricity, cable TV, internet bills\n• 📱 Airtime & data\n• 🎓 Education & betting payments\n• 🏆 Rewards & account tiers\n• 🔐 Security & PIN management\n• 👥 Account settings & KYC\n\nWhat would you like help with today?";
  }

  app.get('/api/support/tickets', requireCustomerCare, (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT t.*, u.name as userName, u.email as userEmail 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id 
        ORDER BY t.updated_at DESC
      `);
      const tickets = stmt.all();
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/support/tickets/:id/messages', requireCustomerCare, (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare('SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC');
      const messages = stmt.all(id);
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/support/tickets/:id/messages', requireCustomerCare, (req, res) => {
    const { id } = req.params;
    const { senderId, message } = req.body;
    try {
      const now = new Date().toISOString();
      const stmt = db.prepare('INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, created_at) VALUES (?, ?, ?, ?, ?)');
      stmt.run(id, senderId, 'agent', message, now);
      
      const updateStmt = db.prepare('UPDATE support_tickets SET updated_at = ? WHERE id = ?');
      updateStmt.run(now, id);
      
      // Send email notification to user
      const ticketInfo = db.prepare(`
        SELECT t.subject, u.email, u.name 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.id = ?
      `).get(id) as any;

      if (ticketInfo && ticketInfo.email) {
        sendEmail(
          ticketInfo.email,
          `Support Ticket Update: ${ticketInfo.subject}`,
          `Hello ${ticketInfo.name || 'User'},\n\nYou have a new message on your support ticket: "${ticketInfo.subject}".\n\nMessage: ${message}\n\nPlease log in to your dashboard to view and reply.\n\nBest regards,\nKosi Bills Support Team`
        );
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Admin Settings
  app.get('/api/admin/settings', requireAdmin, (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM system_settings').all();
      const settingsObj = settings.reduce((acc: Record<string, string>, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);
      
      // Default values if not set
      if (!settingsObj.transfer_fee) settingsObj.transfer_fee = '10';
      if (!settingsObj.min_withdrawal) settingsObj.min_withdrawal = '1000';
      if (!settingsObj.maintenance_mode) settingsObj.maintenance_mode = 'false';
      
      res.json({ success: true, settings: settingsObj });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Test Email Route
  app.post('/api/test/email', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await sendEmail(
      email,
      'Kosi Bills: Test Email',
      'This is a test email to verify your SMTP configuration. If you received this, your email notifications are working correctly!',
      '<h1>Kosi Bills Test</h1><p>This is a test email to verify your SMTP configuration. If you received this, your email notifications are working correctly!</p>'
    );

    if (result.success) {
      res.json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  });

  app.post('/api/admin/settings', requireAdmin, (req, res) => {
    const { settings } = req.body;
    const adminId = Number((req as any).user.id);
    try {
      db.transaction(() => {
        const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
        for (const [key, value] of Object.entries(settings)) {
          stmt.run(key, String(value));
        }
        logAdminAction(adminId, 'update_settings', 0, `Updated system settings: ${Object.keys(settings).join(', ')}`);
      })();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.delete('/api/admin/settings/:key', requireAdmin, (req, res) => {
    const { key } = req.params;
    const adminId = Number((req as any).user.id);
    try {
      db.prepare('DELETE FROM system_settings WHERE key = ?').run(key);
      logAdminAction(adminId, 'delete_setting', 0, `Deleted system setting: ${key}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  });

  // Admin Broadcast
  app.post('/api/admin/broadcast', requireAdmin, (req, res) => {
    const { title, message, target } = req.body;
    const adminId = Number((req as any).user.id);
    
    if (!title || !message) return res.status(400).json({ error: 'Title and message required' });

    try {
      let query = 'INSERT INTO notifications (user_id, title, message, date, type) SELECT id, ?, ?, ?, ? FROM users';
      const now = new Date().toISOString();
      const type = 'system';
      
      if (target === 'agents') {
        query += ' WHERE is_agent = 1';
      } else if (target === 'customers') {
        query += ' WHERE is_agent = 0 AND is_admin = 0 AND is_customer_care = 0';
      }

      const info = db.prepare(query).run(title, message, now, type);
      
      // Send push notifications to target audience
      let pushQuery = 'SELECT id FROM users';
      if (target === 'agents') {
        pushQuery += ' WHERE is_agent = 1';
      } else if (target === 'customers') {
        pushQuery += ' WHERE is_agent = 0 AND is_admin = 0 AND is_customer_care = 0';
      }
      
      const targetUsers = db.prepare(pushQuery).all() as { id: number }[];
      targetUsers.forEach(u => {
        sendPushNotification(u.id, title, message);
      });

      logAdminAction(adminId, 'broadcast_message', 0, `Sent broadcast to ${target}: ${title}`);
      
      res.json({ success: true, count: info.changes, message: `Broadcast sent to ${info.changes} users` });
    } catch (error) {
      console.error('Broadcast error:', error);
      res.status(500).json({ error: 'Failed to send broadcast' });
    }
  });

  // Flutterwave Payment Verification
  app.post('/api/payments/verify', authenticateToken, async (req: any, res) => {
    const { transaction_id, tx_ref, userId } = req.body;

    // Prevent spoofing: userId in body must match the authenticated user
    if (Number(userId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden: userId mismatch' });
    }
    
    if (!process.env.FLW_SECRET_KEY) {
      return res.status(500).json({ error: 'Flutterwave payment gateway not configured' });
    }

    try {
      // Check if transaction already processed
      const checkTx = db.prepare('SELECT id FROM transactions WHERE tx_ref = ? AND status = \'success\'').get(tx_ref);
      if (checkTx) {
        return res.json({ success: true, message: 'Transaction already processed' });
      }

      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success' && data.data.status === 'successful') {
        const amount = data.data.amount;
        const currency = data.data.currency;

        if (currency !== 'NGN') {
          return res.status(400).json({ error: 'Invalid currency' });
        }

        // Update user balance and record transaction
        const updateBalance = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
        const insertTx = db.prepare('INSERT INTO transactions (user_id, type, description, amount, date, status, tx_ref, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

        const transaction = db.transaction(() => {
          updateBalance.run(amount, userId);
          const newBalance = (db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any).balance;
          insertTx.run(userId, 'Wallet Fund', `Flutterwave Deposit - ${tx_ref}`, amount, new Date().toISOString(), 'success', tx_ref, newBalance);
        });

        transaction();

        const updatedUser = db.prepare('SELECT id, name, email, balance, hide_balance as hideBalance, daily_transfer_limit as dailyTransferLimit, daily_withdrawal_limit as dailyWithdrawalLimit, total_referred as totalReferred, bvn, last_login_at as lastLoginAt, two_factor_enabled as twoFactorEnabled FROM users WHERE id = ?').get(userId) as any;
        updatedUser.hideBalance = !!updatedUser.hideBalance;
        res.json({ success: true, user: sanitizeUser(updatedUser) });

        // Send Email notification
        sendTransactionEmail(userId, 'Wallet Funded', `Your wallet has been successfully funded with ₦${amount.toLocaleString()} via Flutterwave. Ref: ${tx_ref}`);
      } else {
        res.status(400).json({ error: 'Payment verification failed' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ error: 'Internal server error during verification' });
    }
  });

  // Agent: Get stats
  app.get('/api/agent/stats/:userId', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const txRows = db.prepare(`SELECT type, amount, status, date FROM transactions WHERE user_id = ?`).all(userId) as any[];
      const totalTx = txRows.length;
      const successTx = txRows.filter((t: any) => t.status === 'success').length;
      const totalCommission = txRows.filter((t: any) => t.type === 'Commission' && t.status === 'success').reduce((s: number, t: any) => s + t.amount, 0);
      const now = new Date();
      const thisMonthCommission = txRows.filter((t: any) => {
        const d = new Date(t.date);
        return t.type === 'Commission' && t.status === 'success' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((s: number, t: any) => s + t.amount, 0);
      res.json({ success: true, stats: { totalTx, successTx, totalCommission, thisMonthCommission, successRate: totalTx > 0 ? Math.round((successTx / totalTx) * 100) : 0 } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agent stats' });
    }
  });

  // Agent: Get referrals
  app.get('/api/agent/referrals/:userId', authenticateToken, (req: any, res) => {
    const { userId } = req.params;
    if (Number(userId) !== Number(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    try {
      const agent = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(userId) as any;
      if (!agent) return res.status(404).json({ error: 'Agent not found' });
      const referrals = db.prepare(`SELECT id, name, email, phone, balance, tier, account_status as accountStatus, created_at as createdAt FROM users WHERE referred_by = ? ORDER BY created_at DESC`).all(userId) as any[];
      res.json({ success: true, referrals });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  });

  // Customer Care: Freeze/Unfreeze user
  app.post('/api/customer-care/users/:id/freeze', requireCustomerCare, (req, res) => {
    const { id } = req.params;
    const { freeze } = req.body;
    try {
      const newStatus = freeze ? 'frozen' : 'active';
      db.prepare('UPDATE users SET account_status = ? WHERE id = ?').run(newStatus, id);
      const targetUser = db.prepare('SELECT name FROM users WHERE id = ?').get(id) as any;
      createNotification(Number(id), freeze ? 'Account Frozen' : 'Account Restored', freeze ? 'Your account has been temporarily frozen by our support team. Please contact support.' : 'Your account has been restored. You can now use all services.', freeze ? 'warning' : 'success');
      res.json({ success: true, message: `Account ${freeze ? 'frozen' : 'unfrozen'} successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update account status' });
    }
  });

  // Support: Update ticket status (for CC and admin)
  app.patch('/api/support/tickets/:id/status', requireCustomerCare, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
      db.prepare(`UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?`).run(status, new Date().toISOString(), id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update ticket status' });
    }
  });

  // Analytics API endpoints
  app.get('/api/analytics/overview', requireAdmin, (req, res) => {
    try {
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE account_status = 'active'").get() as any;
      const totalRevenue = db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = ? AND status = ?').get('Wallet Fund', 'success') as any;
      const todayRevenue = db.prepare('SELECT SUM(amount) as total FROM transactions WHERE type = ? AND status = ? AND date >= ?').get('Wallet Fund', 'success', new Date().toISOString().split('T')[0]) as any;
      const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any;
      const todayTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE date >= ?').get(new Date().toISOString().split('T')[0]) as any;

      res.json({
        success: true,
        data: {
          totalUsers: totalUsers.count,
          activeUsers: activeUsers.count,
          totalRevenue: totalRevenue.total || 0,
          todayRevenue: todayRevenue.total || 0,
          totalTransactions: totalTransactions.count,
          todayTransactions: todayTransactions.count
        }
      });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch overview', { error });
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  app.get('/api/analytics/revenue-trend', requireAdmin, (req, res) => {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const revenueData = db.prepare(`
        SELECT DATE(date) as date, SUM(amount) as revenue
        FROM transactions
        WHERE type = ? AND status = ? AND date >= ?
        GROUP BY DATE(date)
        ORDER BY date ASC
      `).all('Wallet Fund', 'success', startDate.toISOString()) as any[];

      res.json({ success: true, data: revenueData });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch revenue trend', { error });
      res.status(500).json({ error: 'Failed to fetch revenue trend' });
    }
  });

  app.get('/api/analytics/user-growth', requireAdmin, (req, res) => {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const userGrowth = db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as users
        FROM users
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).all(startDate.toISOString()) as any[];

      res.json({ success: true, data: userGrowth });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch user growth', { error });
      res.status(500).json({ error: 'Failed to fetch user growth' });
    }
  });

  app.get('/api/analytics/transaction-breakdown', requireAdmin, (req, res) => {
    try {
      const breakdown = db.prepare(`
        SELECT type, category, COUNT(*) as count, SUM(amount) as total
        FROM transactions
        WHERE status = ?
        GROUP BY type, category
        ORDER BY total DESC
      `).all('success') as any[];

      res.json({ success: true, data: breakdown });
    } catch (error) {
      logger.error('[ANALYTICS] Failed to fetch transaction breakdown', { error });
      res.status(500).json({ error: 'Failed to fetch transaction breakdown' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  // CSRF Error Handler — must come before the global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      logger.warn('[CSRF] Invalid or missing CSRF token', { path: req.path, ip: req.ip });
      return res.status(403).json({ error: 'Invalid or missing CSRF token. Please refresh and try again.' });
    }
    next(err);
  });

  // Global Error Handler Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
  });

  // ─── Email Scheduler System ─────────────────────────────────────────────────────
function startEmailScheduler() {
  // Run every day at 9 AM
  const checkDaily = () => {
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpConfigured) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Check for birthdays
    try {
      const birthdayUsers = db.prepare('SELECT id, name, email FROM users WHERE birthday IS NOT NULL').all() as any[];
      birthdayUsers.forEach(user => {
        if (user.birthday) {
          const userDate = new Date(user.birthday);
          if (userDate.getMonth() + 1 === month && userDate.getDate() === day) {
            sendEmail(
              user.email,
              'Happy Birthday from Kosi Bills! 🎂',
              `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2>Happy Birthday, ${user.name}! 🎉🎂</h2>
                <p>Wishing you a fantastic birthday filled with joy and prosperity!</p>
                <p>As a special gift, here's a 5% bonus on your next wallet funding.</p>
                <p>Use code: <strong>BIRTHDAY${today.getFullYear()}</strong></p>
                <p>Best regards,<br>Kosi Bills Team</p>
              </div>
              `
            ).catch(err => logger.error('[EMAIL] Failed to send birthday email', { error: err, email: user.email }));
          }
        }
      });
    } catch (error) {
      logger.error('[EMAIL] Failed to check birthdays', { error });
    }

    // Check for holidays (Christmas, Easter)
    // Christmas: December 25
    if (month === 12 && day === 25) {
      try {
        const allUsers = db.prepare('SELECT id, name, email FROM users WHERE account_status = ?').all('active') as any[];
        allUsers.forEach(user => {
          sendEmail(
            user.email,
            'Merry Christmas from Kosi Bills! 🎄🎁',
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2>Merry Christmas, ${user.name}! 🎄🎁</h2>
              <p>Wishing you and your family a wonderful Christmas filled with love and happiness.</p>
              <p>Special offer: Get 10% bonus on all bill payments today!</p>
              <p>Best regards,<br>Kosi Bills Team</p>
            </div>
            `
          ).catch(err => logger.error('[EMAIL] Failed to send Christmas email', { error: err, email: user.email }));
        });
      } catch (error) {
        logger.error('[EMAIL] Failed to send Christmas emails', { error });
      }
    }

    // Easter (simplified - check for Easter Sunday dates)
    // 2025: April 20, 2026: April 5, 2027: March 28
    const easterDates = {
      2025: { month: 4, day: 20 },
      2026: { month: 4, day: 5 },
      2027: { month: 3, day: 28 },
    };
    const currentEaster = easterDates[today.getFullYear() as keyof typeof easterDates];
    if (currentEaster && currentEaster.month === month && currentEaster.day === day) {
      try {
        const allUsers = db.prepare('SELECT id, name, email FROM users WHERE account_status = ?').all('active') as any[];
        allUsers.forEach(user => {
          sendEmail(
            user.email,
            'Happy Easter from Kosi Bills! 🐰🥚',
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
              <h2>Happy Easter, ${user.name}! 🐰🥚</h2>
              <p>Wishing you a blessed and joyful Easter celebration!</p>
              <p>Special offer: Free data bundle on any airtime purchase today!</p>
              <p>Best regards,<br>Kosi Bills Team</p>
            </div>
            `
          ).catch(err => logger.error('[EMAIL] Failed to send Easter email', { error: err, email: user.email }));
        });
      } catch (error) {
        logger.error('[EMAIL] Failed to send Easter emails', { error });
      }
    }

    logger.info('[EMAIL] Daily email check completed', { date: todayStr });
  };

  // Run immediately on startup
  checkDaily();
  
  // Schedule to run every 24 hours
  setInterval(checkDaily, 24 * 60 * 60 * 1000);
  logger.info('[EMAIL] Email scheduler started');
}

// Start email scheduler
startEmailScheduler();

const PORT = parseInt(process.env.PORT || '5000');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
