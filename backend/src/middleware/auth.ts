import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

export const authenticate: RequestHandler = (
  req,
  res,
  next
) => {
  const authReq = req as AuthRequest;

  const token = authReq.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Non autorisé' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthRequest['user'];

    authReq.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

export const isAdmin: RequestHandler = (
  req,
  res,
  next
) => {
  const authReq = req as AuthRequest;

  if (authReq.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Accès refusé' });
    return;
  }

  next();
};