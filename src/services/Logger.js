/**
 * Logger Service
 * Provides a structured way to log application events, errors, and user actions.
 * Designed to be easily parsable by AI agents.
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
  _addLog(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level, // 'INFO', 'WARN', 'ERROR', 'ACTION', 'GATE'
      message: message,
      data: data ? JSON.parse(JSON.stringify(data)) : null // Deep copy to prevent reference changes
    };

    this.logs.unshift(entry); // Add to beginning (newest first)

    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }

    // Notify listeners (e.g., UI components)
    this.listeners.forEach(listener => listener(this.logs));

    // Also log to console for devtools
    const consoleMethod = level.toLowerCase() === 'error' ? 'error' :
                          level.toLowerCase() === 'warn' ? 'warn' : 'log';

    // Prefix with StudyHub for filtering
    if (data) {
        console[consoleMethod](`[StudyHub][${level}] ${message}`, data);
    } else {
        console[consoleMethod](`[StudyHub][${level}] ${message}`);
    }
  }

  /**
   * Log general information
   */
  info(message, data) {
    this._addLog('INFO', message, data);
  }

  /**
   * Log a warning
   */
  warn(message, data) {
    this._addLog('WARN', message, data);
  }

  /**
   * Log an error
   */
  error(message, errorOrData) {
    let data = errorOrData;
    if (errorOrData instanceof Error) {
        data = {
            name: errorOrData.name,
            message: errorOrData.message,
            stack: errorOrData.stack
        };
    }
    this._addLog('ERROR', message, data);
  }

  /**
   * Log a user action or navigation event (The "Workflow")
   */
  action(actionName, details) {
    this._addLog('ACTION', actionName, details);
  }

  /**
   * Log a logical gate check (e.g., "Data Validation Passed")
   */
  gate(gateName, result) {
    this._addLog('GATE', `${gateName}: ${result ? 'PASSED' : 'FAILED'}`, { result });
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
