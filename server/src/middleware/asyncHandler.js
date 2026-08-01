/**
 * Express Async Handler middleware
 * Wraps async route handlers to automatically catch and forward errors to Express error handling middleware.
 * Eliminates repetitive try-catch blocks in controller functions.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
