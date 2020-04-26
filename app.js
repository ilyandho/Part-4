const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// Logger util
const logger = require('./utils/logger');
const config = require('./utils/config');
// Middleware
const middleware = require('./utils/middelware');
// Moddels
const Blog = require('./models/Blog');

// Controllers
const blogsRouters = require('./controllers/blog');
const usersRouters = require('./controllers/users');
const loginRouter = require('./controllers/login');

logger.info('connecting to', config.MONGODB_URI);
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info('connected to MongoDB'))
  .catch((error) =>
    logger.error('error connection to MongoDB:', error.message)
  );

app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);

// Routes
// To only be availed if we're in the test environment
if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use('/api/blogs/', blogsRouters);

app.use('/api/users/', usersRouters);

app.use('/api/login/', loginRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
