//@ts-nocheck
/**
 * Monitoring and logging utilities for the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  service?: string;
}

/**
 * Application logger with different log levels and structured logging
 */
export class Logger {
  private service: string;
  private minLevel: LogLevel;
  private levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(service: string, minLevel: LogLevel = 'info') {
    this.service = service;
    this.minLevel = minLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const combinedContext = {
      ...(context || {}),
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };
    
    this.log('error', message, combinedContext);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Skip if log level is below minimum
    if (this.levels[level] < this.levels[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: this.service
    };

    // In production, we would send logs to a central logging service
    // For now, we'll just output to console with appropriate formatting
    if (process.env.NODE_ENV === 'production') {
      // In a real app, send to your logging service here
      console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
    } else {
      // Format for local development
      const coloredLevel = this.colorize(level);
      console[level === 'debug' ? 'log' : level](
        `[${entry.timestamp}] ${coloredLevel} [${entry.service}]: ${entry.message}`,
        entry.context || ''
      );
    }
  }

  /**
   * Add color to log levels for local development
   */
  private colorize(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '\x1b[34mDEBUG\x1b[0m'; // Blue
      case 'info':
        return '\x1b[32mINFO\x1b[0m';  // Green
      case 'warn':
        return '\x1b[33mWARN\x1b[0m';  // Yellow
      case 'error':
        return '\x1b[31mERROR\x1b[0m'; // Red
      default:
        return level.toUpperCase();
    }
  }
}

/**
 * Performance monitoring for tracking execution time
 */
export class PerformanceMonitor {
  private timers: Record<string, number> = {};

  /**
   * Start timing an operation
   */
  startTimer(operationName: string): void {
    this.timers[operationName] = performance.now();
  }

  /**
   * End timing an operation and get the duration in milliseconds
   */
  endTimer(operationName: string): number {
    if (!this.timers[operationName]) {
      throw new Error(`Timer "${operationName}" was never started`);
    }

    const duration = performance.now() - this.timers[operationName];
    delete this.timers[operationName];
    return duration;
  }

  /**
   * Track and log a timed operation
   */
  async trackOperation<T>(
    operationName: string, 
    operation: () => Promise<T>, 
    logger?: Logger
  ): Promise<T> {
    this.startTimer(operationName);
    
    try {
      const result = await operation();
      const duration = this.endTimer(operationName);
      
      logger?.info(`Operation "${operationName}" completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const duration = this.endTimer(operationName);
      
      logger?.error(
        `Operation "${operationName}" failed after ${duration.toFixed(2)}ms`,
        error
      );
      
      throw error;
    }
  }
}

// Create singleton instances for app-wide usage
export const runpodLogger = new Logger('RunpodService');
export const blobStorageLogger = new Logger('BlobStorageService');
export const notebookLogger = new Logger('NotebookService');
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to add logging and monitoring to a service method
 */
export function monitoredMethod<T>(
  methodName: string,
  logger: Logger,
  method: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    logger.debug(`Starting "${methodName}"`, { args: args.map(arg => typeof arg) });
    
    return performanceMonitor.trackOperation(
      methodName,
      async () => method(...args),
      logger
    );
  };
}