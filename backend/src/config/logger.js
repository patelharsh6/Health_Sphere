const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { NODE_ENV } = require('./env');

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const LOG_DIR = path.resolve(__dirname, '../../logs');

// Console output is for a human reading a terminal: one coloured line, with the
// request id when there is one, and the stack appended for errors.
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, requestId, stack }) => {
    const tag = requestId ? ` [${requestId}]` : '';
    return `${timestamp} ${level}${tag}: ${stack || message}`;
  })
);

// File output is for grepping and machine parsing, so it stays structured JSON.
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
];

// Only enable file transports when NOT in a serverless environment (where filesystem is read-only)
if (!isServerless) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
      })
    );
  } catch (err) {
    // Filesystem may be read-only; fallback to console only
  }
}

const logger = winston.createLogger({
  // Tests stay quiet unless something actually fails.
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  silent: NODE_ENV === 'test',
  format: isServerless ? consoleFormat : fileFormat,
  transports,
  exitOnError: false,
});

/**
 * Stream adapter so morgan writes through winston instead of straight to
 * stdout — one destination, one format, one place to look.
 */
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
