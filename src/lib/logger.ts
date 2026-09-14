import * as Sentry from '@sentry/react'

export type LogLevel = 'debug' | 'info' | 'warning' | 'error'

/**
 * Unified logging utility that logs to both browser console and Sentry.
 * Use this for any logging that needs to be tracked in production analytics.
 *
 * @param message - The log message
 * @param level - Log level: 'debug' | 'info' | 'warning' | 'error'
 * @param context - Optional additional context data to attach to the log
 */
export function logWithAnalytics(
  message: string,
  level: LogLevel = 'info',
  context?: Record<string, unknown>
): void {
  // Log to browser console with appropriate method
  const consoleMethod = level === 'debug' ? 'debug' : level === 'info' ? 'log' : level === 'warning' ? 'warn' : 'error'
  console[consoleMethod as 'log' | 'debug' | 'warn' | 'error'](`[${level.toUpperCase()}] ${message}`, context ?? '')

  // Send to Sentry
  Sentry.captureMessage(message, level)

  // If there's context, attach it as Sentry breadcrumb for better debugging
  if (context) {
    Sentry.addBreadcrumb({
      message,
      level: level === 'warning' ? 'warning' : level === 'error' ? 'error' : 'info',
      data: context,
      category: 'analytics',
    })
  }
}

/**
 * Convenience function for debug-level logging
 */
export function logDebug(message: string, context?: Record<string, unknown>): void {
  logWithAnalytics(message, 'debug', context)
}

/**
 * Convenience function for info-level logging
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  logWithAnalytics(message, 'info', context)
}

/**
 * Convenience function for warning-level logging
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
  logWithAnalytics(message, 'warning', context)
}

/**
 * Convenience function for error-level logging
 */
export function logError(message: string, context?: Record<string, unknown>): void {
  logWithAnalytics(message, 'error', context)
}
