const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/health', healthRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

app.use(errorHandler);

module.exports = app;
