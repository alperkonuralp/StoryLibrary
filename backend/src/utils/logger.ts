import winston from 'winston';
import { isProduction, isDevelopment } from './helpers';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for log levels (for console output)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports for production
if (isProduction()) {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: isDevelopment() ? 'debug' : 'info',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist (for production)
if (isProduction()) {
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Add request logging helper
(logger as any).logRequest = (req: any, res: any, responseTime?: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    responseTime: responseTime ? `${responseTime}ms` : undefined,
  };
  
  const level = res.statusCode >= 400 ? 'error' : 'info';
  logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
};

// Add structured logging methods
(logger as any).logError = (message: string, error: Error, context?: any) => {
  logger.error(message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

(logger as any).logInfo = (message: string, context?: any) => {
  logger.info(message, {
    context,
    timestamp: new Date().toISOString(),
  });
};

(logger as any).logWarn = (message: string, context?: any) => {
  logger.warn(message, {
    context,
    timestamp: new Date().toISOString(),
  });
};

(logger as any).logDebug = (message: string, context?: any) => {
  logger.debug(message, {
    context,
    timestamp: new Date().toISOString(),
  });
};

export default logger;