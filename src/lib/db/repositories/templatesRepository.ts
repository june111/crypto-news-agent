/**
 * 模板仓库
 * 提供模板相关的数据库操作
 */
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase';
import { safeQuery } from '../utils/queryBuilder';

// 模板接口类型
export interface Template {
  id?: string;
  name: string;
  content: string;
  description?: string;
  category?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 获取所有模板，支持分页、筛选和排序
export async function getAllTemplates({
  page = 1,
  pageSize = 10,
  category = '',
  sortBy = 'created_at',
  sortOrder = 'desc'
} = {}) {
  try {
    const supabase = getSupabaseClient();
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 构建查询
    let query = safeQuery(supabase
      .from('templates')
      .select('*', { count: 'exact' }));
    
    // 添加分类筛选
    if (category) {
      query = query.eq('category', category);
    }
    
    // 添加排序和分页
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error('获取模板列表失败:', error);
      throw error;
    }
    
    // 确保返回安全的数据结构
    const templates = Array.isArray(data) ? data : [];
    const totalCount = count !== null && count !== undefined ? count : 0;
    
    return {
      templates,
      total: totalCount,
      page,
      pageSize,
      totalPages: totalCount ? Math.ceil(totalCount / pageSize) : 0
    };
  } catch (error) {
    console.error('获取模板列表失败:', error);
    throw error;
  }
}

// 根据ID获取单个模板
export async function getTemplateById(id: string): Promise<Template> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await safeQuery(supabase
      .from('templates')
      .select('*'))
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`获取模板 ${id} 失败:`, error);
      throw error;
    }
    
    return data as Template;
  } catch (error) {
    console.error(`获取模板 ${id} 失败:`, error);
    throw error;
  }
}

// 创建新模板
export async function createTemplate(template: {
  name: string;
  content: string;
  description?: string;
  category?: string;
}): Promise<Template> {
  try {
    const supabase = getSupabaseClient();
    
    const newTemplate = {
      id: uuidv4(),
      ...template,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await safeQuery(supabase
      .from('templates'))
      .insert(newTemplate)
      .select("*")
      .single();
    
    if (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
    
    return data as Template;
  } catch (error) {
    console.error('创建模板失败:', error);
    throw error;
  }
}

// 更新现有模板
export async function updateTemplate(
  id: string,
  updates: {
    name?: string;
    content?: string;
    description?: string;
    category?: string;
  }
): Promise<Template> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await safeQuery(supabase
      .from('templates'))
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select("*")
      .single();
    
    if (error) {
      console.error(`更新模板 ${id} 失败:`, error);
      throw error;
    }
    
    return data as Template;
  } catch (error) {
    console.error(`更新模板 ${id} 失败:`, error);
    throw error;
  }
}

// 删除模板
export async function deleteTemplate(id: string) {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await safeQuery(supabase
      .from('templates'))
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`删除模板 ${id} 失败:`, error);
      throw error;
    }
    
    return { success: true, id };
  } catch (error) {
    console.error(`删除模板 ${id} 失败:`, error);
    throw error;
  }
}

// 增加模板使用次数
export async function incrementTemplateUsage(id: string) {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.rpc('increment_template_usage', {
      template_id: id
    });
    
    if (error) {
      // 如果RPC不可用，则使用基本更新
      const { data: template } = await safeQuery(supabase
        .from('templates')
        .select('usage_count'))
        .eq('id', id)
        .single();
      
      if (template) {
        const { data: updatedTemplate, error: updateError } = await safeQuery(supabase
          .from('templates'))
          .update({
            usage_count: (typeof (template as Record<string, unknown>).usage_count === 'number' 
              ? (template as Record<string, unknown>).usage_count as number 
              : 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select("*")
          .single();
        
        if (updateError) {
          console.error(`增加模板 ${id} 使用次数失败:`, updateError);
          throw updateError;
        }
        
        return updatedTemplate as Template;
      }
    }
    
    return data;
  } catch (error) {
    console.error(`增加模板 ${id} 使用次数失败:`, error);
    throw error;
  }
}

const templatesRepository = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementTemplateUsage
};

export default templatesRepository; 