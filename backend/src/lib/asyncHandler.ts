import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Owija asynchroniczny handler, przekazując odrzucone Promise do errorHandlera.
 * Dzięki temu w kontrolerach nie trzeba pisać try/catch dla przekazania błędu dalej.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
