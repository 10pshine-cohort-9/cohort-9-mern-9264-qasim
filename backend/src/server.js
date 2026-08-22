require('dotenv').config();

const app = require('./app');
const logger = require('./config/logger');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  });
