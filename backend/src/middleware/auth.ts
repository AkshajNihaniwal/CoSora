import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  domainScope: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  userId: string;
  role: UserRole;
}

export function signAccessToken(user: { id: string; userId: string; role: UserRole }): string {
  const options: SignOptions = { expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(
    { sub: user.id, userId: user.userId, role: user.role },
    config.jwt.secret,
    options
  );
}

export function signRefreshToken(user: { id: string; userId: string; role: UserRole }): string {
  const options: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(
    { sub: user.id, userId: user.userId, role: user.role },
    config.jwt.refreshSecret,
    options
  );
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProd = config.nodeEnv === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    req.user = {
      id: user.id,
      userId: user.userId,
      name: user.name,
      role: user.role,
      domainScope: user.domainScope,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          userId: user.userId,
          name: user.name,
          role: user.role,
          domainScope: user.domainScope,
        };
      }
    } catch {
      // ignore
    }
  }
  next();
}
