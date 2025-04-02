/**
 * UUID工具函数
 */

/**
 * 生成标准的UUID v4
 * @returns 格式化的UUID字符串
 */
export function generateUUID(): string {
  // RFC4122 UUID v4 实现
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 验证字符串是否为有效的UUID格式
 * @param uuid 要验证的UUID字符串
 * @returns 是否为有效UUID
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 如果输入是有效UUID则返回，否则生成新UUID
 * @param id 可能的UUID字符串
 * @returns 有效的UUID
 */
export function ensureValidUUID(id?: string): string {
  return (id && isValidUUID(id)) ? id : generateUUID();
} 