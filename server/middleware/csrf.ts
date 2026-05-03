import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Store tokens in memory for production (use Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>();
const TOKEN_EXPIRY = 3600000; // 1 hour

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token: string, csrfToken: string): boolean {
  if (!token || !csrfToken) return false;
  
  const stored = csrfTokens.get(csrfToken);
  if (!stored) return false;
  
  if (Date.now() > stored.expires) {
    csrfTokens.delete(csrfToken);
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(stored.token, 'hex')
  );
}

/**
 * Middleware to generate and validate CSRF tokens
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate a new CSRF token for each session
    const csrfToken = generateCSRFToken();
    const sessionToken = crypto.randomBytes(16).toString('hex');
    csrfTokens.set(sessionToken, {
      token: csrfToken,
      expires: Date.now() + TOKEN_EXPIRY
    });
    
    // Set CSRF token in cookie and header
    res.cookie('csrf_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY
    });
    
    res.setHeader('X-CSRF-Token', csrfToken);
    return next();
  }
  
  // Validate CSRF token for state-changing requests
  const csrfToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'] as string;
  const bodyToken = req.body?.csrfToken;
  
  const tokenToVerify = headerToken || bodyToken;
  
  if (!csrfToken || !tokenToVerify) {
    return res.status(403).json({ 
      success: false, 
      error: 'CSRF token missing. Please refresh the page and try again.' 
    });
  }
  
  const stored = csrfTokens.get(csrfToken);
  if (!stored || Date.now() > stored.expires) {
    return res.status(403).json({ 
      success: false, 
      error: 'CSRF token expired. Please refresh the page and try again.' 
    });
  }
  
  if (!crypto.timingSafeEqual(
    Buffer.from(tokenToVerify, 'hex'),
    Buffer.from(stored.token, 'hex')
  )) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid CSRF token. Please refresh the page and try again.' 
    });
  }
  
  next();
}

/**
 * Clean up expired tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expires) {
      csrfTokens.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes
