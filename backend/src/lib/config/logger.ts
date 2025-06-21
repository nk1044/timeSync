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
  args?: any[];
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

  private isMongoObjectId(value: any): boolean {
    try {
      return value && 
             typeof value === 'object' && 
             value.constructor && 
             (value.constructor.name === 'ObjectId' || 
              value.constructor.name === 'ObjectID' ||
              (value._bsontype === 'ObjectId' || value._bsontype === 'ObjectID') ||
              (value.buffer && typeof value.toHexString === 'function'));
    } catch {
      return false;
    }
  }

  private isBuffer(value: any): boolean {
    try {
      return value && 
             typeof value === 'object' && 
             value.buffer && 
             typeof value.buffer === 'object' &&
             Object.keys(value.buffer).every(key => !isNaN(Number(key)));
    } catch {
      return false;
    }
  }

  private formatMongoId(value: any): string {
    try {
      if (typeof value.toHexString === 'function') {
        return `ObjectId("${value.toHexString()}")`;
      }
      if (typeof value.toString === 'function') {
        const str = value.toString();
        if (str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str)) {
          return `ObjectId("${str}")`;
        }
      }
      if (value.buffer) {
        const bytes = Object.values(value.buffer);
        const hex = bytes.map((b: any) => b.toString(16).padStart(2, '0')).join('');
        return `ObjectId("${hex}")`;
      }
      return '[ObjectId: Unable to format]';
    } catch {
      return '[ObjectId: Error formatting]';
    }
  }

  private getTypeLabel(value: any): string {
    try {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (this.isMongoObjectId(value)) return 'ObjectId';
      if (this.isBuffer(value)) return 'Buffer';
      if (Array.isArray(value)) return 'array';
      if (value instanceof Date) return 'Date';
      if (value instanceof RegExp) return 'RegExp';
      if (value instanceof Error) return 'Error';
      if (typeof value === 'function') return 'Function';
      if (typeof value === 'string') return 'string';
      if (typeof value === 'number') return 'number';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'object') return 'object';
      return typeof value;
    } catch (error) {
      return 'unknown';
    }
  }

  private formatValue(value: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    
    try {
      const type = this.getTypeLabel(value);
      
      switch (type) {
        case 'string':
          return `"${String(value)}"`;
        
        case 'number':
          return isNaN(value) ? 'NaN' : String(value);
          
        case 'boolean':
          return String(value);
        
        case 'null':
        case 'undefined':
          return type;

        case 'ObjectId':
          return this.formatMongoId(value);

        case 'Buffer':
          try {
            if (value.buffer && Object.keys(value.buffer).length <= 24) {
              const bytes = Object.values(value.buffer);
              const hex = bytes.map((b: any) => b.toString(16).padStart(2, '0')).join('');
              return `Buffer<${hex}>`;
            }
            return `Buffer<${Object.keys(value.buffer).length} bytes>`;
          } catch {
            return '[Buffer: Error formatting]';
          }
        
        case 'Function':
          try {
            return `[Function: ${value.name || 'anonymous'}]`;
          } catch {
            return '[Function: <error getting name>]';
          }
        
        case 'Date':
          try {
            return value.toISOString();
          } catch {
            return 'Invalid Date';
          }
        
        case 'RegExp':
          try {
            return value.toString();
          } catch {
            return '[RegExp: <error converting>]';
          }
        
        case 'Error':
          try {
            return `${value.name}: ${value.message || 'No message'}`;
          } catch {
            return `Error: [Could not access error details]`;
          }
        
        case 'array':
          try {
            if (!Array.isArray(value) || value.length === 0) return '[]';
            
            if (indent > 3) return '[Array: Too deeply nested]';
            
            const items = value.slice(0, 20).map((item: any, index: number) => {
              try {
                const formatted = this.formatValue(item, indent + 1);
                return `${spaces}  ${index}: ${formatted}`;
              } catch {
                return `${spaces}  ${index}: [Error formatting item]`;
              }
            });
            
            const truncated = value.length > 20 ? [`${spaces}  ... (${value.length - 20} more items)`] : [];
            return `[\n${items.concat(truncated).join('\n')}\n${spaces}]`;
          } catch {
            return '[Array: <error formatting>]';
          }
        
        case 'object':
          try {
            if (value === null) return 'null';
            
            if (indent > 3) return '{...}';
            
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            
            const items = keys.slice(0, 15).map(key => {
              try {
                const formatted = this.formatValue(value[key], indent + 1);
                return `${spaces}  ${key}: ${formatted}`;
              } catch {
                return `${spaces}  ${key}: [Error formatting property]`;
              }
            });
            
            const truncated = keys.length > 15 ? [`${spaces}  ... (${keys.length - 15} more properties)`] : [];
            return `{\n${items.concat(truncated).join('\n')}\n${spaces}}`;
          } catch {
            return '[Object: <error formatting>]';
          }
        
        default:
          try {
            const str = JSON.stringify(value, null, 2);
            return str && str.length < 200 ? str : '[Large/Complex Object]';
          } catch {
            return '[Unserializable Object]';
          }
      }
    } catch (error) {
      return '[Formatting Error]';
    }
  }

  private processArguments(...args: any[]): { message: string; formattedArgs: string[] } {
    try {
      if (args.length === 0) {
        return { message: '[No arguments provided]', formattedArgs: [] };
      }

      // First argument is always treated as the main message
      const message = args[0] != null ? String(args[0]) : '[null/undefined message]';
      const formattedArgs: string[] = [];

      // Process remaining arguments
      for (let i = 1; i < args.length; i++) {
        try {
          const arg = args[i];
          const type = this.getTypeLabel(arg);
          const formatted = this.formatValue(arg);
          formattedArgs.push(`[${type}] ${formatted}`);
        } catch (argError) {
          formattedArgs.push(`[error] Could not format argument ${i}`);
        }
      }

      return { message, formattedArgs };
    } catch (error) {
      return { 
        message: '[Error processing arguments]', 
        formattedArgs: [`[error] ${args.length} arguments provided but could not process`] 
      };
    }
  }

  private createLogEntry(level: LogLevel, ...args: any[]): LogEntry {
    const { message, formattedArgs } = this.processArguments(...args);
    
    const entry: LogEntry = {
      level,
      message: this.truncateMessage(message),
      timestamp: this.getTimestamp(),
      args: args.length > 1 ? args.slice(1) : undefined
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
    try {
      if (this.config.outputTarget === 'console') return;
      
      this.buffer.push(entry);
      if (this.buffer.length > (this.config.bufferSize || 100)) {
        this.buffer.shift();
      }
    } catch (error) {
      // Silently fail - don't let buffer issues crash logging
    }
  }

  private outputToConsole(entry: LogEntry, levelName: string, colors: any, formattedArgs: string[]): void {
    if (this.config.outputTarget === 'buffer') return;

    try {
      // Fallback colors if colors object is undefined or missing properties
      const safeColors = {
        primary: colors?.primary || '\x1B[37m',
        secondary: colors?.secondary || '\x1B[37m', 
        accent: colors?.accent || '\x1B[37m'
      };

      const timestamp = this.config.enableTimestamp 
        ? this.colorize(`${entry.timestamp}`, '\x1B[90m')
        : '';
      
      const border = this.colorize(
        (this.config.borderChar || '=').repeat(this.config.borderLength || 80), 
        '\x1B[90m'
      );
      
      const title = this.colorize(`[${levelName || 'LOG'}]`, safeColors.primary);
      const messageColor = this.colorize(entry.message || '[No message]', safeColors.secondary);

      console.log(`\n${title} ${timestamp}`);
      console.log(`${messageColor}`);
      
      // Display formatted arguments with better structure
      if (formattedArgs && formattedArgs.length > 0) {
        formattedArgs.forEach((arg, index) => {
          try {
            // Remove the type prefix since we show it more cleanly
            const cleanArg = arg.replace(/^\[[^\]]+\]\s*/, '');
            console.log(`\n${this.colorize(`Data ${index + 1}:`, safeColors.accent)}`);
            console.log(cleanArg);
          } catch (argError) {
            console.log(`\nData ${index + 1}: [Error displaying argument]`);
          }
        });
      }
      
      if (entry.metadata) {
        try {
          console.log(`\n${this.colorize('Metadata:', safeColors.accent)}`);
          console.log(this.formatValue(entry.metadata));
        } catch (metaError) {
          console.log('\nMetadata: [Error displaying metadata]');
        }
      }
      
      if (entry.stackTrace) {
        try {
          console.log(`\n${this.colorize('Stack Trace:', safeColors.accent)}`);
          console.log(entry.stackTrace);
        } catch (stackError) {
          console.log('\nStack Trace: [Error displaying stack trace]');
        }
      }
      
      if (entry.duration !== undefined && !isNaN(entry.duration)) {
        console.log(`\n${this.colorize('Duration:', safeColors.accent)} ${entry.duration.toFixed(2)}ms`);
      }
      
      console.log(`${border}\n`);
    } catch (error) {
      // Ultimate fallback - plain console output
      console.log(`\n[${levelName || 'LOG'}] ${entry.timestamp || new Date().toISOString()}`);
      console.log(`${entry.message || '[No message]'}`);
      if (formattedArgs && formattedArgs.length > 0) {
        console.log(`Arguments: ${formattedArgs.length} provided`);
        formattedArgs.forEach((arg, i) => {
          console.log(`  ${i + 1}: ${arg.substring(0, 200)}${arg.length > 200 ? '...' : ''}`);
        });
      }
      console.log('────────────────────────────────────────\n');
    }
  }

  private log(level: LogLevel, levelName: string, ...args: any[]): void {
    try {
      if (!this.shouldLog(level)) return;

      const entry = this.createLogEntry(level, ...args);
      const colors = this.colorSchemes[levelName?.toLowerCase()] || this.colorSchemes['info'];
      const { formattedArgs } = this.processArguments(...args);

      this.addToBuffer(entry);
      this.outputToConsole(entry, levelName, colors, formattedArgs);
    } catch (error) {
      // Fallback logging - never let the logger crash
      try {
        console.error(`[LOGGER ERROR] Failed to log message:`, error);
        console.log(`[FALLBACK] ${levelName || 'LOG'}: ${args[0] || '[No message]'}`);
      } catch (fallbackError) {
        // Ultimate fallback
        console.log('[LOGGER CRITICAL ERROR] Logger completely failed');
      }
    }
  }

  // Public logging methods - now accept variable arguments
  debug(...args: any[]): Logger {
    this.log(LogLevel.DEBUG, 'Debug', ...args);
    return this;
  }

  info(...args: any[]): Logger {
    this.log(LogLevel.INFO, 'Info', ...args);
    return this;
  }

  warn(...args: any[]): Logger {
    this.log(LogLevel.WARN, 'Warning', ...args);
    return this;
  }

  error(...args: any[]): Logger {
    this.log(LogLevel.ERROR, 'Error', ...args);
    return this;
  }

  fatal(...args: any[]): Logger {
    this.log(LogLevel.FATAL, 'Fatal', ...args);
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

  assert(condition: boolean, message: string, ...args: any[]): Logger {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, ...args);
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
      const headers = ['level', 'timestamp', 'message', 'args'];
      const rows = this.buffer.map(entry => [
        LogLevel[entry.level],
        entry.timestamp,
        entry.message,
        entry.args ? JSON.stringify(entry.args) : ''
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

// Enhanced Usage Examples:
/*
// Variable arguments with different types
logger.info('User data:', { id: 123, name: 'John' }, [1, 2, 3], true, null, undefined);

// Mixed types
logger.debug('Processing:', 'user-123', { active: true }, new Date(), /test/gi);

// Error with context
const error = new Error('Database connection failed');
logger.error('Failed to connect:', error, { retryCount: 3, timeout: 5000 });

// Arrays and nested objects
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
const config = { database: { host: 'localhost', port: 5432 } };
logger.info('Application started:', users, config, 'v1.0.0', true);

// Functions
const processData = () => 'some data';
logger.debug('Registering handler:', processData, { type: 'data-processor' });

// With metadata
logger.addMetadata('userId', '12345');
logger.warn('Deprecated API usage:', { endpoint: '/old-api', replacement: '/v2/api' });

// Assertion with context
logger.assert(users.length > 0, 'No users found', { query: 'SELECT * FROM users', timestamp: new Date() });
*/