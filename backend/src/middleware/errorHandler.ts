import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : 'Erreur interne du serveur';

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err.stack);
  }

  res.status(statusCode).json({
    error:   message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const err: AppError = new Error(message);
  err.statusCode    = statusCode;
  err.isOperational = true;
  return err;
};