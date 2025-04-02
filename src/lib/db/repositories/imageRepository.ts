/**
 * 图片数据仓库
 * 处理图片相关的数据库操作
 */
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase';
import { TABLES } from '../schema';
import { safeQuery } from '../utils/queryBuilder';

// 图片表结构接口
export interface Image {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  storage_path: string;
  article_id?: string;
  created_at: string;
  updated_at: string;
}

// 添加图片表名
export const IMAGES_TABLE = 'images';

/**
 * 获取文章的所有图片
 */
export async function getImagesByArticleId(articleId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from(IMAGES_TABLE)
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false }));
  
  if (error) {
    console.error('获取文章图片失败:', error);
    throw error;
  }
  
  return data as Image[];
}

/**
 * 上传图片并保存记录
 */
export async function uploadImage(file: File, articleId?: string) {
  const supabase = getSupabaseClient();
  const bucketName = 'article-images';
  
  try {
    // 生成唯一文件名
    const fileName = `${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
    
    // 上传文件到Supabase存储
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('文件上传失败:', uploadError);
      throw uploadError;
    }
    
    // 获取文件的公共URL
    const { data: urlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    // 将图片信息保存到数据库
    const imageData = {
      id: uuidv4(),
      file_name: fileName,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      url: urlData.publicUrl,
      storage_path: uploadData.path,
      article_id: articleId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await safeQuery(supabase
      .from(IMAGES_TABLE)
      .insert(imageData)
      .select('*')
      .single());
    
    if (error) {
      console.error('保存图片记录失败:', error);
      throw error;
    }
    
    return data as unknown as Image;
  } catch (error) {
    console.error('图片上传过程中出错:', error);
    throw error;
  }
}

/**
 * 更新图片关联的文章ID
 */
export async function updateImageArticleId(imageId: string, articleId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from(IMAGES_TABLE)
    .update({ article_id: articleId })
    .eq('id', imageId)
    .select('*')
    .single());
  
  if (error) {
    console.error('更新图片文章ID失败:', error);
    throw error;
  }
  
  return data as unknown as Image;
}

/**
 * 删除图片
 */
export async function deleteImage(imageId: string) {
  const supabase = getSupabaseClient();
  const bucketName = 'article-images';
  
  try {
    // 先获取图片信息
    const { data: image, error: getError } = await safeQuery(supabase
      .from(IMAGES_TABLE)
      .select('*')
      .eq('id', imageId)
      .single());
    
    if (getError) {
      console.error('获取图片信息失败:', getError);
      throw getError;
    }
    
    if (!image) {
      throw new Error(`未找到ID为${imageId}的图片`);
    }
    
    // 确保image是Image类型
    const typedImage = image as unknown as Image;
    
    // 删除存储中的文件
    const { error: storageError } = await supabase
      .storage
      .from(bucketName)
      .remove([typedImage.storage_path]);
    
    if (storageError) {
      console.error('删除存储文件失败:', storageError);
      // 继续删除数据库记录
    }
    
    // 删除数据库记录
    const { error: dbError } = await safeQuery(supabase
      .from(IMAGES_TABLE)
      .delete()
      .eq('id', imageId));
    
    if (dbError) {
      console.error('删除图片记录失败:', dbError);
      throw dbError;
    }
    
    return true;
  } catch (error) {
    console.error('删除图片过程中出错:', error);
    throw error;
  }
}

/**
 * 根据URL获取图片
 */
export async function getImagesByUrl(imageUrl: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await safeQuery(supabase
    .from(IMAGES_TABLE)
    .select('*')
    .eq('url', imageUrl)
    .order('created_at', { ascending: false }));
  
  if (error) {
    console.error('根据URL获取图片失败:', error);
    throw error;
  }
  
  return data as Image[];
} 