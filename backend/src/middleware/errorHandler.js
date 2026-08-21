const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  logger.error({ err, path: req.path, method: req.method }, err.message);

  res.status(status).json({
    error: {
      message: status >= 500 ? 'Internal server error' : err.message,
    },
  });
}

module.exports = errorHandler;
