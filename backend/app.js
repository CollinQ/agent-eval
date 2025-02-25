const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const agentsRouter = require('./routes/agents');
const challengesRouter = require('./routes/challenges');
const evaluationsRouter = require('./routes/evaluations');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API Routes
app.use('/api', indexRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/evaluations', evaluationsRouter);

// Error Handling
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

module.exports = app;