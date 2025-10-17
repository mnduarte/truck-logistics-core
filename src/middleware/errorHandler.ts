import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err } as any;
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if ((err as any).name === 'CastError') {
    const message = 'Resource not found';
    error = { ...error, statusCode: 404, message };
  }

  // Mongoose duplicate key
  if ((err as any).name === 'MongoServerError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { ...error, statusCode: 400, message };
  }

  // Mongoose validation error
  if ((err as any).name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { ...error, statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

export const asyncHandler = (fn: RequestHandler): RequestHandler => 
  (req, res, next) => {
    // Garantiza que la promesa devuelta por el handler se capture y cualquier error vaya a next()
    return Promise.resolve(fn(req, res, next)).catch(next);
  };