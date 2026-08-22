const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(err, 'MongoDB connection failed');
    throw err;
  }
}

module.exports = connectDB;
