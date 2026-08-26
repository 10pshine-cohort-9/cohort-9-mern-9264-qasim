const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

app.use(errorHandler);

module.exports = app;
