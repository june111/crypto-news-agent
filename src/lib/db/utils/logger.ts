/**
 * 统一的日志记录工具
 * 提供更简洁和可配置的日志输出
 */

// 开发模式下启用详细日志
const IS_DEBUG = process.env.NODE_ENV === 'development' || process.env.DEBUG_SUPABASE === 'true';

/**
 * 记录调试日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logDebug(message: string, data?: unknown): void {
  if (!IS_DEBUG) return;
  
  if (data) {
    console.log(`[DB] ${message}`, data);
  } else {
    console.log(`[DB] ${message}`);
  }
}

/**
 * 记录信息日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logInfo(message: string, data?: unknown): void {
  if (data) {
    console.info(`[INFO] ${message}`, data);
  } else {
    console.info(`[INFO] ${message}`);
  }
}

/**
 * 记录警告日志
 * @param message 日志消息
 * @param data 附加数据
 */
export function logWarning(message: string, data?: unknown): void {
  if (data) {
    console.warn(`[WARN] ${message}`, data);
  } else {
    console.warn(`[WARN] ${message}`);
  }
}

/**
 * 记录错误日志
 * @param message 日志消息
 * @param error 错误对象或附加数据
 */
export function logError(message: string, error?: unknown): void {
  if (error instanceof Error) {
    console.error(`[ERROR] ${message}:`, error.message);
    if (IS_DEBUG && error.stack) {
      console.error(error.stack);
    }
  } else if (error) {
    console.error(`[ERROR] ${message}:`, error);
  } else {
    console.error(`[ERROR] ${message}`);
  }
} 