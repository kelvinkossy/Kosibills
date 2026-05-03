import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true,
});

export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
}
