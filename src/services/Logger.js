/**
 * Logger Service
 * Provides a structured way to log application events, errors, and user actions.
 * Designed to be easily parsable by AI agents and provide detailed context.
 */

const MAX_LOGS = 1000;

class LoggerService {
  constructor() {
    this.logs = [];
    this.listeners = [];
  }

  /**
   * Internal method to add a log entry
   */
  _addLog(level, message, data = null, context = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level, // 'INFO', 'WARN', 'ERROR', 'ACTION', 'GATE', 'DATA'
      message: message,
      context: context || 'Global',
      data: data ? this._safeSerialize(data) : null
    };

    this.logs.unshift(entry); // Add to beginning (newest first)

    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }

    // Notify listeners (e.g., UI components)
    this.listeners.forEach(listener => listener(this.logs));

    // Also log to console for devtools with consistent styling
    this._consoleLog(level, message, data, context);
  }

  _safeSerialize(data) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (e) {
      return '[Circular or Non-Serializable Data]';
    }
  }

  _consoleLog(level, message, data, context) {
    const prefix = `[StudyHub][${context || 'App'}]`;
    const style = this._getConsoleStyle(level);

    if (data) {
        console.groupCollapsed(`%c${prefix} ${message}`, style);
        console.log(data);
        console.groupEnd();
    } else {
        console.log(`%c${prefix} ${message}`, style);
    }
  }

  _getConsoleStyle(level) {
    switch(level) {
        case 'ERROR': return 'color: #ff4d4f; font-weight: bold;';
        case 'WARN': return 'color: #faad14; font-weight: bold;';
        case 'ACTION': return 'color: #1890ff; font-weight: bold;';
        case 'GATE': return 'color: #52c41a; font-weight: bold;';
        case 'DATA': return 'color: #722ed1; font-weight: bold;';
        default: return 'color: #595959;';
    }
  }

  /**
   * Log general information
   */
  info(message, data, context) {
    this._addLog('INFO', message, data, context);
  }

  /**
   * Log a warning
   */
  warn(message, data, context) {
    this._addLog('WARN', message, data, context);
  }

  /**
   * Log an error
   */
  error(message, errorOrData, context) {
    let data = errorOrData;
    if (errorOrData instanceof Error) {
        data = {
            name: errorOrData.name,
            message: errorOrData.message,
            stack: errorOrData.stack
        };
    }
    this._addLog('ERROR', message, data, context);
  }

  /**
   * Log a user action or navigation event (The "Workflow")
   */
  action(actionName, details, context) {
    this._addLog('ACTION', actionName, details, context);
  }

  /**
   * Log a logical gate check (e.g., "Data Validation Passed")
   */
  gate(gateName, result, context) {
    const status = result ? 'PASSED' : 'FAILED';
    this._addLog('GATE', `${gateName}: ${status}`, { result }, context);
  }

  /**
   * Log detailed data loading events
   */
  data(message, details, context) {
      this._addLog('DATA', message, details, context);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.logs));
  }

  /**
   * Subscribe to log updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

// Singleton instance
export const Logger = new LoggerService();
