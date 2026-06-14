import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole(UserRole.ADMIN)(req, res, next);
}

export function requireEditorOrAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole(UserRole.ADMIN, UserRole.EDITOR)(req, res, next);
}

/** Block Reviewer role from any mutating action — Reviewers are read-only */
export function denyReviewer(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.role === UserRole.REVIEWER) {
    res.status(403).json({ error: 'Reviewers have read-only access and cannot modify data' });
    return;
  }
  next();
}

export function canAccessDomain(req: Request, domain: string): boolean {
  if (!req.user) return false;
  if (req.user.role === UserRole.ADMIN) return true;
  return req.user.domainScope.includes(domain);
}

export function isReadOnlyRole(role: UserRole): boolean {
  return role === UserRole.REVIEWER;
}
