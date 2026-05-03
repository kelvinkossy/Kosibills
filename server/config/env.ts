import { logger } from './logger.js';

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

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  bvnEncryptionKey: process.env.BVN_ENCRYPTION_KEY || 'dev-encryption-key',
  adminEmail: process.env.ADMIN_EMAIL || '',
  vapidKeys: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  flutterwaveSecretKey: process.env.FLW_SECRET_KEY || '',
  termiiApiKey: process.env.TERMII_API_KEY || '',
};
