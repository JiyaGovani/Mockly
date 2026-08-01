/**
 * Standardized API Response Helper Functions
 */

/**
 * Send a success JSON response.
 */
export const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

/**
 * Send an error JSON response.
 */
export const sendError = (res, message = 'Server Error', statusCode = 500) => {
  return res.status(statusCode).json({ message });
};

export default {
  sendSuccess,
  sendError,
};
