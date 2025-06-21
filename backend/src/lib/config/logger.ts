export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
  maxMessageLength: number;
  borderChar: string;
  borderLength: number;
  dateFormat: 'iso' | 'locale' | 'custom';
  customDateFormatter?: () => string;
  enableStackTrace: boolean;
  enableMetadata: boolean;
  outputTarget: 'console' | 'buffer' | 'both';
  bufferSize: number;
  enableProfiling: boolean;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  extra?: any;
  metadata?: Record<string, any>;
  stackTrace?: string;
  duration?: number;
}

export interface ColorScheme {
  [key: string]: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private colorSchemes: ColorScheme;
  private timers: Map<string, number> = new Map();
  private metadata: Record<string, any> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableTimestamp: true,
      enableColors: true,
      maxMessageLength: 1000,
      borderChar: '═',
      borderLength: 80,
      dateFormat: 'iso',
      enableStackTrace: false,
      enableMetadata: true,
      outputTarget: 'console',
      bufferSize: 100,
      enableProfiling: false,
      ...config
    };

    this.colorSchemes = {
      debug: { primary: '\x1B[36m', secondary: '\x1B[96m', accent: '\x1B[46m' },
      info: { primary: '\x1B[34m', secondary: '\x1B[94m', accent: '\x1B[44m' },
      warn: { primary: '\x1B[33m', secondary: '\x1B[93m', accent: '\x1B[43m' },
      error: { primary: '\x1B[31m', secondary: '\x1B[91m', accent: '\x1B[41m' },
      fatal: { primary: '\x1B[35m', secondary: '\x1B[95m', accent: '\x1B[45m' }
    };
  }

  // Configuration methods
  setLevel(level: LogLevel): Logger {
    this.config.level = level;
    return this;
  }

  setConfig(config: Partial<LoggerConfig>): Logger {
    this.config = { ...this.config, ...config };
    return this;
  }

  addMetadata(key: string, value: any): Logger {
    this.metadata[key] = value;
    return this;
  }

  removeMetadata(key: string): Logger {
    delete this.metadata[key];
    return this;
  }

  clearMetadata(): Logger {
    this.metadata = {};
    return this;
  }

  // Profiling methods
  startTimer(label: string): Logger {
    if (this.config.enableProfiling) {
      this.timers.set(label, performance.now());
    }
    return this;
  }

  endTimer(label: string): number | null {
    if (!this.config.enableProfiling || !this.timers.has(label)) {
      return null;
    }
    const duration = performance.now() - this.timers.get(label)!;
    this.timers.delete(label);
    return duration;
  }

  profile<T>(label: string, fn: () => T): T {
    this.startTimer(label);
    try {
      const result = fn();
      const duration = this.endTimer(label);
      this.debug(`Profile: ${label} completed`, { duration: `${duration?.toFixed(2)}ms` });
      return result;
    } catch (error) {
      const duration = this.endTimer(label);
      this.error(`Profile: ${label} failed`, { duration: `${duration?.toFixed(2)}ms`, error });
      throw error;
    }
  }

  // Core logging methods
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private getTimestamp(): string {
    switch (this.config.dateFormat) {
      case 'locale':
        return new Date().toLocaleString();
      case 'custom':
        return this.config.customDateFormatter?.() || new Date().toISOString();
      default:
        return new Date().toISOString();
    }
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack?.split('\n').slice(3, 8).join('\n') || '';
  }

  private truncateMessage(message: string): string {
    if (message.length <= this.config.maxMessageLength) {
      return message;
    }
    return `${message.substring(0, this.config.maxMessageLength - 3)}...`;
  }

  private colorize(text: string, colorCode: string): string {
    if (!this.config.enableColors) return text;
    return `${colorCode}${text}\x1B[0m`;
  }

  private formatExtra(extra: any): string {
    if (extra === undefined || extra === null) return '';
    
    try {
      if (typeof extra === 'object') {
        return JSON.stringify(extra, null, 2);
      }
      return String(extra);
    } catch {
      return '[Circular Reference or Unserializable Object]';
    }
  }

  private createLogEntry(level: LogLevel, message: string, extra?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message: this.truncateMessage(message),
      timestamp: this.getTimestamp(),
      extra
    };

    if (this.config.enableMetadata && Object.keys(this.metadata).length > 0) {
      entry.metadata = { ...this.metadata };
    }

    if (this.config.enableStackTrace && level >= LogLevel.ERROR) {
      entry.stackTrace = this.getStackTrace();
    }

    return entry;
  }

  private addToBuffer(entry: LogEntry): void {
    if (this.config.outputTarget === 'console') return;
    
    this.buffer.push(entry);
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift();
    }
  }

  private outputToConsole(entry: LogEntry, levelName: string, colors: any): void {
    if (this.config.outputTarget === 'buffer') return;

    const timestamp = this.config.enableTimestamp 
      ? this.colorize(`@ ${entry.timestamp}`, '\x1B[90m')
      : '';
    
    const border = this.colorize(
      this.config.borderChar.repeat(this.config.borderLength), 
      '\x1B[90m'
    );
    
    const title = this.colorize(`${levelName}:`, colors.primary);
    const arrow = this.colorize('→', colors.secondary);
    const extraArrow = this.colorize('↳', colors.accent);

    console.log(`\n${border}`);
    console.log(`${title} ${timestamp}`);
    console.log(`${arrow} ${entry.message}`);
    
    if (entry.extra !== undefined) {
      console.log(`${extraArrow} Extra:`, this.formatExtra(entry.extra));
    }
    
    if (entry.metadata) {
      console.log(`${extraArrow} Metadata:`, this.formatExtra(entry.metadata));
    }
    
    if (entry.stackTrace) {
      console.log(`${extraArrow} Stack Trace:\n${entry.stackTrace}`);
    }
    
    if (entry.duration !== undefined) {
      console.log(`${extraArrow} Duration: ${entry.duration.toFixed(2)}ms`);
    }
    
    console.log(`${border}\n`);
  }

  private log(level: LogLevel, levelName: string, message: string, extra?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, extra);
    const colors = this.colorSchemes[levelName.toLowerCase()];

    this.addToBuffer(entry);
    this.outputToConsole(entry, levelName, colors);
  }

  // Public logging methods
  debug(message: string, extra?: any): Logger {
    this.log(LogLevel.DEBUG, 'Debug', message, extra);
    return this;
  }

  info(message: string, extra?: any): Logger {
    this.log(LogLevel.INFO, 'Info', message, extra);
    return this;
  }

  warn(message: string, extra?: any): Logger {
    this.log(LogLevel.WARN, 'Warning', message, extra);
    return this;
  }

  error(message: string, extra?: any): Logger {
    this.log(LogLevel.ERROR, 'Error', message, extra);
    return this;
  }

  fatal(message: string, extra?: any): Logger {
    this.log(LogLevel.FATAL, 'Fatal', message, extra);
    return this;
  }

  // Utility methods
  group(label: string, fn: () => void): Logger {
    this.info(`▼ ${label} - Start`);
    try {
      fn();
    } finally {
      this.info(`▲ ${label} - End`);
    }
    return this;
  }

  table(data: any[]): Logger {
    if (this.shouldLog(LogLevel.INFO)) {
      console.table(data);
    }
    return this;
  }

  assert(condition: boolean, message: string, extra?: any): Logger {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, extra);
    }
    return this;
  }

  // Buffer management
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  clearBuffer(): Logger {
    this.buffer = [];
    return this;
  }

  exportBuffer(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['level', 'timestamp', 'message', 'extra'];
      const rows = this.buffer.map(entry => [
        LogLevel[entry.level],
        entry.timestamp,
        entry.message,
        this.formatExtra(entry.extra)
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    return JSON.stringify(this.buffer, null, 2);
  }

  // Factory methods
  static create(config?: Partial<LoggerConfig>): Logger {
    return new Logger(config);
  }

  static createChild(parent: Logger, additionalConfig?: Partial<LoggerConfig>): Logger {
    const childConfig = { ...parent.config, ...additionalConfig };
    const child = new Logger(childConfig);
    child.metadata = { ...parent.metadata };
    return child;
  }
}

// Pre-configured logger instances
export const logger = Logger.create();

export const devLogger = Logger.create({
  level: LogLevel.DEBUG,
  enableStackTrace: true,
  enableProfiling: true,
  borderChar: '─',
  dateFormat: 'locale'
});

export const prodLogger = Logger.create({
  level: LogLevel.WARN,
  enableColors: false,
  enableStackTrace: true,
  outputTarget: 'both',
  bufferSize: 1000
});

// Usage Examples:
/*
// Basic usage
logger.info('Application started', { version: '1.0.0' });

// With metadata
logger.addMetadata('userId', '12345').addMetadata('sessionId', 'abc-def');
logger.warn('User action', { action: 'delete', resource: 'document' });

// Profiling
logger.startTimer('database-query');
// ... some operation
const duration = logger.endTimer('database-query');
logger.info('Query completed', { duration: `${duration}ms` });

// or use profile helper
const result = logger.profile('api-call', () => {
  // your API call here
  return fetch('/api/data');
});

// Grouping
logger.group('User Registration Process', () => {
  logger.info('Validating user input');
  logger.info('Creating user account');
  logger.info('Sending welcome email');
});

// Configuration
logger.setLevel(LogLevel.DEBUG)
      .setConfig({ enableColors: false, borderLength: 60 });

// Export logs
const jsonLogs = logger.exportBuffer('json');
const csvLogs = logger.exportBuffer('csv');
*/