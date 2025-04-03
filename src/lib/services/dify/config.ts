/**
 * Dify配置
 */

// Dify API配置项
interface IDifyConfig {
  apiEndpoint: string;
  apiKey: string;
  appId: string;
}

// 从环境变量中获取配置
export class DifyConfig {
  // 默认配置
  static DIFY_CONFIG: IDifyConfig = {
    apiEndpoint: process.env.DIFY_API_ENDPOINT || 'https://api.dify.ai/v1',
    apiKey: process.env.DIFY_API_KEY || '',
    appId: process.env.DIFY_APP_ID || '',
  };

  /**
   * 获取Dify API密钥
   */
  static getDifyApiKey(): string {
    if (!this.DIFY_CONFIG.apiKey) {
      console.warn('[Dify] 未配置API密钥，请在环境变量中设置DIFY_API_KEY');
    }
    return this.DIFY_CONFIG.apiKey;
  }

  /**
   * 获取Dify应用ID
   */
  static getDifyAppId(): string {
    if (!this.DIFY_CONFIG.appId) {
      console.warn('[Dify] 未配置应用ID，请在环境变量中设置DIFY_APP_ID');
    }
    return this.DIFY_CONFIG.appId;
  }

  /**
   * 获取完整配置
   */
  static getConfig(): IDifyConfig {
    return this.DIFY_CONFIG;
  }
} 