/**
 * 应用日志模块
 */

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 日志内容格式
interface LogData {
  message: string;
  [key: string]: any;
}

// 简单的日志工具
class Logger {
  /**
   * 输出调试日志
   */
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
  
  /**
   * 输出信息日志
   */
  info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  /**
   * 输出警告日志
   */
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
  
  /**
   * 输出错误日志
   */
  error(message: string, data?: any) {
    this.log('error', message, data);
  }
  
  /**
   * 通用日志输出方法
   */
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logData: LogData = {
      message,
      timestamp,
      level,
      ...data
    };
    
    // 只在开发环境或服务器端输出详细日志
    if (process.env.NODE_ENV === 'development' || typeof window === 'undefined') {
      switch (level) {
        case 'debug':
          console.debug(`[${timestamp}] [DEBUG]`, message, data || '');
          break;
        case 'info':
          console.info(`[${timestamp}] [INFO]`, message, data || '');
          break;
        case 'warn':
          console.warn(`[${timestamp}] [WARN]`, message, data || '');
          break;
        case 'error':
          console.error(`[${timestamp}] [ERROR]`, message, data || '');
          break;
      }
    }
    
    // 可以在这里添加日志收集服务的代码
    // 例如发送到日志服务器或第三方日志服务
  }
}

// 导出单例
export const logger = new Logger(); 