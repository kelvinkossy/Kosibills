import Database from 'better-sqlite3';
import { logger } from './logger.js';

const db = new Database('kosi_bills.db');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 30000000000');

export function initializeDatabase() {
  logger.info('Initializing database...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_email_verified INTEGER DEFAULT 0,
      email_receipts_enabled INTEGER DEFAULT 1,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expiry TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
    CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
    CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

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

    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_tx_ref ON transactions(tx_ref);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

    CREATE TABLE IF NOT EXISTS sub_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      name TEXT,
      balance REAL DEFAULT 0,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sub_wallets_owner_id ON sub_wallets(owner_id);

    CREATE TABLE IF NOT EXISTS sub_wallet_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sub_wallet_id INTEGER,
      user_id INTEGER,
      allowed_categories TEXT,
      FOREIGN KEY(sub_wallet_id) REFERENCES sub_wallets(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sub_wallet_members_sub_wallet ON sub_wallet_members(sub_wallet_id);
    CREATE INDEX IF NOT EXISTS idx_sub_wallet_members_user ON sub_wallet_members(user_id);

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

    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
  `);

  try {
    db.exec('ALTER TABLE users ADD COLUMN daily_transfer_limit REAL DEFAULT 50000;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN daily_withdrawal_limit REAL DEFAULT 50000;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN total_referred INTEGER DEFAULT 0;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN bvn TEXT;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_email_verified INTEGER DEFAULT 0;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN email_receipts_enabled INTEGER DEFAULT 1;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN verification_token TEXT;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT;');
  } catch(e) { }
  try {
    db.exec('ALTER TABLE users ADD COLUMN reset_token_expiry TEXT;');
  } catch(e) { }

  logger.info('Database initialized successfully with optimized indexes');
}

export { db };
