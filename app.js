require('dotenv').config();
global.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes');
const Redis = require('ioredis');
const winston = require('winston');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

// Redis Setup
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
  console.log('Redis Connected Successfully');
});

redis.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

app.set('redis', redis);

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Logger Setup
const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});
app.set('logger', logger);

// Centralized Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
